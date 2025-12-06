import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Product, Sale } from '../types';
import { analyzeBusinessData } from '../services/geminiService';
import { TrendingUp, AlertTriangle, DollarSign, Package, Sparkles, Loader, RefreshCw, PieChart as PieIcon } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  onSystemUpdate: () => void;
}

// Custom Palette for Categories
const CATEGORY_COLORS: { [key: string]: string } = {
  'Alfajores artesanales': '#8c6b5d', // Coffee/Chocolate
  'Pasteleria': '#D4A574', // Gold/Dough
  'Snacks salados': '#e09f3e', // Orange/Savory
  'Bebidas calientes': '#4a362f', // Dark Coffee
  'Bebidas frías': '#00b4d8', // Ice Blue
  'Otro': '#9e9e9e' // Grey
};

const DEFAULT_COLORS = ['#8c6b5d', '#D4A574', '#a07e72', '#5e4339', '#0088FE', '#00C49F'];

const Dashboard: React.FC<DashboardProps> = ({ sales, products, onSystemUpdate }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // --- KPI CALCULATIONS ---
  const totalSales = sales.reduce((acc, curr) => acc + curr.total, 0);
  const lowStockCount = products.filter(p => p.stock < p.minStock).length;
  
  // --- DATA PROCESSING: SALES BY CATEGORY ---
  // Aggregate sales revenue by category based on individual items sold
  const salesByCategoryRaw = sales.reduce((acc: { [key: string]: number }, sale) => {
    sale.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      const cat = item.category || 'Otro';
      acc[cat] = (acc[cat] || 0) + itemTotal;
    });
    return acc;
  }, {});

  // Convert to array for Recharts and Sort by Value
  const salesByCategoryData = Object.keys(salesByCategoryRaw).map(key => ({
    name: key,
    value: salesByCategoryRaw[key]
  })).sort((a, b) => b.value - a.value);

  // --- DATA PROCESSING: INVENTORY STOCK ---
  const inventoryData = products.reduce((acc: any[], product) => {
    const existing = acc.find(item => item.name === product.category);
    if (existing) {
      existing.value += product.stock; 
    } else {
      acc.push({ name: product.category, value: product.stock });
    }
    return acc;
  }, []);

  // Mock Weekly Data (If needed, could be replaced by real logic later)
  const salesData = [
    { name: 'Lun', ventas: 120 },
    { name: 'Mar', ventas: 150 },
    { name: 'Mié', ventas: 180 },
    { name: 'Jue', ventas: 140 },
    { name: 'Vie', ventas: 250 },
    { name: 'Sáb', ventas: 300 },
    { name: 'Dom', ventas: 200 },
  ]; 

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeBusinessData(sales, products);
    setAnalysis(result);
    setLoadingAi(false);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 pb-24 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-coffee-900">Dashboard Gerencial</h2>
        <div className="flex flex-wrap gap-3">
            <button 
            onClick={onSystemUpdate}
            className="flex items-center gap-2 bg-white text-coffee-700 border border-coffee-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-all font-medium"
            title="Sincronizar nuevas características sin borrar datos"
            >
            <RefreshCw className="w-4 h-4" />
            Actualizar Sistema
            </button>
            <button 
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="flex items-center gap-2 bg-gradient-to-r from-coffee-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition-all disabled:opacity-50"
            >
            {loadingAi ? <Loader className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {loadingAi ? 'Analizando...' : 'Analizar con IA'}
            </button>
        </div>
      </div>

      {/* AI Analysis Result */}
      {analysis && (
        <div className="bg-white border-l-4 border-indigo-500 p-6 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" /> Insight de Negocios
          </h3>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{analysis}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Ventas Totales</p>
            <p className="text-2xl font-bold text-coffee-800">Bs {totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Alertas Stock</p>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {lowStockCount}
            </p>
          </div>
          <div className={`p-3 rounded-full ${lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
            <AlertTriangle className={`w-6 h-6 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Transacciones</p>
            <p className="text-2xl font-bold text-coffee-800">{sales.length}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Productos</p>
            <p className="text-2xl font-bold text-coffee-800">{products.length}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-full">
            <Package className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* --- NEW SECTION: Sales By Category Analysis --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-coffee-600" />
            Rentabilidad por Categoría (Bebidas, Pastelería, Snacks)
        </h3>
        
        <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Chart */}
            <div className="w-full lg:w-1/2 h-80">
                {salesByCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={salesByCategoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {salesByCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `Bs ${value.toFixed(2)}`} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 border border-dashed rounded-xl">
                        No hay ventas registradas aún
                    </div>
                )}
            </div>

            {/* Detailed List */}
            <div className="w-full lg:w-1/2 space-y-4">
                {salesByCategoryData.length > 0 ? (
                    salesByCategoryData.map((item, index) => {
                        const percentage = totalSales > 0 ? ((item.value / totalSales) * 100).toFixed(1) : '0';
                        const color = CATEGORY_COLORS[item.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                        
                        return (
                            <div key={item.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                                    <div>
                                        <p className="font-medium text-gray-800">{item.name}</p>
                                        <p className="text-xs text-gray-500 font-bold">{percentage}% del total</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-coffee-800">Bs {item.value.toFixed(2)}</p>
                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                   <p className="text-gray-500 text-center italic">Realiza ventas para ver el desglose por categorías.</p> 
                )}
            </div>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencia Semanal</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
              <Bar dataKey="ventas" fill="#8c6b5d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Stock (Inventario)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={inventoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {inventoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;