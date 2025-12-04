import React, { useState } from 'react';
import { Product, WhatsAppOrder, OrderStatus, CartItem } from '../types';
import { Share2, Plus, Phone, Clock, CheckCircle, Package, ArrowRight, Trash2, ShoppingBag } from 'lucide-react';

interface WhatsAppOrdersProps {
  products: Product[];
  orders: WhatsAppOrder[];
  onAddOrder: (order: WhatsAppOrder) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onFinalizeOrder: (order: WhatsAppOrder) => void;
}

const WhatsAppOrders: React.FC<WhatsAppOrdersProps> = ({ 
  products, 
  orders, 
  onAddOrder, 
  onUpdateStatus, 
  onFinalizeOrder 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>(products[0]?.id || '');

  // --- Menu Sharing Logic ---
  const handleShareMenu = () => {
    const availableProducts = products.filter(p => p.stock > 0);
    
    let menuText = "👋 *¡Hola! Aquí tienes nuestro menú de hoy:*\n\n";
    
    // Group by category for better UX
    const categories = Array.from(new Set(availableProducts.map(p => p.category)));
    
    categories.forEach(cat => {
      menuText += `*${cat}*\n`;
      availableProducts
        .filter(p => p.category === cat)
        .forEach(p => {
          menuText += `• ${p.name}: Bs ${p.price.toFixed(2)}\n`;
        });
      menuText += "\n";
    });

    menuText += "📍 _Haz tu pedido respondiendo a este mensaje._";

    const url = `https://wa.me/?text=${encodeURIComponent(menuText)}`;
    window.open(url, '_blank');
  };

  // --- New Order Logic ---
  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setNewOrderItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveItem = (id: string) => {
    setNewOrderItems(prev => prev.filter(i => i.id !== id));
  };

  const calculateTotal = (items: CartItem[]) => items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrderItems.length === 0) return;

    const newOrder: WhatsAppOrder = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: newOrderCustomer,
      phoneNumber: newOrderPhone,
      items: newOrderItems,
      total: calculateTotal(newOrderItems),
      status: 'PENDIENTE',
      createdAt: new Date().toISOString()
    };

    onAddOrder(newOrder);
    setIsModalOpen(false);
    setNewOrderCustomer('');
    setNewOrderPhone('');
    setNewOrderItems([]);
  };

  // --- UI Helpers ---
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PREPARACION': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LISTO': return 'bg-green-100 text-green-800 border-green-200';
      case 'ENTREGADO': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'ENTREGADO');
  const pastOrders = orders.filter(o => o.status === 'ENTREGADO'); // Optional: Show history

  return (
    <div className="p-4 md:p-8 pb-24 h-full bg-gray-50 overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-coffee-900 flex items-center gap-2">
            <Phone className="w-8 h-8 text-green-600" />
            Pedidos WhatsApp
          </h2>
          <p className="text-gray-500">Gestiona pedidos remotos y comparte tu menú digital.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleShareMenu}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <Share2 className="w-4 h-4" /> Compartir Menú
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Kanban Board / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
            <p>No hay pedidos activos.</p>
          </div>
        ) : (
          activeOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800">{order.customerName}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Phone className="w-3 h-3" /> {order.phoneNumber}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="p-4 flex-1">
                <ul className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex justify-between border-b border-dashed border-gray-100 pb-1 last:border-0">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-mono text-gray-500">Bs {(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                {order.notes && (
                  <p className="text-xs text-gray-500 italic bg-yellow-50 p-2 rounded mb-2">
                    Nota: {order.notes}
                  </p>
                )}
                <div className="flex justify-between items-center font-bold text-coffee-800 text-lg border-t pt-2">
                  <span>Total</span>
                  <span>Bs {order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2">
                {order.status === 'PENDIENTE' && (
                  <button 
                    onClick={() => onUpdateStatus(order.id, 'PREPARACION')}
                    className="col-span-2 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 font-medium text-sm transition-colors"
                  >
                    <Package className="w-4 h-4" /> A Preparación
                  </button>
                )}
                {order.status === 'PREPARACION' && (
                  <button 
                    onClick={() => onUpdateStatus(order.id, 'LISTO')}
                    className="col-span-2 flex items-center justify-center gap-2 bg-yellow-100 text-yellow-700 py-2 rounded-lg hover:bg-yellow-200 font-medium text-sm transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Marcar Listo
                  </button>
                )}
                {order.status === 'LISTO' && (
                  <button 
                    onClick={() => onFinalizeOrder(order)}
                    className="col-span-2 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-bold text-sm shadow-sm transition-colors animate-pulse"
                  >
                    <ArrowRight className="w-4 h-4" /> Entregar y Cobrar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Nuevo Pedido Manual</h3>
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <input 
                    required 
                    value={newOrderCustomer}
                    onChange={e => setNewOrderCustomer(e.target.value)}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" 
                    placeholder="Nombre"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input 
                    required 
                    value={newOrderPhone}
                    onChange={e => setNewOrderPhone(e.target.value)}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" 
                    placeholder="+54 9..."
                  />
                </div>
              </div>

              <div className="border-t border-b py-4 my-2">
                <div className="flex gap-2 mb-2">
                  <select 
                    value={selectedProduct}
                    onChange={e => setSelectedProduct(e.target.value)}
                    className="flex-1 border rounded-lg p-2 outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - Bs {p.price}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="bg-coffee-100 text-coffee-700 p-2 rounded-lg hover:bg-coffee-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-2 max-h-32 overflow-y-auto space-y-2">
                  {newOrderItems.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">Sin ítems</p> : 
                    newOrderItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">Bs {(item.price * item.quantity).toFixed(2)}</span>
                          <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))
                  }
                </div>
                <div className="flex justify-between items-center mt-2 font-bold text-gray-800">
                  <span>Total Estimado:</span>
                  <span>Bs {calculateTotal(newOrderItems).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={newOrderItems.length === 0}
                  className="px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700 disabled:opacity-50"
                >
                  Crear Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppOrders;