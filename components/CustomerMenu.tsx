import React, { useState } from 'react';
import { Product, ProductCategory } from '../types';
import { ShoppingCart, Plus, Minus, X, ChevronRight, CheckCircle, UtensilsCrossed } from 'lucide-react';
import { KitchenService } from '../services/kitchenService';

interface CustomerMenuProps {
  products: Product[];
  tableId: string;
}

const CATEGORIES: ProductCategory[] = [
    'Alfajores artesanales', 
    'Pasteleria', 
    'Snacks salados', 
    'Bebidas calientes', 
    'Bebidas frías',
    'Otro'
];

const CustomerMenu: React.FC<CustomerMenuProps> = ({ products, tableId }) => {
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('Alfajores artesanales');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    KitchenService.addOrder({
      tableId: `Mesa ${tableId} (QR)`,
      items: cart.map(i => ({ name: i.product.name, quantity: i.quantity })),
      userId: 'cliente-qr'
    });

    setIsOrderPlaced(true);
    setCart([]);
    setIsCartOpen(false);
  };

  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
        <div className="bg-white p-8 rounded-full shadow-lg mb-6">
            <CheckCircle className="w-24 h-24 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-green-800 mb-2">¡Pedido Enviado!</h1>
        <p className="text-green-700 mb-8">La cocina ha recibido tu pedido para la <strong>Mesa {tableId}</strong>.</p>
        <button 
          onClick={() => setIsOrderPlaced(false)}
          className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-transform hover:scale-105"
        >
          Pedir algo más
        </button>
      </div>
    );
  }

  const filteredProducts = products.filter(p => p.category === activeCategory && p.stock > 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      {/* Header */}
      <div className="bg-coffee-900 text-white p-4 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="font-bold text-lg">Dulce Mimo</h1>
                <p className="text-xs text-coffee-200">Menú Digital • Mesa {tableId}</p>
            </div>
            {cart.length > 0 && (
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative bg-coffee-600 p-2 rounded-full animate-bounce"
                >
                    <ShoppingCart className="w-6 h-6 text-white" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                        {cart.reduce((acc, i) => acc + i.quantity, 0)}
                    </span>
                </button>
            )}
        </div>
        
        {/* Categories Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeCategory === cat 
                        ? 'bg-white text-coffee-900' 
                        : 'bg-coffee-800 text-coffee-200'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Product List */}
      <div className="p-4 space-y-4">
        {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl p-3 shadow-sm flex gap-4 border border-gray-100">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <UtensilsCrossed className="w-8 h-8" />
                        </div>
                    )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800 line-clamp-2">{product.name}</h3>
                        <p className="text-coffee-600 font-bold">Bs {product.price.toFixed(2)}</p>
                    </div>
                    <button 
                        onClick={() => addToCart(product)}
                        className="self-end bg-coffee-100 text-coffee-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 active:bg-coffee-200"
                    >
                        <Plus className="w-4 h-4" /> Agregar
                    </button>
                </div>
            </div>
        ))}
        {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
                <p>No hay productos disponibles en esta categoría.</p>
            </div>
        )}
      </div>

      {/* View Cart Modal/Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end animate-in slide-in-from-bottom duration-300">
            <div className="bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Tu Pedido</h2>
                    <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    {cart.map(item => (
                        <div key={item.product.id} className="flex justify-between items-center">
                            <div className="flex-1">
                                <p className="font-medium text-gray-800">{item.product.name}</p>
                                <p className="text-sm text-gray-500">Bs {item.product.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 bg-gray-100 rounded text-gray-600"><Minus className="w-4 h-4" /></button>
                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 bg-gray-100 rounded text-gray-600"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <p className="text-center text-gray-500 py-4">Tu carrito está vacío.</p>}
                </div>

                {cart.length > 0 && (
                    <div className="border-t pt-4">
                        <div className="flex justify-between text-xl font-bold text-coffee-900 mb-6">
                            <span>Total</span>
                            <span>Bs {total.toFixed(2)}</span>
                        </div>
                        <button 
                            onClick={handlePlaceOrder}
                            className="w-full bg-coffee-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg hover:bg-coffee-700 active:scale-95 transition-all"
                        >
                            Confirmar Pedido <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;