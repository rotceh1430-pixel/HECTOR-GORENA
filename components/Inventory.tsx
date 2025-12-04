import React, { useState } from 'react';
import { Product, Role, User } from '../types';
import { Edit2, AlertTriangle, Search, Plus, Archive } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  currentUser: User;
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, currentUser, onUpdateProduct, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const canEdit = currentUser.role === Role.ADMIN || currentUser.role === Role.ALMACEN;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      barcode: formData.get('barcode') as string,
      price: parseFloat(formData.get('price') as string),
      cost: parseFloat(formData.get('cost') as string),
      stock: parseInt(formData.get('stock') as string),
      minStock: parseInt(formData.get('minStock') as string),
      category: formData.get('category') as any,
      unit: formData.get('unit') as string,
    };

    if (editingProduct) {
      onUpdateProduct(newProduct);
    } else {
      onAddProduct(newProduct);
    }
    setEditingProduct(null);
    setIsAdding(false);
  };

  return (
    <div className="p-4 md:p-8 pb-24 h-full bg-gray-50 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-coffee-900">Inventario</h2>
        
        {canEdit && (
          <button 
            onClick={() => { setEditingProduct(null); setIsAdding(true); }}
            className="bg-coffee-600 text-white px-4 py-2 rounded-lg shadow hover:bg-coffee-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <Search className="text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-coffee-50 text-coffee-800 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Precio Venta</th>
                {canEdit && <th className="p-4">Costo</th>}
                {canEdit && <th className="p-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{product.barcode}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{product.category}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${product.stock < product.minStock ? 'text-red-600' : 'text-green-600'}`}>
                        {product.stock} {product.unit}
                      </span>
                      {product.stock < product.minStock && (
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-800 font-mono">Bs {product.price.toFixed(2)}</td>
                  {canEdit && <td className="p-4 text-gray-500 font-mono">Bs {product.cost.toFixed(2)}</td>}
                  {canEdit && (
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setEditingProduct(product)}
                        className="text-coffee-600 hover:bg-coffee-100 p-2 rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {(isAdding || editingProduct) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input name="name" defaultValue={editingProduct?.name} required className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                    <input name="barcode" defaultValue={editingProduct?.barcode} required className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select name="category" defaultValue={editingProduct?.category || 'Alfajor'} className="w-full border rounded-lg p-2 outline-none">
                        <option value="Alfajor">Alfajor</option>
                        <option value="Bebida">Bebida</option>
                        <option value="Snack">Snack</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta (Bs)</label>
                    <input type="number" step="0.01" name="price" defaultValue={editingProduct?.price} required className="w-full border rounded-lg p-2 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo (Bs)</label>
                    <input type="number" step="0.01" name="cost" defaultValue={editingProduct?.cost} required className="w-full border rounded-lg p-2 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                    <input type="number" name="stock" defaultValue={editingProduct?.stock} required className="w-full border rounded-lg p-2 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                    <input type="number" name="minStock" defaultValue={editingProduct?.minStock} required className="w-full border rounded-lg p-2 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                    <input name="unit" defaultValue={editingProduct?.unit || 'unid'} required className="w-full border rounded-lg p-2 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setEditingProduct(null); setIsAdding(false); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;