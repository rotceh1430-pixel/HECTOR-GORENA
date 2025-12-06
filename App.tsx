import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Assets from './components/Assets';
import WhatsAppOrders from './components/WhatsAppOrders';
import KitchenDisplay from './components/KitchenDisplay';
import CustomerMenu from './components/CustomerMenu';
import { User, Product, Asset, Sale, Role, WhatsAppOrder, OrderStatus } from './types';
import { DataService } from './services/dataService';
import { db } from './services/firebaseConfig';
import { INITIAL_PRODUCTS, INITIAL_ASSETS, MOCK_SALES } from './constants';

const App: React.FC = () => {
  // --- SESSION STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState<string>(() => {
    return localStorage.getItem('currentView') || 'dashboard';
  });

  // --- DATA STATE (Managed by Firebase Subscriptions) ---
  const [products, setProducts] = useState<Product[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [whatsappOrders, setWhatsappOrders] = useState<WhatsAppOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // --- CUSTOMER MODE CHECK ---
  const [isCustomerMode, setIsCustomerMode] = useState(false);
  const [customerTableId, setCustomerTableId] = useState('0');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'customer') {
        setIsCustomerMode(true);
        setCustomerTableId(params.get('table') || '0');
    }
  }, []);

  // --- FIREBASE SUBSCRIPTIONS ---
  useEffect(() => {
    // Listen for connection errors dispatched by DataService
    const handleFirebaseError = (e: any) => {
        setFirebaseError(e.detail);
    };
    window.addEventListener('firebase_error', handleFirebaseError);

    // Only subscribe if not in customer mode (or even in customer mode we need products)
    if (!db) {
        // Fallback for when API keys are missing in demo
        setProducts(INITIAL_PRODUCTS);
        setSales(MOCK_SALES);
        setAssets(INITIAL_ASSETS);
        setLoading(false);
        return () => window.removeEventListener('firebase_error', handleFirebaseError);
    }

    const unsubProducts = DataService.subscribeProducts(setProducts);
    const unsubSales = DataService.subscribeSales(setSales);
    const unsubAssets = DataService.subscribeAssets(setAssets);
    const unsubWA = DataService.subscribeWhatsAppOrders(setWhatsappOrders);

    setLoading(false);

    return () => {
      unsubProducts();
      unsubSales();
      unsubAssets();
      unsubWA();
      window.removeEventListener('firebase_error', handleFirebaseError);
    };
  }, []);

  // --- PERSISTENCE EFFECTS (Only User Session) ---
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

  // --- HANDLERS ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === Role.ADMIN) setCurrentView('dashboard');
    else if (user.role === Role.CAJERO) setCurrentView('pos');
    else if (user.role === Role.ALMACEN) setCurrentView('inventory');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentView');
  };

  const handleSystemUpdate = () => {
    if (products.length === 0) {
        if(window.confirm("¿Deseas inicializar la base de datos en la nube con los productos de ejemplo?")) {
            DataService.seedProducts();
        }
    } else {
        alert("El sistema está conectado a la nube y sincronizado.");
    }
  };

  const handleExportData = () => {
    const data = { timestamp: new Date().toISOString(), products, sales, assets, whatsappOrders };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `control_alfajores_cloud_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonData: string) => {
     alert("La importación masiva está deshabilitada en modo Cloud para prevenir sobrescritura de datos en tiempo real.");
  };

  // --- CRUD WRAPPERS ---

  const handleCompleteSale = (newSale: Sale) => {
    DataService.addSale(newSale, products);
  };

  const handleAddWhatsAppOrder = (order: WhatsAppOrder) => {
    DataService.addWhatsAppOrder(order);
  };

  const handleUpdateWhatsAppStatus = (orderId: string, status: OrderStatus) => {
    DataService.updateWhatsAppStatus(orderId, status);
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
    // Add sale and update stock via DataService
    DataService.addSale(newSale, products);
    // Mark order as delivered
    DataService.updateWhatsAppStatus(order.id, 'ENTREGADO');
    alert(`Pedido de ${order.customerName} registrado y sincronizado en la nube.`);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    DataService.updateProduct(updatedProduct);
  };

  const handleAddProduct = (newProduct: Product) => {
    DataService.addProduct(newProduct);
  };

  // --- RENDER ---

  if (isCustomerMode) {
    return <CustomerMenu products={products} tableId={customerTableId} />;
  }

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
      {/* Configuration Warnings */}
      <div className="flex flex-col">
        {!db && (
            <div className="bg-red-500 text-white p-2 text-center text-sm font-bold animate-pulse">
                ⚠️ MODO DEMO: Configura firebaseConfig.ts para activar la base de datos real.
            </div>
        )}
        {firebaseError && (
            <div className="bg-orange-500 text-white p-2 text-center text-sm font-bold flex justify-center items-center gap-2">
                <span>⚠️ {firebaseError}</span>
                <button onClick={() => setFirebaseError(null)} className="underline opacity-80 hover:opacity-100">Cerrar</button>
            </div>
        )}
      </div>

      {currentView === 'dashboard' && currentUser.role === Role.ADMIN && (
        <Dashboard sales={sales} products={products} onSystemUpdate={handleSystemUpdate} />
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

      {currentView === 'kitchen' && (currentUser.role === Role.ADMIN || currentUser.role === Role.CAJERO) && (
        <KitchenDisplay />
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