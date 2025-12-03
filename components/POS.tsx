import React, { useState, useRef, useEffect } from 'react';
import { Product, CartItem, Sale, User } from '../types';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, ArrowRight, User as UserIcon, FileText, Printer, Send, Smartphone, Mail, X, PlusCircle } from 'lucide-react';

interface POSProps {
  products: Product[];
  currentUser: User;
  onCompleteSale: (sale: Sale) => void;
  onAddProduct: (product: Product) => void;
}

const POS: React.FC<POSProps> = ({ products, currentUser, onCompleteSale, onAddProduct }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // New Checkout Fields
  const [customerType, setCustomerType] = useState<'PUBLIC' | 'FISCAL'>('PUBLIC');
  const [customerName, setCustomerName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [documentType, setDocumentType] = useState<'FACTURA' | 'RECIBO' | 'NINGUNO'>('RECIBO');
  const [deliveryMethod, setDeliveryMethod] = useState<'IMPRESO' | 'DIGITAL_EMAIL' | 'DIGITAL_WA' | 'NONE'>('IMPRESO');
  const [contactInfo, setContactInfo] = useState(''); // Email or Phone for delivery

  // Add Product State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const changeDue = parseFloat(cashReceived || '0') - cartTotal;

  // Simulate scanning by checking if input matches exactly a barcode
  useEffect(() => {
    const matchedProduct = products.find(p => p.barcode === searchTerm);
    if (matchedProduct) {
      addToCart(matchedProduct);
      setSearchTerm(''); // Clear after "scan"
    }
  }, [searchTerm, products]);

  // Reset checkout form when opening modal
  useEffect(() => {
    if (isCheckoutOpen) {
      setPaymentMethod('Efectivo');
      setCashReceived('');
      setCustomerType('PUBLIC');
      setCustomerName('Público General');
      setTaxId('');
      setDocumentType('RECIBO');
      setDeliveryMethod('IMPRESO');
      setContactInfo('');
    }
  }, [isCheckoutOpen]);

  // Auto-switch document type based on customer type
  useEffect(() => {
    if (customerType === 'FISCAL') {
      setDocumentType('FACTURA');
      setCustomerName(''); // Clear default name
    } else {
      setDocumentType('RECIBO');
      setCustomerName('Público General');
    }
  }, [customerType]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Validation
    if (documentType === 'FACTURA') {
        if (!customerName.trim() || !taxId.trim()) {
            alert('Para generar Factura, debe ingresar Nombre y NIT/ID Fiscal.');
            return;
        }
    }

    if ((deliveryMethod === 'DIGITAL_EMAIL' || deliveryMethod === 'DIGITAL_WA') && !contactInfo.trim()) {
        alert('Ingrese el Email o WhatsApp para el envío del comprobante.');
        return;
    }

    const sale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      cashierName: currentUser.name,
      customerName: customerName,
      taxId: customerType === 'FISCAL' ? taxId : undefined,
      documentType: documentType,
      deliveryMethod: deliveryMethod
    };

    onCompleteSale(sale);
    
    // Simulation of Action
    let message = `¡Venta registrada con éxito!\n`;
    if (documentType !== 'NINGUNO') {
        message += `Comprobante: ${documentType} generado.\n`;
        if (deliveryMethod === 'IMPRESO') message += "🖨️ Enviando a impresora térmica...";
        if (deliveryMethod === 'DIGITAL_WA') {
            const waLink = `https://wa.me/${contactInfo.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${customerName}, gracias por tu compra en Control Alfajores. Aquí tienes tu comprobante digital por $${cartTotal.toFixed(2)}.`)}`;
            window.open(waLink, '_blank');
        }
    }
    
    alert(message);
    setCart([]);
    setIsCheckoutOpen(false);
  };

  const handleQuickAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      barcode: formData.get('barcode') as string || Math.random().toString(36).substr(2, 6).toUpperCase(),
      price: parseFloat(formData.get('price') as string),
      cost: parseFloat(formData.get('cost') as string) || 0,
      stock: parseInt(formData.get('stock') as string),
      minStock: 10, // Default for quick add
      category: formData.get('category') as any,
      unit: 'unid', // Default for quick add
    };

    onAddProduct(newProduct);
    setIsAddProductOpen(false);
    
    // Optionally ask if they want to add it to the cart immediately
    if (window.confirm(`Producto "${newProduct.name}" creado. ¿Añadir al carrito actual?`)) {
        addToCart(newProduct);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 md:flex-row overflow-hidden pb-16 md:pb-0 relative">
      {/* Product Grid */}
      <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
        <div className="sticky top-0 bg-gray-50 pt-2 pb-4 z-10 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-coffee-900">Nueva Venta</h2>
                <button 
                    onClick={() => setIsAddProductOpen(true)}
                    className="flex items-center gap-1 text-sm bg-coffee-100 text-coffee-700 px-3 py-2 rounded-lg hover:bg-coffee-200 transition-colors font-medium"
                >
                    <PlusCircle className="w-4 h-4" /> Nuevo Ítem
                </button>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Escanear código o buscar producto..."
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    autoFocus
                />
                <QrCode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-coffee-600 w-5 h-5 cursor-pointer" />
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-coffee-300 transition-all text-left group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-coffee-600 bg-coffee-50 px-2 py-1 rounded-md">{product.category}</span>
                </div>
                <h3 className="font-medium text-gray-800 leading-tight mb-1 group-hover:text-coffee-700">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-3">Stock: {product.stock}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-bold text-coffee-800">${product.price.toFixed(2)}</span>
                <div className="bg-coffee-100 p-1.5 rounded-full text-coffee-700 group-hover:bg-coffee-500 group-hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="hidden md:flex flex-col w-96 bg-white border-l border-gray-200 z-20">
        <div className="p-4 bg-coffee-900 text-white flex justify-between items-center shadow-md">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Carrito Actual
          </h3>
          <span className="bg-coffee-700 px-3 py-1 rounded-full text-xs">{cart.length} ítems</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{item.name}</h4>
                  <p className="text-coffee-600 font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium w-4 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-4 text-xl font-bold text-gray-800">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cart.length === 0}
            className="w-full bg-coffee-600 hover:bg-coffee-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            Pagar <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
            
            {/* Left Col: Order Summary */}
            <div className="md:w-1/3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Resumen de Orden
                </h3>
                <div className="space-y-3 mb-6">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.quantity}x {item.name}</span>
                            <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-bold text-coffee-800">
                        <span>Total a Pagar</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Right Col: Checkout Form */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Finalizar Venta</h2>
                    <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6 flex-1">
                    
                    {/* Section 1: Customer Data */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <UserIcon className="w-4 h-4" /> 1. Datos del Cliente
                        </label>
                        <div className="flex gap-2 mb-2">
                            <button 
                                onClick={() => setCustomerType('PUBLIC')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${customerType === 'PUBLIC' ? 'bg-coffee-50 border-coffee-500 text-coffee-700' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                Público General
                            </button>
                            <button 
                                onClick={() => setCustomerType('FISCAL')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${customerType === 'FISCAL' ? 'bg-coffee-50 border-coffee-500 text-coffee-700' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                Cliente (Factura)
                            </button>
                        </div>

                        {customerType === 'FISCAL' && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                <input 
                                    placeholder="Nombre / Razón Social" 
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="col-span-2 md:col-span-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-coffee-500"
                                />
                                <input 
                                    placeholder="NIT / ID Fiscal" 
                                    value={taxId}
                                    onChange={e => setTaxId(e.target.value)}
                                    className="col-span-2 md:col-span-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-coffee-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Section 2: Document Type */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4" /> 2. Comprobante
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['FACTURA', 'RECIBO', 'NINGUNO'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setDocumentType(type)}
                                    disabled={type === 'FACTURA' && customerType === 'PUBLIC'}
                                    className={`py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-1 transition-colors
                                        ${documentType === type 
                                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                            : 'bg-white border-gray-200 text-gray-600'}
                                        ${type === 'FACTURA' && customerType === 'PUBLIC' ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Payment */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> 3. Pago
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setPaymentMethod('Efectivo')}
                                className={`p-2 rounded-lg text-sm font-medium border flex flex-col items-center gap-1 ${paymentMethod === 'Efectivo' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                <Banknote className="w-4 h-4" /> Efectivo
                            </button>
                            <button
                                onClick={() => setPaymentMethod('Tarjeta')}
                                className={`p-2 rounded-lg text-sm font-medium border flex flex-col items-center gap-1 ${paymentMethod === 'Tarjeta' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                <CreditCard className="w-4 h-4" /> Tarjeta
                            </button>
                            <button
                                onClick={() => setPaymentMethod('Transferencia')}
                                className={`p-2 rounded-lg text-sm font-medium border flex flex-col items-center gap-1 ${paymentMethod === 'Transferencia' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                <QrCode className="w-4 h-4" /> Transf.
                            </button>
                        </div>
                        {paymentMethod === 'Efectivo' && (
                            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                                <input 
                                    type="number" 
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    className="w-32 border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-green-500"
                                    placeholder="Recibido"
                                />
                                {parseFloat(cashReceived || '0') >= cartTotal && (
                                    <span className="text-green-600 font-bold">Cambio: ${changeDue.toFixed(2)}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section 4: Delivery */}
                    {documentType !== 'NINGUNO' && (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Send className="w-4 h-4" /> 4. Entrega de Comprobante
                            </label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setDeliveryMethod('IMPRESO')}
                                    className={`flex-1 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${deliveryMethod === 'IMPRESO' ? 'bg-gray-800 text-white' : 'border-gray-200 text-gray-600'}`}
                                >
                                    <Printer className="w-4 h-4" /> Imprimir
                                </button>
                                <button 
                                    onClick={() => setDeliveryMethod('DIGITAL_WA')}
                                    className={`flex-1 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${deliveryMethod === 'DIGITAL_WA' ? 'bg-green-600 text-white' : 'border-gray-200 text-gray-600'}`}
                                >
                                    <Smartphone className="w-4 h-4" /> WhatsApp
                                </button>
                                <button 
                                    onClick={() => setDeliveryMethod('DIGITAL_EMAIL')}
                                    className={`flex-1 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${deliveryMethod === 'DIGITAL_EMAIL' ? 'bg-blue-600 text-white' : 'border-gray-200 text-gray-600'}`}
                                >
                                    <Mail className="w-4 h-4" /> Email
                                </button>
                            </div>
                            {(deliveryMethod === 'DIGITAL_EMAIL' || deliveryMethod === 'DIGITAL_WA') && (
                                <input 
                                    placeholder={deliveryMethod === 'DIGITAL_EMAIL' ? "cliente@email.com" : "Número de Whatsapp (+54...)"}
                                    value={contactInfo}
                                    onChange={e => setContactInfo(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-coffee-500"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-4 border-t border-gray-100 flex gap-4">
                    <button 
                        onClick={() => setIsCheckoutOpen(false)}
                        className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleCheckout}
                        disabled={paymentMethod === 'Efectivo' && (parseFloat(cashReceived || '0') < cartTotal)}
                        className="flex-[2] bg-coffee-600 text-white font-bold py-3 rounded-xl hover:bg-coffee-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Confirmar Venta (${cartTotal.toFixed(2)})
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal (Quick Add for POS) */}
      {isAddProductOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button onClick={() => setIsAddProductOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <PlusCircle className="w-6 h-6 text-coffee-600" />
                    Alta Rápida de Producto
                </h3>
                <form onSubmit={handleQuickAddProduct} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                        <input name="name" required placeholder="Ej. Alfajor Nuez" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta ($)</label>
                            <input type="number" step="0.01" name="price" required className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo ($)</label>
                            <input type="number" step="0.01" name="cost" placeholder="(Opcional)" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                            <input type="number" name="stock" required defaultValue="10" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código Barra</label>
                            <input name="barcode" placeholder="(Opcional)" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select name="category" className="w-full border rounded-lg p-2 outline-none">
                            <option value="Alfajor">Alfajor</option>
                            <option value="Bebida">Bebida</option>
                            <option value="Snack">Snack</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-3 mt-6 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsAddProductOpen(false)}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 bg-coffee-600 text-white font-bold py-3 rounded-lg hover:bg-coffee-700 shadow-lg transition-all"
                        >
                            Guardar Producto
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default POS;