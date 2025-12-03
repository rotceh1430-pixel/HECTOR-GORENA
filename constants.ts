import { Product, Role, User, Asset, Sale, WhatsAppOrder } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Ana Admin', email: 'admin@cafe.com', role: Role.ADMIN, password: '123' },
  { id: '2', name: 'Carlos Cajero', email: 'cajero@cafe.com', role: Role.CAJERO, password: '123' },
  { id: '3', name: 'Luis Almacen', email: 'almacen@cafe.com', role: Role.ALMACEN, password: '123' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Alfajor de Maicena', barcode: '779001', price: 2.50, cost: 0.80, stock: 50, minStock: 20, category: 'Alfajor', unit: 'unid' },
  { id: 'p2', name: 'Alfajor Chocolate Negro', barcode: '779002', price: 3.00, cost: 1.20, stock: 15, minStock: 20, category: 'Alfajor', unit: 'unid' },
  { id: 'p3', name: 'Alfajor Chocolate Blanco', barcode: '779003', price: 3.00, cost: 1.20, stock: 30, minStock: 15, category: 'Alfajor', unit: 'unid' },
  { id: 'p4', name: 'Café Espresso', barcode: '990001', price: 2.00, cost: 0.50, stock: 500, minStock: 100, category: 'Bebida', unit: 'taza' },
  { id: 'p5', name: 'Capuchino', barcode: '990002', price: 3.50, cost: 0.90, stock: 450, minStock: 100, category: 'Bebida', unit: 'taza' },
  { id: 'p6', name: 'Medialuna', barcode: '880001', price: 1.50, cost: 0.40, stock: 10, minStock: 24, category: 'Snack', unit: 'unid' },
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
    total: 17.00,
    status: 'PENDIENTE',
    createdAt: new Date().toISOString(),
    notes: 'Sin azúcar en el café'
  },
  {
    id: 'w2',
    customerName: 'Juan Perez',
    phoneNumber: '+5491187654321',
    items: [
      { ...INITIAL_PRODUCTS[1], quantity: 12 }
    ],
    total: 36.00,
    status: 'LISTO',
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  }
];