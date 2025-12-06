import React, { useState, useRef, useEffect } from 'react';
import { Product, CartItem, Sale, User, ProductCategory } from '../types';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, ArrowRight, User as UserIcon, FileText, Printer, Send, Smartphone, Mail, X, PlusCircle, Edit2, FileDown, Upload, Download, RefreshCw, Image as ImageIcon, Camera, ScanBarcode } from 'lucide-react';

// Declare Html5Qrcode library from global scope (added via script tag in index.html)
declare const Html5Qrcode: any;

interface POSProps {
  products: Product[];
  currentUser: User;
  onCompleteSale: (sale: Sale) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onExportData: () => void;
  onImportData: (data: string) => void;
}

const CATEGORIES: ProductCategory[] = [
    'Alfajores artesanales', 
    'Pasteleria', 
    'Snacks salados', 
    'Bebidas calientes', 
    'Bebidas frías',
    'Otro'
];

const POS: React.FC<POSProps> = ({ 
    products, 
    currentUser, 
    onCompleteSale, 
    onAddProduct, 
    onUpdateProduct,
    onExportData,
    onImportData
}) => {
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
  const [contactInfo, setContactInfo] = useState('');

  // Product Management State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');

  // Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Scanner State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<any>(null); // To store the Html5Qrcode instance

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const changeDue = parseFloat(cashReceived || '0') - cartTotal;

  // Sound Effect
  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Frequency in Hz
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Volume

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, 100); // Beep duration 100ms
  };

  // --- External Scanner / Keyboard Input Logic ---
  useEffect(() => {
    // Logic to handle external scanners which type fast and hit enter
    const matchedProduct = products.find(p => p.barcode === searchTerm);
    if (matchedProduct) {
      playBeep();
      addToCart(matchedProduct);
      setSearchTerm(''); // Clear immediately for next scan
    }
  }, [searchTerm, products]);

  // --- Camera Scanner Logic ---
  useEffect(() => {
    if (isCameraScannerOpen) {
        // Allow a small delay for the modal DOM to render
        const timer = setTimeout(() => {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            html5QrCode.start(
                { facingMode: "environment" }, 
                config, 
                (decodedText: string) => {
                    // Success callback
                    if (decodedText !== lastScannedCode) {
                        setLastScannedCode(decodedText);
                        const product = products.find(p => p.barcode === decodedText);
                        
                        if (product) {
                            playBeep();
                            addToCart(product);
                            // Optional: Close scanner on success? 
                            // setIsCameraScannerOpen(false); 
                            // Better: Show a small toast inside modal and keep scanning
                        } else {
                            // Code scanned but product not found
                            console.log("Producto no encontrado:", decodedText);
                        }
                        
                        // Prevent rapid-fire duplicates of same scan within 1s
                        setTimeout(() => setLastScannedCode(null), 2000); 
                    }
                },
                (errorMessage: string) => {
                    // parse error, ignore
                }
            ).catch((err: any) => {
                console.error("Error starting scanner", err);
            });
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                }).catch((err: any) => console.error("Failed to stop scanner", err));
            }
        };
    }
  }, [isCameraScannerOpen, products]); // Re-bind if products change, but be careful not to restart scanner unnecessarily. 

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

  useEffect(() => {
    if (customerType === 'FISCAL') {
      setDocumentType('FACTURA');
      setCustomerName(''); 
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

  const generateReceiptHTML = (sale: Sale) => {
    const date = new Date(sale.date).toLocaleDateString('es-BO');
    const time = new Date(sale.date).toLocaleTimeString('es-BO');

    return `
      <html>
        <head>
          <title>Comprobante de Venta</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .title { font-size: 1.2rem; font-weight: bold; margin: 0; text-transform: uppercase; }
            .subtitle { font-size: 0.9rem; margin: 5px 0; }
            .info { font-size: 0.8rem; margin-bottom: 5px; }
            .client-info { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 0.85rem; }
            table { width: 100%; font-size: 0.85rem; margin-bottom: 10px; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #000; }
            td { padding: 4px 0; }
            .text-right { text-align: right; }
            .totals { border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; font-size: 1rem; }
            .footer { text-align: center; font-size: 0.7rem; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
            .qr-placeholder { background: #eee; width: 100px; height: 100px; margin: 10px auto; display: flex; align-items: center; justify-content: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">DULCE MIMO CAFÉ & ALFAJORES</h1>
            <p class="subtitle">Casa Matriz - Pando</p>
            <p class="info">NIT: 123456789</p>
            <p class="info">Tel: 72084802 - 73096391</p>
            <p class="info">${documentType} N°: ${sale.id}</p>
            <p class="info">Fecha: ${date} ${time}</p>
          </div>

          <div class="client-info">
            <p><strong>Cliente:</strong> ${sale.customerName}</p>
            ${sale.taxId ? `<p><strong>NIT/CI:</strong> ${sale.taxId}</p>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Detalle</th>
                <th class="text-right">Subt.</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${item.name}</td>
                  <td class="text-right">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div style="display:flex; justify-content:space-between;">
              <span>TOTAL Bs:</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <div class="qr-placeholder">QR FACTURA</div>
            <p>GRACIAS POR SU PREFERENCIA</p>
            <p>"EMITIDO POR SISTEMA WEB"</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
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
    
    if (documentType !== 'NINGUNO') {
        if (deliveryMethod === 'IMPRESO' || deliveryMethod === 'DIGITAL_WA') {
            const receiptWindow = window.open('', '_blank', 'width=400,height=600');
            if (receiptWindow) {
                receiptWindow.document.write(generateReceiptHTML(sale));
                receiptWindow.document.close();
            }
        }

        if (deliveryMethod === 'DIGITAL_WA') {
            const itemsList = cart.map(i => `${i.quantity}x ${i.name}`).join(', ');
            const waBody = `Hola *${customerName}*,\n\nGracias por tu compra en Dulce Mimo Café & Alfajores.\n\n*Detalle:*\n${itemsList}\n\n*Total: Bs ${cartTotal.toFixed(2)}*\n\n📄 _Adjunto encontrarás tu comprobante en PDF._`;
            const waLink = `https://wa.me/${contactInfo.replace(/\D/g,'')}?text=${encodeURIComponent(waBody)}`;
            setTimeout(() => {
                window.open(waLink, '_blank');
            }, 500);
        }
    }
    
    setCart([]);
    setIsCheckoutOpen(false);
  };

  // --- Handlers for Product Management ---
  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData: Product = {
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      barcode: formData.get('barcode') as string || Math.random().toString(36).substr(2, 6).toUpperCase(),
      price: parseFloat(formData.get('price') as string) || 0,
      cost: parseFloat(formData.get('cost') as string) || 0,
      stock: parseInt(formData.get('stock') as string) || 0,
      minStock: parseInt(formData.get('minStock') as string) || 5,
      category: formData.get('category') as any,
      unit: formData.get('unit') as string || 'unid',
      image: imageBase64 || editingProduct?.image
    };

    if (editingProduct) {
        onUpdateProduct(productData);
    } else {
        onAddProduct(productData);
        if (window.confirm(`Producto "${productData.name}" creado. ¿Añadir al carrito actual?`)) {
            addToCart(productData);
        }
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
    setImageBase64('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- File Import Handler ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onImportData(content);
        setIsSyncModalOpen(false);
      };
      reader.readAsText(file);
    }
  };

  // --- Product Filtering ---
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
                <h2 className="text-2xl font-bold text-coffee-900">Punto de Venta</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsSyncModalOpen(true)}
                        className="flex items-center gap-1 text-sm bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                        title="Sincronizar Datos"
                    >
                        <RefreshCw className="w-4 h-4" /> Sync
                    </button>
                    <button 
                        onClick={() => { setEditingProduct(null); setImageBase64(''); setIsProductModalOpen(true); }}
                        className="flex items-center gap-1 text-sm bg-coffee-100 text-coffee-700 px-3 py-2 rounded-lg hover:bg-coffee-200 transition-colors font-medium"
                    >
                        <PlusCircle className="w-4 h-4" /> Nuevo Ítem
                    </button>
                </div>
            </div>
            
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar producto o escanear código (Pistola USB)..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                        autoFocus
                    />
                </div>
                <button 
                    onClick={() => setIsCameraScannerOpen(true)}
                    className="bg-coffee-600 text-white p-3 rounded-xl shadow-sm hover:bg-coffee-700 transition-colors flex items-center justify-center gap-2"
                    title="Escanear con Cámara"
                >
                    <Camera className="w-6 h-6" />
                    <span className="hidden md:inline">Escanear</span>
                </button>
            </div>
        </div>

        <div className="space-y-8 pb-20">
            {CATEGORIES.map(category => {
                const categoryProducts = filteredProducts.filter(p => p.category === category);
                if (categoryProducts.length === 0) return null;

                return (
                    <div key={category}>
                        <h3 className="text-lg font-bold text-coffee-800 mb-3 border-b border-coffee-100 pb-1 flex items-center gap-2">
                           <span className="bg-coffee-100 w-2 h-6 rounded-full"></span> 
                           {category}
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {categoryProducts.map(product => (
                                <div
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-coffee-300 transition-all text-left group flex flex-col justify-between cursor-pointer relative overflow-hidden"
                                >
                                    {/* Edit Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setImageBase64(product.image || ''); setIsProductModalOpen(true); }}
                                        className="absolute top-2 right-2 p-1.5 bg-white/90 text-gray-500 hover:text-coffee-600 rounded-full shadow-sm z-20 hover:scale-110 transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>

                                    {/* Image Section */}
                                    <div className="h-32 w-full bg-gray-100 relative">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <ImageIcon className="w-10 h-10" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 flex gap-1 z-10">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md shadow-sm ${product.stock < product.minStock ? 'bg-red-500 text-white' : 'bg-white/90 text-coffee-800'}`}>
                                                Stock: {product.stock}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 pt-2">
                                        <h3 className="font-medium text-gray-800 leading-tight mb-1 group-hover:text-coffee-700 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-lg font-bold text-coffee-800">Bs {product.price.toFixed(2)}</span>
                                            <div className="bg-coffee-100 p-1.5 rounded-full text-coffee-700 group-hover:bg-coffee-500 group-hover:text-white transition-colors">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
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
                  <p className="text-coffee-600 font-bold text-sm">Bs {(item.price * item.quantity).toFixed(2)}</p>
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
            <span>Bs {cartTotal.toFixed(2)}</span>
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

      {/* --- Scanner Modal --- */}
      {isCameraScannerOpen && (
         <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative">
                <button 
                    onClick={() => setIsCameraScannerOpen(false)} 
                    className="absolute top-4 right-4 z-20 text-white bg-black/50 p-2 rounded-full hover:bg-black/70"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="bg-coffee-900 p-4 text-white text-center">
                    <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                        <ScanBarcode className="w-5 h-5" /> Escanear Producto
                    </h3>
                    <p className="text-xs opacity-80">Apunta la cámara al código de barras</p>
                </div>

                <div className="relative bg-black min-h-[300px] flex items-center justify-center">
                    <div id="reader" className="w-full h-full"></div>
                </div>

                <div className="p-4 bg-gray-50 text-center">
                    {lastScannedCode ? (
                        <div className="text-green-600 font-bold animate-pulse">
                            ¡Código Detectado! {lastScannedCode}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-sm">
                            Esperando código...
                        </div>
                    )}
                </div>
            </div>
         </div>
      )}

      {/* Sync/Data Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button onClick={() => setIsSyncModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-coffee-600" />
                    Sincronización de Datos
                </h3>
                
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar Base de Datos
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">Descarga un archivo con todos tus productos, ventas y configuración para usar en otro dispositivo.</p>
                        <button 
                            onClick={onExportData}
                            className="w-full bg-coffee-600 text-white font-bold py-2 rounded-lg hover:bg-coffee-700 transition-colors"
                        >
                            Descargar Archivo (.json)
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Importar Base de Datos
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">Sube un archivo generado previamente. ⚠️ Esto reemplazará los datos actuales.</p>
                        <input 
                            type="file" 
                            accept=".json"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Seleccionar Archivo
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setIsProductModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    {editingProduct ? <Edit2 className="w-6 h-6 text-coffee-600" /> : <PlusCircle className="w-6 h-6 text-coffee-600" />}
                    {editingProduct ? 'Editar Producto' : 'Alta Rápida de Producto'}
                </h3>
                <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <label className="cursor-pointer group relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-coffee-500 transition-colors">
                            {imageBase64 ? (
                                <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                    <span className="text-xs">Subir Foto</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                        <input name="name" required defaultValue={editingProduct?.name} placeholder="Ej. Alfajor Nuez" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta (Bs)</label>
                            <input type="number" step="0.01" name="price" defaultValue={editingProduct?.price} required className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo (Bs)</label>
                            <input type="number" step="0.01" name="cost" defaultValue={editingProduct?.cost} placeholder="(Opcional)" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                            <input type="number" name="stock" required defaultValue={editingProduct?.stock || 10} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                            <input type="number" name="minStock" required defaultValue={editingProduct?.minStock || 5} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código Barra</label>
                            <input name="barcode" defaultValue={editingProduct?.barcode} placeholder="(Opcional)" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                            <input name="unit" defaultValue={editingProduct?.unit || 'unid'} placeholder="unid, kg..." className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select name="category" defaultValue={editingProduct?.category || CATEGORIES[0]} className="w-full border rounded-lg p-2 outline-none">
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex gap-3 mt-6 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsProductModalOpen(false)}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 bg-coffee-600 text-white font-bold py-3 rounded-lg hover:bg-coffee-700 shadow-lg transition-all"
                        >
                            {editingProduct ? 'Guardar Cambios' : 'Guardar Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Checkout Modal (Existing Code) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
             {/* ... Same checkout modal content ... */}
             <div className="md:w-1/3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Resumen
                </h3>
                <div className="space-y-3 mb-6">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.quantity}x {item.name}</span>
                            <span className="font-medium text-gray-900">Bs {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-bold text-coffee-800">
                        <span>Total a Pagar</span>
                        <span>Bs {cartTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Finalizar Venta</h2>
                    <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <UserIcon className="w-4 h-4" /> 1. Datos del Cliente
                        </label>
                        <div className="flex gap-2 mb-2">
                            <button onClick={() => setCustomerType('PUBLIC')} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${customerType === 'PUBLIC' ? 'bg-coffee-50 border-coffee-500 text-coffee-700' : 'bg-white border-gray-200 text-gray-600'}`}>Público General</button>
                            <button onClick={() => setCustomerType('FISCAL')} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${customerType === 'FISCAL' ? 'bg-coffee-50 border-coffee-500 text-coffee-700' : 'bg-white border-gray-200 text-gray-600'}`}>Cliente (Factura)</button>
                        </div>
                        {customerType === 'FISCAL' && (
                            <div className="grid grid-cols-2 gap-3">
                                <input placeholder="Nombre / Razón Social" value={customerName} onChange={e => setCustomerName(e.target.value)} className="col-span-2 md:col-span-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-coffee-500" />
                                <input placeholder="NIT / ID Fiscal" value={taxId} onChange={e => setTaxId(e.target.value)} className="col-span-2 md:col-span-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-coffee-500" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> 2. Comprobante</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['FACTURA', 'RECIBO', 'NINGUNO'] as const).map((type) => (
                                <button key={type} onClick={() => setDocumentType(type)} disabled={type === 'FACTURA' && customerType === 'PUBLIC'} className={`py-2 rounded-lg text-sm font-medium border ${documentType === type ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600'} ${type === 'FACTURA' && customerType === 'PUBLIC' ? 'opacity-50' : ''}`}>{type}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2"><CreditCard className="w-4 h-4" /> 3. Pago</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setPaymentMethod('Efectivo')} className={`p-2 rounded-lg text-sm font-medium border flex flex-col items-center gap-1 ${paymentMethod === 'Efectivo' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}><Banknote className="w-4 h-4" /> Efectivo</button>
                            <button onClick={() => setPaymentMethod('Tarjeta')} className={`p-2 rounded-lg text-sm font-medium border flex flex-col items-center gap-1 ${paymentMethod === 'Tarjeta' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}><CreditCard className="w-4 h-4" /> Tarjeta</button>
                            <button onClick={() => setPaymentMethod('Transferencia')} className={`p-2 rounded-lg text-sm font-medium border flex flex-col items-center gap-1 ${paymentMethod === 'Transferencia' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}><QrCode className="w-4 h-4" /> Transf.</button>
                        </div>
                        {paymentMethod === 'Efectivo' && (
                            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                                <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-32 border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-green-500" placeholder="Recibido" />
                                {parseFloat(cashReceived || '0') >= cartTotal && (<span className="text-green-600 font-bold">Cambio: Bs {changeDue.toFixed(2)}</span>)}
                            </div>
                        )}
                    </div>
                    {documentType !== 'NINGUNO' && (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Send className="w-4 h-4" /> 4. Entrega</label>
                            <div className="flex gap-2">
                                <button onClick={() => setDeliveryMethod('IMPRESO')} className={`flex-1 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${deliveryMethod === 'IMPRESO' ? 'bg-gray-800 text-white' : 'border-gray-200 text-gray-600'}`}><Printer className="w-4 h-4" /> Imprimir</button>
                                <button onClick={() => setDeliveryMethod('DIGITAL_WA')} className={`flex-1 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${deliveryMethod === 'DIGITAL_WA' ? 'bg-green-600 text-white' : 'border-gray-200 text-gray-600'}`}><FileDown className="w-4 h-4" /> PDF + WA</button>
                                <button onClick={() => setDeliveryMethod('DIGITAL_EMAIL')} className={`flex-1 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${deliveryMethod === 'DIGITAL_EMAIL' ? 'bg-blue-600 text-white' : 'border-gray-200 text-gray-600'}`}><Mail className="w-4 h-4" /> Email</button>
                            </div>
                            {(deliveryMethod === 'DIGITAL_EMAIL' || deliveryMethod === 'DIGITAL_WA') && (
                                <input placeholder={deliveryMethod === 'DIGITAL_EMAIL' ? "cliente@email.com" : "Número de Whatsapp"} value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-coffee-500" />
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-8 pt-4 border-t border-gray-100 flex gap-4">
                    <button onClick={() => setIsCheckoutOpen(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button onClick={handleCheckout} disabled={paymentMethod === 'Efectivo' && (parseFloat(cashReceived || '0') < cartTotal)} className="flex-[2] bg-coffee-600 text-white font-bold py-3 rounded-xl hover:bg-coffee-700 shadow-lg disabled:opacity-50 transition-all">Confirmar (Bs {cartTotal.toFixed(2)})</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;