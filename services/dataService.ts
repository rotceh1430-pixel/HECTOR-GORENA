import { db } from './firebaseConfig';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, writeBatch } from "firebase/firestore";
import { Product, Sale, Asset, WhatsAppOrder, OrderStatus } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ASSETS, MOCK_SALES, MOCK_WHATSAPP_ORDERS } from '../constants';

// Helper for LocalStorage Events
const dispatchLocalUpdate = (key: string) => {
  window.dispatchEvent(new Event(`local_update_${key}`));
};

const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error en ${context}:`, error);
    if (error.code === 'permission-denied') {
        const msg = "Error de permisos: Verifica que las Reglas de Firestore estén en 'Modo de prueba' o configuradas correctamente en la consola.";
        console.warn(msg);
        // Optional: Dispatch event to show UI alert
        window.dispatchEvent(new CustomEvent('firebase_error', { detail: msg }));
    }
};

// Helper to remove undefined values (Firestore rejects them)
const cleanPayload = (data: any) => {
    return Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {} as any);
};

export const DataService = {
  // --- PRODUCTS ---
  subscribeProducts: (callback: (products: Product[]) => void) => {
    if (!db) {
        // LocalStorage Fallback
        const loadLocal = () => {
            const stored = localStorage.getItem('products');
            callback(stored ? JSON.parse(stored) : INITIAL_PRODUCTS);
        };
        
        loadLocal(); // Initial load

        // Listener for same-tab updates
        window.addEventListener('local_update_products', loadLocal);
        
        // Listener for cross-tab updates (when user changes data in another tab)
        const storageListener = (e: StorageEvent) => {
            if (e.key === 'products') loadLocal();
        };
        window.addEventListener('storage', storageListener);

        return () => {
            window.removeEventListener('local_update_products', loadLocal);
            window.removeEventListener('storage', storageListener);
        };
    }
    
    // Firebase
    return onSnapshot(collection(db, 'products'), (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((doc) => products.push({ id: doc.id, ...doc.data() } as Product));
      callback(products);
    }, (error) => handleFirestoreError(error, 'Products'));
  },

  addProduct: async (product: Product) => {
    if (!db) {
        // LocalStorage Fallback
        const current = JSON.parse(localStorage.getItem('products') || JSON.stringify(INITIAL_PRODUCTS));
        localStorage.setItem('products', JSON.stringify([...current, product]));
        dispatchLocalUpdate('products');
        return;
    }
    const { id, ...data } = product;
    await addDoc(collection(db, 'products'), cleanPayload(data));
  },

  updateProduct: async (product: Product) => {
    if (!db) {
        // LocalStorage Fallback
        const current = JSON.parse(localStorage.getItem('products') || '[]');
        const updated = current.map((p: Product) => p.id === product.id ? product : p);
        localStorage.setItem('products', JSON.stringify(updated));
        dispatchLocalUpdate('products');
        return;
    }
    const ref = doc(db, 'products', product.id);
    const { id, ...data } = product;
    await updateDoc(ref, cleanPayload(data));
  },

  seedProducts: async (): Promise<boolean> => {
      if(!db) return false;
      
      try {
          const batch = writeBatch(db);
          
          // 1. Cargar Productos con sus IDs originales (para mantener consistencia)
          INITIAL_PRODUCTS.forEach(p => {
              const {id, ...data} = p;
              const ref = doc(db, 'products', id); // Usamos 'p1', 'p2' como ID del documento
              batch.set(ref, cleanPayload(data));
          });

          // 2. Cargar Activos Fijos también
          INITIAL_ASSETS.forEach(a => {
              const {id, ...data} = a;
              const ref = doc(db, 'assets', id);
              batch.set(ref, cleanPayload(data));
          });

          await batch.commit();
          console.log("Base de datos inicializada correctamente.");
          return true;
      } catch (error) {
          console.error("Error al sembrar datos:", error);
          return false;
      }
  },

  // --- SALES ---
  subscribeSales: (callback: (sales: Sale[]) => void) => {
    if (!db) {
        // LocalStorage Fallback
        const loadLocal = () => {
            const stored = localStorage.getItem('sales');
            callback(stored ? JSON.parse(stored) : MOCK_SALES);
        };
        loadLocal();
        window.addEventListener('local_update_sales', loadLocal);
        return () => window.removeEventListener('local_update_sales', loadLocal);
    }

    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const sales: Sale[] = [];
      snapshot.forEach((doc) => sales.push({ id: doc.id, ...doc.data() } as Sale));
      callback(sales);
    }, (error) => handleFirestoreError(error, 'Sales'));
  },

  addSale: async (sale: Sale, products: Product[]) => {
    if (!db) {
        // LocalStorage Fallback (Sales)
        const currentSales = JSON.parse(localStorage.getItem('sales') || JSON.stringify(MOCK_SALES));
        localStorage.setItem('sales', JSON.stringify([sale, ...currentSales]));
        dispatchLocalUpdate('sales');

        // LocalStorage Fallback (Stock Update)
        const currentProducts = JSON.parse(localStorage.getItem('products') || JSON.stringify(INITIAL_PRODUCTS));
        const updatedProducts = currentProducts.map((p: Product) => {
            const soldItem = sale.items.find(i => i.id === p.id);
            return soldItem ? { ...p, stock: p.stock - soldItem.quantity } : p;
        });
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        dispatchLocalUpdate('products');
        return;
    }

    const { id, ...saleData } = sale;
    
    // 1. Add Sale
    await addDoc(collection(db, 'sales'), cleanPayload(saleData));

    // 2. Update Stock
    products.forEach(p => {
        const soldItem = sale.items.find(i => i.id === p.id || i.name === p.name);
        if (soldItem) {
             const ref = doc(db, 'products', p.id);
             updateDoc(ref, { stock: p.stock - soldItem.quantity });
        }
    });
  },

  // --- ASSETS ---
  subscribeAssets: (callback: (assets: Asset[]) => void) => {
    if (!db) {
        const loadLocal = () => {
            const stored = localStorage.getItem('assets');
            callback(stored ? JSON.parse(stored) : INITIAL_ASSETS);
        };
        loadLocal();
        return () => {};
    }
    return onSnapshot(collection(db, 'assets'), (snapshot) => {
      const assets: Asset[] = [];
      snapshot.forEach((doc) => assets.push({ id: doc.id, ...doc.data() } as Asset));
      callback(assets);
    }, (error) => handleFirestoreError(error, 'Assets'));
  },

  // --- WHATSAPP ORDERS ---
  subscribeWhatsAppOrders: (callback: (orders: WhatsAppOrder[]) => void) => {
    if (!db) {
        const loadLocal = () => {
            const stored = localStorage.getItem('whatsappOrders');
            callback(stored ? JSON.parse(stored) : MOCK_WHATSAPP_ORDERS);
        };
        loadLocal();
        window.addEventListener('local_update_wa', loadLocal);
        return () => window.removeEventListener('local_update_wa', loadLocal);
    }
    const q = query(collection(db, 'whatsapp_orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const orders: WhatsAppOrder[] = [];
      snapshot.forEach((doc) => orders.push({ id: doc.id, ...doc.data() } as WhatsAppOrder));
      callback(orders);
    }, (error) => handleFirestoreError(error, 'WhatsApp Orders'));
  },

  addWhatsAppOrder: async (order: WhatsAppOrder) => {
      if(!db) {
          const current = JSON.parse(localStorage.getItem('whatsappOrders') || JSON.stringify(MOCK_WHATSAPP_ORDERS));
          localStorage.setItem('whatsappOrders', JSON.stringify([order, ...current]));
          dispatchLocalUpdate('wa');
          return;
      }
      const { id, ...data } = order;
      await addDoc(collection(db, 'whatsapp_orders'), cleanPayload(data));
  },

  updateWhatsAppStatus: async (orderId: string, status: OrderStatus) => {
      if(!db) {
          const current = JSON.parse(localStorage.getItem('whatsappOrders') || JSON.stringify(MOCK_WHATSAPP_ORDERS));
          const updated = current.map((o: WhatsAppOrder) => o.id === orderId ? { ...o, status } : o);
          localStorage.setItem('whatsappOrders', JSON.stringify(updated));
          dispatchLocalUpdate('wa');
          return;
      }
      const ref = doc(db, 'whatsapp_orders', orderId);
      await updateDoc(ref, { status });
  }
};