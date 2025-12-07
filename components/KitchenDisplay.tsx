import React, { useEffect, useState } from 'react';
import { KitchenService } from '../services/kitchenService';
import { KitchenOrder } from '../types';
import { Clock, CheckCircle, Utensils, Flame, ChefHat, QrCode, X, Printer, ExternalLink } from 'lucide-react';

const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Definimos las 6 mesas fijas
  const TABLES = [1, 2, 3, 4, 5, 6];

  // B. La Magia del Tiempo Real (onSnapshot simulation)
  useEffect(() => {
    const unsubscribe = KitchenService.subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });
    return () => unsubscribe();
  }, []);

  // C. Lógica de la Interfaz (UI) - Filtro y Clasificación
  const pendingOrders = orders
    .filter(o => o.status === 'PENDING')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Oldest first for kitchen

  const deliveredOrders = orders
    .filter(o => o.status === 'DELIVERED')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Newest finished first
    .slice(0, 10); // Show only last 10 finished

  // D. La Acción de Entrega
  const handleMarkDelivered = (id: string) => {
    KitchenService.updateOrderStatus(id, 'DELIVERED');
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedMinutes = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    return Math.floor(diff / 60000);
  };

  const generateQrUrl = (tableId: number) => {
      const baseUrl = window.location.origin + window.location.pathname;
      const params = `?view=customer&table=${tableId}`;
      // Usamos la API de goqr.me o qrserver para generar la imagen
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl + params)}`;
  };

  const openTableLink = (tableId: number) => {
      const url = `${window.location.origin}${window.location.pathname}?view=customer&table=${tableId}`;
      window.open(url, '_blank');
  };

  return (
    <div className="h-full bg-gray-100 p-4 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-coffee-600" />
          Pedidos de Mesa
        </h2>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsQrModalOpen(true)}
                className="bg-coffee-600 hover:bg-coffee-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors"
            >
                <QrCode className="w-5 h-5" /> Ver QRs de Mesas (1-6)
            </button>
            <div className="text-sm text-gray-500 flex gap-4 border-l pl-4 border-gray-300">
                <span className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-red-500 rounded-full"></div> Pendientes: {pendingOrders.length}</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded-full"></div> Entregados: {deliveredOrders.length}</span>
            </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* PENDING COLUMN */}
        <div className="flex-1 flex flex-col bg-red-50/50 rounded-2xl border border-red-100 overflow-hidden">
          <div className="bg-red-100 p-4 border-b border-red-200 flex justify-between items-center">
            <h3 className="font-bold text-red-800 text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 animate-pulse" /> EN COLA (Pendientes)
            </h3>
            <span className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                {pendingOrders.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pendingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-red-300 opacity-50">
                    <Utensils className="w-16 h-16 mb-2" />
                    <p>Todo tranquilo en la cocina</p>
                </div>
            ) : (
                pendingOrders.map(order => {
                    const mins = getElapsedMinutes(order.timestamp);
                    return (
                        <div key={order.id} className={`bg-white rounded-xl shadow-md border-l-4 ${mins > 15 ? 'border-red-600' : 'border-yellow-500'} p-4 animate-in slide-in-from-left duration-300`}>
                            <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-900">{order.tableId}</h4>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Orden #{order.id.substring(0,4)}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-gray-600 font-mono text-sm">
                                        <Clock className="w-3 h-3" /> {formatTime(order.timestamp)}
                                    </div>
                                    <div className={`text-xs font-bold mt-1 ${mins > 15 ? 'text-red-600' : 'text-yellow-600'}`}>
                                        Hace {mins} min
                                    </div>
                                </div>
                            </div>

                            <ul className="space-y-2 mb-4">
                                {order.items.map((item, i) => (
                                    <li key={i} className="flex justify-between items-center text-gray-800 font-medium text-lg">
                                        <span>{item.quantity}x {item.name}</span>
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => handleMarkDelivered(order.id)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" /> MARCAR LISTO
                            </button>
                        </div>
                    );
                })
            )}
          </div>
        </div>

        {/* DELIVERED COLUMN */}
        <div className="w-1/3 flex flex-col bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden hidden md:flex">
          <div className="bg-gray-200 p-4 border-b border-gray-300">
            <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Recientes
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {deliveredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg p-3 border border-gray-100 opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-700">{order.tableId}</span>
                        <span className="text-xs text-gray-400">{formatTime(order.timestamp)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        {order.items.length} ítems completados
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- MODAL QRs DE MESAS --- */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl p-8 shadow-2xl relative my-8">
                <button 
                    onClick={() => setIsQrModalOpen(false)} 
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="mb-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                        <QrCode className="w-8 h-8 text-coffee-600" />
                        Códigos QR por Mesa
                    </h3>
                    <p className="text-gray-500 mt-2">
                        Imprime estos códigos y pégalos en las mesas. Los clientes podrán escanearlos para ver el menú y hacer pedidos directos a cocina.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {TABLES.map(tableId => (
                        <div key={tableId} className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-white p-2 rounded-lg border border-gray-100 mb-4">
                                <img 
                                    src={generateQrUrl(tableId)} 
                                    alt={`QR Mesa ${tableId}`}
                                    className="w-40 h-40"
                                />
                            </div>
                            <h4 className="text-xl font-bold text-coffee-800 mb-2">MESA {tableId}</h4>
                            <button 
                                onClick={() => openTableLink(tableId)}
                                className="text-sm text-coffee-600 hover:text-coffee-800 hover:underline flex items-center gap-1"
                            >
                                <ExternalLink className="w-3 h-3" /> Probar enlace
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-center border-t border-gray-100 pt-6">
                    <button 
                        onClick={() => window.print()} 
                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
                    >
                        <Printer className="w-5 h-5" /> Imprimir esta página
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;