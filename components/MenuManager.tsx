
import React, { useState, useEffect } from 'react';
import { Product, ProductCategory } from '../types';
import { ArrowUp, ArrowDown, Save, QrCode, ExternalLink, Coffee, Zap, IceCream, UtensilsCrossed, Printer, X } from 'lucide-react';

interface MenuManagerProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
}

// Requested order: Bebidas frías, calientes, pasteleria y alfajores y snacks salados
const CATEGORY_ORDER: ProductCategory[] = [
    'Bebidas frías',
    'Bebidas calientes',
    'Pasteleria', 
    'Alfajores artesanales', 
    'Snacks salados', 
    'Otro'
];

const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const MenuManager: React.FC<MenuManagerProps> = ({ products, onUpdateProduct }) => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('Bebidas frías');
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    // Sort products by displayOrder initially
    const sorted = [...products].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setLocalProducts(sorted);
  }, [products]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const currentCategoryProducts = localProducts.filter(p => p.category === activeCategory);
    const otherProducts = localProducts.filter(p => p.category !== activeCategory);
    
    // Sort current category by their visual order
    const sortedCurrent = [...currentCategoryProducts];
    
    if (direction === 'up' && index > 0) {
        [sortedCurrent[index], sortedCurrent[index - 1]] = [sortedCurrent[index - 1], sortedCurrent[index]];
    } else if (direction === 'down' && index < sortedCurrent.length - 1) {
        [sortedCurrent[index], sortedCurrent[index + 1]] = [sortedCurrent[index + 1], sortedCurrent[index]];
    } else {
        return;
    }

    // Re-assign displayOrder based on new array index
    // We add a base offset to keep categories separate in the grand scheme if needed, 
    // but simple index is enough if we filter by category in the view.
    const updatedCurrent = sortedCurrent.map((p, idx) => ({ ...p, displayOrder: idx }));

    setLocalProducts([...otherProducts, ...updatedCurrent]);
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    // In a real app, this should be a batch update. Here we iterate.
    const productsToUpdate = localProducts.filter(p => {
        const original = products.find(op => op.id === p.id);
        return original && original.displayOrder !== p.displayOrder;
    });

    productsToUpdate.forEach(p => {
        onUpdateProduct(p);
    });
    setHasChanges(false);
    alert('¡Orden del menú actualizado correctamente!');
  };

  const generateQrUrl = (tableId: number) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = `?view=customer&table=${tableId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl + params)}`;
  };

  const currentCategoryList = localProducts
    .filter(p => p.category === activeCategory)
    // Ensure we are viewing them in the order of the state
    // (Note: The state logic for 'move' depends on this array being sorted by displayOrder implicitly via the swap)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center shadow-sm z-10">
            <div>
                <h2 className="text-2xl font-bold text-coffee-900">Gestión de Menú Digital</h2>
                <p className="text-sm text-gray-500">Organiza los productos y genera los QRs para las mesas.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center gap-2 bg-white border border-coffee-200 text-coffee-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                    <QrCode className="w-4 h-4" /> Códigos QR
                </button>
                {hasChanges && (
                    <button 
                        onClick={handleSaveChanges}
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow-md animate-bounce font-bold"
                    >
                        <Save className="w-4 h-4" /> Guardar Orden
                    </button>
                )}
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Categories */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                    Categorías
                </div>
                {CATEGORY_ORDER.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-left px-6 py-4 border-b border-gray-100 transition-colors flex items-center justify-between ${
                            activeCategory === cat 
                            ? 'bg-coffee-50 text-coffee-800 font-bold border-l-4 border-l-coffee-600' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {cat}
                        <span className="bg-gray-100 text-gray-500 text-xs py-0.5 px-2 rounded-full">
                            {products.filter(p => p.category === cat).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Sortable List */}
            <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{activeCategory}</h3>
                        <span className="text-xs text-gray-500 italic">Usa las flechas para cambiar la posición</span>
                    </div>

                    <div className="space-y-3">
                        {currentCategoryList.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                                No hay productos en esta categoría.
                            </div>
                        ) : (
                            currentCategoryList.map((product, index) => (
                                <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 transition-all hover:shadow-md">
                                    <div className="font-bold text-gray-300 w-6 text-center text-lg">
                                        {index + 1}
                                    </div>
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {product.image ? (
                                            <img src={product.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Coffee className="w-6 h-6"/></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800">{product.name}</h4>
                                        <p className="text-sm text-gray-500">Bs {product.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button 
                                            onClick={() => handleMove(index, 'up')}
                                            disabled={index === 0}
                                            className="p-1 bg-gray-100 hover:bg-coffee-100 text-gray-600 hover:text-coffee-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleMove(index, 'down')}
                                            disabled={index === currentCategoryList.length - 1}
                                            className="p-1 bg-gray-100 hover:bg-coffee-100 text-gray-600 hover:text-coffee-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* QR Generation Modal */}
        {isQrModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white rounded-2xl w-full max-w-4xl p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
                    <button 
                        onClick={() => setIsQrModalOpen(false)} 
                        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="mb-8 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                            <QrCode className="w-8 h-8 text-coffee-600" />
                            Códigos QR para Mesas
                        </h3>
                        <p className="text-gray-500 mt-2">
                            Estos QRs dirigen al menú digital interactivo. Imprímelos y colócalos en las mesas.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {TABLES.map(tableId => (
                            <div key={tableId} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-white p-2 rounded-lg border border-gray-100 mb-4">
                                    <img 
                                        src={generateQrUrl(tableId)} 
                                        alt={`QR Mesa ${tableId}`}
                                        className="w-32 h-32"
                                    />
                                </div>
                                <h4 className="text-lg font-bold text-coffee-800 mb-1">MESA {tableId}</h4>
                                <a 
                                    href={generateQrUrl(tableId)} 
                                    download={`QR-Mesa-${tableId}.png`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
                                >
                                    <ExternalLink className="w-3 h-3" /> Abrir / Descargar
                                </a>
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

export default MenuManager;
