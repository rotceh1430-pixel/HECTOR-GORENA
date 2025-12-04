import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Assets from './components/Assets';
import WhatsAppOrders from './components/WhatsAppOrders';
import { User, Product, Asset, Sale, Role, WhatsAppOrder, OrderStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_ASSETS, MOCK_SALES, MOCK_WHATSAPP_ORDERS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  
  // App State (Simulating DB)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [whatsappOrders, setWhatsappOrders] = useState<WhatsAppOrder[]>(MOCK_WHATSAPP_ORDERS);

  // Default view based on role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === Role.ADMIN) setCurrentView('dashboard');
      else if (currentUser.role === Role.CAJERO) setCurrentView('pos');
      else if (currentUser.role === Role.ALMACEN) setCurrentView('inventory');
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleCompleteSale = (newSale: Sale) => {
    setSales(prev => [...prev, newSale]);
    // Decrease stock
    setProducts(prevProducts => prevProducts.map(p => {
      const soldItem = newSale.items.find(i => i.id === p.id);
      if (soldItem) {
        return { ...p, stock: p.stock - soldItem.quantity };
      }
      return p;
    }));
  };

  // WhatsApp Module Handlers
  const handleAddWhatsAppOrder = (order: WhatsAppOrder) => {
    setWhatsappOrders(prev => [order, ...prev]);
  };

  const handleUpdateWhatsAppStatus = (orderId: string, status: OrderStatus) => {
    setWhatsappOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleFinalizeWhatsAppOrder = (order: WhatsAppOrder) => {
    // 1. Create Sale from Order
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: order.items,
      total: order.total,
      paymentMethod: 'Efectivo', // Defaulting to Cash for WA orders upon pickup/delivery
      cashierName: currentUser?.name || 'Sistema WA',
      customerName: order.customerName,
      documentType: 'RECIBO'
    };

    // 2. Register Sale (updates stock)
    handleCompleteSale(newSale);

    // 3. Mark Order as Delivered/Archived
    handleUpdateWhatsAppStatus(order.id, 'ENTREGADO');
    
    alert(`Pedido de ${order.customerName} registrado como venta y stock actualizado.`);
  };


  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentUser={currentUser} 
      currentView={currentView} 
      onChangeView={setCurrentView} 
      onLogout={handleLogout}
    >
      {currentView === 'dashboard' && currentUser.role === Role.ADMIN && (
        <Dashboard sales={sales} products={products} />
      )}
      
      {currentView === 'pos' && (currentUser.role === Role.ADMIN || currentUser.role === Role.CAJERO) && (
        <POS 
          products={products} 
          currentUser={currentUser} 
          onCompleteSale={handleCompleteSale}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
        />
      )}

      {currentView === 'whatsapp' && (
        <WhatsAppOrders 
          products={products}
          orders={whatsappOrders}
          onAddOrder={handleAddWhatsAppOrder}
          onUpdateStatus={handleUpdateWhatsAppStatus}
          onFinalizeOrder={handleFinalizeWhatsAppOrder}
        />
      )}

      {currentView === 'inventory' && (
        <Inventory 
          products={products} 
          currentUser={currentUser}
          onUpdateProduct={handleUpdateProduct}
          onAddProduct={handleAddProduct}
        />
      )}

      {currentView === 'assets' && (currentUser.role === Role.ADMIN || currentUser.role === Role.ALMACEN) && (
        <Assets assets={assets} currentUser={currentUser} />
      )}
    </Layout>
  );
};

export default App;