import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Product, Sale } from '../types';
import { analyzeBusinessData } from '../services/geminiService';
import { TrendingUp, AlertTriangle, DollarSign, Package, Sparkles, Loader } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
}

const COLORS = ['#8c6b5d', '#D4A574', '#a07e72', '#5e4339'];

const Dashboard: React.FC<DashboardProps> = ({ sales, products }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Computed Stats
  const totalSales = sales.reduce((acc, curr) => acc + curr.total, 0);
  const lowStockCount = products.filter(p => p.stock < p.minStock).length;
  
  // Chart Data Preparation
  const categoryData = products.reduce((acc: any[], product) => {
    const existing = acc.find(item => item.name === product.category);
    if (existing) {
      existing.value += product.stock; // visualizing stock distribution
    } else {
      acc.push({ name: product.category, value: product.stock });
    }
    return acc;
  }, []);

  const salesData = [
    { name: 'Lun', ventas: 120 },
    { name: 'Mar', ventas: 150 },
    { name: 'Mié', ventas: 180 },
    { name: 'Jue', ventas: 140 },
    { name: 'Vie', ventas: 250 },
    { name: 'Sáb', ventas: 300 },
    { name: 'Dom', ventas: 200 },
  ]; // Mock weekly data since real sales array is small

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeBusinessData(sales, products);
    setAnalysis(result);
    setLoadingAi(false);
  };

  return (
    <div className="p-4 md:p-8 pb-24 space-y-6 bg-gray-50 min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h2 className="text-3xl font-bold text-coffee-900">Dashboard Gerencial</h2>
        <button 
          onClick={handleAiAnalysis}
          disabled={loadingAi}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-coffee-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loadingAi ? <Loader className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {loadingAi ? 'Analizando...' : 'Analizar con IA'}
        </button>
      </div>

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

      {/* Charts */}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Inventario</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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