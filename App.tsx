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
  // --- PERSISTENCE LOGIC (LocalStorage) ---
  
  // 1. User Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // 2. View State
  const [currentView, setCurrentView] = useState<string>(() => {
    return localStorage.getItem('currentView') || 'dashboard';
  });
  
  // 3. Data State (Initialize from Storage or fallback to Constants)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('sales');
    return saved ? JSON.parse(saved) : MOCK_SALES;
  });

  const [whatsappOrders, setWhatsappOrders] = useState<WhatsAppOrder[]>(() => {
    const saved = localStorage.getItem('whatsappOrders');
    return saved ? JSON.parse(saved) : MOCK_WHATSAPP_ORDERS;
  });

  // --- SAVE TO STORAGE EFFECTS ---

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('whatsappOrders', JSON.stringify(whatsappOrders));
  }, [whatsappOrders]);

  // --- LOGIC ---

  // Default view setting logic adjusted to not overwrite saved view unless necessary
  useEffect(() => {
    if (currentUser && !localStorage.getItem('currentView')) {
      if (currentUser.role === Role.ADMIN) setCurrentView('dashboard');
      else if (currentUser.role === Role.CAJERO) setCurrentView('pos');
      else if (currentUser.role === Role.ALMACEN) setCurrentView('inventory');
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Set default view on fresh login
    if (user.role === Role.ADMIN) setCurrentView('dashboard');
    else if (user.role === Role.CAJERO) setCurrentView('pos');
    else if (user.role === Role.ALMACEN) setCurrentView('inventory');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentView'); // Reset view on logout
  };

  // --- SMART UPDATE / SYNC LOGIC ---
  const handleSystemUpdate = () => {
    let addedProductsCount = 0;
    let addedAssetsCount = 0;

    setProducts(currentProducts => {
      const currentIds = new Set(currentProducts.map(p => p.id));
      const newProducts = INITIAL_PRODUCTS.filter(p => !currentIds.has(p.id));
      addedProductsCount = newProducts.length;
      return [...currentProducts, ...newProducts];
    });

    setAssets(currentAssets => {
      const currentIds = new Set(currentAssets.map(a => a.id));
      const newAssets = INITIAL_ASSETS.filter(a => !currentIds.has(a.id));
      addedAssetsCount = newAssets.length;
      return [...currentAssets, ...newAssets];
    });

    if (addedProductsCount > 0 || addedAssetsCount > 0) {
      alert(`Sistema actualizado con éxito.\n\nSe agregaron:\n- ${addedProductsCount} productos nuevos del catálogo base.\n- ${addedAssetsCount} activos fijos nuevos.\n\nTus datos existentes y ventas NO han sido modificados.`);
    } else {
      alert("El sistema ya está actualizado. Tienes todos los datos base al día.");
    }
  };

  // --- DATA EXPORT / IMPORT LOGIC ---
  const handleExportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      products,
      sales,
      assets,
      whatsappOrders
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `control_alfajores_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      // Basic validation
      if (!data.products || !data.sales) {
        throw new Error("Formato de archivo inválido.");
      }

      // Update State
      if (data.products) setProducts(data.products);
      if (data.sales) setSales(data.sales);
      if (data.assets) setAssets(data.assets);
      if (data.whatsappOrders) setWhatsappOrders(data.whatsappOrders);

      alert("Base de datos importada correctamente. La aplicación está actualizada.");
    } catch (error) {
      console.error(error);
      alert("Error al importar: El archivo no es válido.");
    }
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
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: order.items,
      total: order.total,
      paymentMethod: 'Efectivo', 
      cashierName: currentUser?.name || 'Sistema WA',
      customerName: order.customerName,
      documentType: 'RECIBO'
    };

    handleCompleteSale(newSale);
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
        <Dashboard 
          sales={sales} 
          products={products} 
          onSystemUpdate={handleSystemUpdate} 
        />
      )}
      
      {currentView === 'pos' && (currentUser.role === Role.ADMIN || currentUser.role === Role.CAJERO) && (
        <POS 
          products={products} 
          currentUser={currentUser} 
          onCompleteSale={handleCompleteSale}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onExportData={handleExportData}
          onImportData={handleImportData}
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