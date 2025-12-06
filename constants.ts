import { Product, Role, User, Asset, Sale, WhatsAppOrder } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Ana Admin', email: 'admin@cafe.com', role: Role.ADMIN, password: '123' },
  { id: '2', name: 'Carlos Cajero', email: 'cajero@cafe.com', role: Role.CAJERO, password: '123' },
  { id: '3', name: 'Luis Almacen', email: 'almacen@cafe.com', role: Role.ALMACEN, password: '123' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    name: 'Alfajor de Maicena', 
    barcode: '779001', 
    price: 2.50, 
    cost: 0.80, 
    stock: 50, 
    minStock: 20, 
    category: 'Alfajores artesanales', 
    unit: 'unid',
    image: 'https://images.unsplash.com/photo-1598514983088-254e4c29792e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  { 
    id: 'p2', 
    name: 'Alfajor Chocolate Negro', 
    barcode: '779002', 
    price: 3.00, 
    cost: 1.20, 
    stock: 15, 
    minStock: 20, 
    category: 'Alfajores artesanales', 
    unit: 'unid',
    image: 'https://images.unsplash.com/photo-1621252062325-1158c56e30de?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  { 
    id: 'p3', 
    name: 'Tarta de Frutilla', 
    barcode: '779003', 
    price: 15.00, 
    cost: 8.00, 
    stock: 5, 
    minStock: 2, 
    category: 'Pasteleria', 
    unit: 'porción',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  { 
    id: 'p4', 
    name: 'Café Espresso', 
    barcode: '990001', 
    price: 10.00, 
    cost: 3.50, 
    stock: 500, 
    minStock: 100, 
    category: 'Bebidas calientes', 
    unit: 'taza',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  { 
    id: 'p5', 
    name: 'Capuchino', 
    barcode: '990002', 
    price: 14.00, 
    cost: 4.90, 
    stock: 450, 
    minStock: 100, 
    category: 'Bebidas calientes', 
    unit: 'taza',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  { 
    id: 'p6', 
    name: 'Empanada de Carne', 
    barcode: '880001', 
    price: 8.50, 
    cost: 3.40, 
    stock: 24, 
    minStock: 10, 
    category: 'Snacks salados', 
    unit: 'unid',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  { 
    id: 'p7', 
    name: 'Frappé de Moca', 
    barcode: '990003', 
    price: 18.00, 
    cost: 6.00, 
    stock: 100, 
    minStock: 20, 
    category: 'Bebidas frías', 
    unit: 'vaso',
    image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
];

export const INITIAL_ASSETS: Asset[] = [
  { id: 'a1', name: 'Cafetera Industrial Simonelli', value: 2500, purchaseDate: '2023-01-15', location: 'Barra', status: 'Funcionando', qrCode: 'ASSET-001' },
  { id: 'a2', name: 'Vitrina Refrigerada', value: 1200, purchaseDate: '2023-02-01', location: 'Salón', status: 'Funcionando', qrCode: 'ASSET-002' },
  { id: 'a3', name: 'Tablet Samsung (TPV)', value: 300, purchaseDate: '2023-06-10', location: 'Caja', status: 'En Reparación', qrCode: 'ASSET-003' },
];

export const MOCK_SALES: Sale[] = [
  { 
    id: 's1', 
    date: new Date(Date.now() - 86400000).toISOString(), 
    items: [], 
    total: 150.50, 
    paymentMethod: 'Efectivo', 
    cashierName: 'Carlos Cajero',
    customerName: 'Público General',
    documentType: 'RECIBO',
    deliveryMethod: 'IMPRESO'
  },
  { 
    id: 's2', 
    date: new Date(Date.now() - 172800000).toISOString(), 
    items: [], 
    total: 200.00, 
    paymentMethod: 'Tarjeta', 
    cashierName: 'Carlos Cajero',
    customerName: 'Público General',
    documentType: 'RECIBO',
    deliveryMethod: 'IMPRESO' 
  },
  { 
    id: 's3', 
    date: new Date().toISOString(), 
    items: [], 
    total: 45.00, 
    paymentMethod: 'Efectivo', 
    cashierName: 'Carlos Cajero',
    customerName: 'Público General',
    documentType: 'RECIBO',
    deliveryMethod: 'NONE' 
  },
];

export const MOCK_WHATSAPP_ORDERS: WhatsAppOrder[] = [
  {
    id: 'w1',
    customerName: 'Maria Gomez',
    phoneNumber: '+5491112345678',
    items: [
      { ...INITIAL_PRODUCTS[0], quantity: 6 },
      { ...INITIAL_PRODUCTS[3], quantity: 1 }
    ],
    total: 25.00,
    status: 'PENDIENTE',
    createdAt: new Date().toISOString(),
    notes: 'Sin azúcar en el café'
  },
];