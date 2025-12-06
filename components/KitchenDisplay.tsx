import React, { useEffect, useState } from 'react';
import { KitchenService } from '../services/kitchenService';
import { KitchenOrder } from '../types';
import { Clock, CheckCircle, Utensils, Flame, ChefHat } from 'lucide-react';

const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);

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

  return (
    <div className="h-full bg-gray-100 p-4 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-coffee-600" />
          Pedidos de Mesa
        </h2>
        <div className="text-sm text-gray-500 flex gap-4">
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-red-500 rounded-full"></div> Pendientes: {pendingOrders.length}</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded-full"></div> Entregados: {deliveredOrders.length}</span>
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
    </div>
  );
};

export default KitchenDisplay;