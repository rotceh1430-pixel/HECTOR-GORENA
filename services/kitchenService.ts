import { KitchenOrder, KitchenStatus } from '../types';
import { db } from './firebaseConfig';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where, limit } from "firebase/firestore";

const COLLECTION_NAME = 'kitchen_orders';

export const KitchenService = {
  // Listen to real-time updates from Firestore
  subscribeToOrders: (callback: (orders: KitchenOrder[]) => void) => {
    if (!db) {
        // Fallback for demo without keys
        const loadLocal = () => {
            const stored = localStorage.getItem(COLLECTION_NAME);
            callback(stored ? JSON.parse(stored) : []);
        };
        loadLocal();

        // Listener for same-tab updates
        window.addEventListener('kitchen_orders_updated', loadLocal);
        
        // Listener for cross-tab updates (important for Customer QR tab -> Kitchen Tab)
        const storageListener = (e: StorageEvent) => {
            if (e.key === COLLECTION_NAME) loadLocal();
        };
        window.addEventListener('storage', storageListener);

        return () => {
            window.removeEventListener('kitchen_orders_updated', loadLocal);
            window.removeEventListener('storage', storageListener);
        };
    }

    // Query: Get all pending orders OR delivered orders from the last 12 hours (simplified to last 50 for demo)
    const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: KitchenOrder[] = [];
      snapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as KitchenOrder);
      });
      callback(orders);
    });

    return unsubscribe;
  },

  addOrder: async (order: Omit<KitchenOrder, 'id' | 'timestamp' | 'status'>) => {
    const newOrder = {
      ...order,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };

    if (!db) {
         // LocalStorage Fallback
         const current = JSON.parse(localStorage.getItem(COLLECTION_NAME) || '[]');
         const orderWithId = { ...newOrder, id: Math.random().toString(36).substr(2, 9) };
         localStorage.setItem(COLLECTION_NAME, JSON.stringify([orderWithId, ...current]));
         window.dispatchEvent(new Event('kitchen_orders_updated'));
         return;
    }

    try {
      await addDoc(collection(db, COLLECTION_NAME), newOrder);
    } catch (e) {
      console.error("Error adding kitchen order: ", e);
    }
  },

  updateOrderStatus: async (orderId: string, status: KitchenStatus) => {
    if (!db) {
        // LocalStorage Fallback
        const current = JSON.parse(localStorage.getItem(COLLECTION_NAME) || '[]');
        const updated = current.map((o: KitchenOrder) => o.id === orderId ? { ...o, status } : o);
        localStorage.setItem(COLLECTION_NAME, JSON.stringify(updated));
        window.dispatchEvent(new Event('kitchen_orders_updated'));
        return;
    }

    try {
      const orderRef = doc(db, COLLECTION_NAME, orderId);
      await updateDoc(orderRef, { status });
    } catch (e) {
      console.error("Error updating order status: ", e);
    }
  }
};