
import React, { useState } from 'react';
import { Product, ProductCategory } from '../types';
import { ShoppingCart, Plus, Minus, X, ChevronRight, CheckCircle, UtensilsCrossed, Coffee, IceCream, Zap, Loader } from 'lucide-react';
import { KitchenService } from '../services/kitchenService';

interface CustomerMenuProps {
  products: Product[];
  tableId: string;
}

// Updated Categories Order as requested
const CATEGORIES: ProductCategory[] = [
    'Bebidas frías',
    'Bebidas calientes',
    'Pasteleria', 
    'Alfajores artesanales', 
    'Snacks salados', 
    'Otro'
];

const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
        case 'Bebidas calientes': return <Coffee className="w-6 h-6" />;
        case 'Bebidas frías': return <Zap className="w-6 h-6" />;
        case 'Pasteleria':
        case 'Alfajores artesanales': return <IceCream className="w-6 h-6" />;
        default: return <UtensilsCrossed className="w-6 h-6" />;
    }
};

const CustomerMenu: React.FC<CustomerMenuProps> = ({ products, tableId }) => {
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
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
      tableId: `Mesa ${tableId} (Web)`,
      items: cart.map(i => ({ name: i.product.name, quantity: i.quantity })),
      userId: 'cliente-web'
    });

    setIsOrderPlaced(true);
    setCart([]);
    setIsCartOpen(false);
  };

  // --- LOADING STATE ---
  if (products.length === 0) {
      return (
          <div className="min-h-screen bg-[#F5F0E6] flex flex-col items-center justify-center p-8 text-center">
              <div className="animate-spin text-[#432818] mb-4">
                  <Loader className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-serif text-[#432818]">Cargando la carta...</h2>
              <p className="text-[#8c6b5d] font-script text-xl mt-2">Preparando cosas ricas</p>
          </div>
      );
  }

  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
        <div className="bg-[#432818] p-6 rounded-full shadow-xl mb-6 border-4 border-[#D4A574]">
            <CheckCircle className="w-20 h-20 text-[#F5F0E6]" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-[#432818] mb-2">¡Pedido Recibido!</h1>
        <p className="text-[#5D4037] mb-8 font-serif text-lg">Estamos preparando tus delicias para la <strong>Mesa {tableId}</strong>.</p>
        <button 
          onClick={() => setIsOrderPlaced(false)}
          className="bg-[#432818] text-[#F5F0E6] px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#5D4037] transition-transform hover:scale-105 uppercase tracking-wider text-sm"
        >
          Volver a la Carta
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E6] pb-24 relative font-serif text-[#432818] overflow-x-hidden selection:bg-[#D4A574] selection:text-white">
      {/* Background Texture */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

      {/* Hero Header */}
      <header className="relative pt-12 pb-8 px-6 text-center border-b-4 border-double border-[#432818]/20 bg-[#F5F0E6]">
         <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#432818] flex items-center justify-center mb-4 shadow-sm bg-white">
                <Coffee className="w-8 h-8" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-2 uppercase font-serif">Dulce Mimo</h1>
            <p className="text-2xl text-[#8c6b5d] font-script">Coffee Shop & Alfajores</p>
            <div className="w-24 h-1 bg-[#432818] mt-4 mb-2"></div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-70">Menú Digital • Mesa {tableId}</p>
         </div>

         {/* Floating Cart */}
         {cart.length > 0 && (
            <button 
                onClick={() => setIsCartOpen(true)}
                className="fixed bottom-6 right-6 z-30 bg-[#432818] text-[#F5F0E6] p-4 rounded-full shadow-2xl animate-bounce flex items-center justify-center border-2 border-[#D4A574]"
            >
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-[#D4A574] text-[#432818] text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border border-[#432818]">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
            </button>
        )}
      </header>

      {/* Menu Sections */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-12">
        {CATEGORIES.map((category) => {
            // Filter and Sort by displayOrder
            const categoryProducts = products
                .filter(p => p.category === category)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

            if (categoryProducts.length === 0) return null;

            return (
                <section key={category} className="relative">
                    {/* Category Title with Lines */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px bg-[#432818]/30 flex-1"></div>
                        <div className="flex flex-col items-center">
                            <CategoryIcon category={category} />
                            <h2 className="text-2xl font-bold uppercase tracking-widest mt-1 font-serif">{category}</h2>
                        </div>
                        <div className="h-px bg-[#432818]/30 flex-1"></div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 gap-y-6">
                        {categoryProducts.map(product => {
                            const hasStock = product.stock > 0;
                            const cartQty = cart.find(i => i.product.id === product.id)?.quantity || 0;

                            return (
                                <div key={product.id} className={`group flex justify-between items-end gap-2 pb-4 border-b border-[#432818]/10 last:border-0 ${!hasStock ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between w-full">
                                            <h3 className="text-lg font-bold text-[#432818] group-hover:text-[#D4A574] transition-colors font-serif">
                                                {product.name}
                                            </h3>
                                            <div className="flex-1 mx-2 border-b-2 border-dotted border-[#432818]/20 h-4"></div>
                                            <span className="text-xl font-bold text-[#432818] font-serif">Bs {product.price.toFixed(2)}</span>
                                        </div>
                                        {product.image && (
                                            <div className="mt-2 w-full h-40 overflow-hidden rounded-lg opacity-90 hidden group-hover:block transition-all duration-500 ease-in-out shadow-lg">
                                                <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                                            </div>
                                        )}
                                        {!hasStock && <span className="text-[10px] font-bold text-red-500 uppercase mt-1 block">Agotado temporalmente</span>}
                                    </div>

                                    <div className="pb-1 pl-2">
                                        {hasStock ? (
                                            cartQty > 0 ? (
                                                <div className="flex items-center gap-2 bg-[#432818] text-[#F5F0E6] px-3 py-1 rounded-full shadow-md">
                                                    <span className="text-xs font-bold">{cartQty}</span>
                                                    <button onClick={() => addToCart(product)} className="hover:text-[#D4A574]"><Plus className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => addToCart(product)}
                                                    className="w-8 h-8 rounded-full border border-[#432818]/30 flex items-center justify-center hover:bg-[#432818] hover:text-[#F5F0E6] transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            )
                                        ) : (
                                            <div className="w-8 h-8 flex items-center justify-center">
                                                <X className="w-4 h-4 text-red-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            );
        })}
      </div>

      <div className="text-center py-12 opacity-60">
        <Coffee className="w-6 h-6 mx-auto mb-2" />
        <p className="text-xs uppercase tracking-widest">Dulce Mimo • Hecho con Amor</p>
      </div>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setIsCartOpen(false)}>
            <div className="w-full md:w-96 bg-[#F5F0E6] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l-4 border-[#D4A574]" onClick={e => e.stopPropagation()}>
                <div className="p-6 bg-[#432818] text-[#F5F0E6] flex justify-between items-center">
                    <h2 className="text-xl font-bold font-serif italic">Tu Pedido</h2>
                    <button onClick={() => setIsCartOpen(false)} className="hover:text-[#D4A574]"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.map(item => (
                        <div key={item.product.id} className="flex justify-between items-center border-b border-[#432818]/10 pb-4">
                            <div>
                                <p className="font-bold text-lg leading-none font-serif text-[#432818]">{item.product.name}</p>
                                <p className="text-sm opacity-70 mt-1">Bs {item.product.price.toFixed(2)} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-full border border-[#432818]/20 shadow-sm">
                                <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:text-red-500 text-[#432818]"><Minus className="w-4 h-4" /></button>
                                <span className="font-bold w-4 text-center text-[#432818]">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:text-green-600 text-[#432818]"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {cart.length > 0 && (
                    <div className="p-6 bg-white border-t border-[#432818]/10">
                        <div className="flex justify-between text-2xl font-bold text-[#432818] mb-6 font-serif">
                            <span>Total</span>
                            <span>Bs {total.toFixed(2)}</span>
                        </div>
                        <button 
                            onClick={handlePlaceOrder}
                            className="w-full bg-[#432818] text-[#F5F0E6] font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 text-lg hover:bg-[#5D4037] active:scale-95 transition-all uppercase tracking-wider"
                        >
                            Confirmar <ChevronRight className="w-5 h-5" />
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
