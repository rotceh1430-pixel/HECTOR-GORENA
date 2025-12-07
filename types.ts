
export enum Role {
  ADMIN = 'ADMIN',
  CAJERO = 'CAJERO',
  ALMACEN = 'ALMACEN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string; // In a real app, never store plain text
}

export type ProductCategory = 
  | 'Alfajores artesanales' 
  | 'Pasteleria' 
  | 'Snacks salados' 
  | 'Bebidas calientes' 
  | 'Bebidas frías' 
  | 'Otro';

export interface Product {
  id: string;
  name: string;
  barcode: string; // EAN/UPC
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  category: ProductCategory;
  unit: string;
  image?: string; // Base64 or URL
  displayOrder?: number; // New field for custom sorting
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  total: number;
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  cashierName: string;
  // New Fields for Enhanced POS
  customerName: string;
  taxId?: string; // NIT/RUT/CUIT
  documentType: 'FACTURA' | 'RECIBO' | 'NINGUNO';
  deliveryMethod?: 'IMPRESO' | 'DIGITAL_EMAIL' | 'DIGITAL_WA' | 'NONE';
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  purchaseDate: string;
  location: string;
  status: 'Funcionando' | 'En Reparación' | 'Baja';
  qrCode: string; // Internal ID for QR
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'ENTRADA' | 'SALIDA';
  quantity: number;
  reason: string;
  date: string;
  user: string;
}

export type OrderStatus = 'PENDIENTE' | 'PREPARACION' | 'LISTO' | 'ENTREGADO';

export interface WhatsAppOrder {
  id: string;
  customerName: string;
  phoneNumber: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

// --- KDS / Kitchen System Types ---
export type KitchenStatus = 'PENDING' | 'DELIVERED';

export interface KitchenOrder {
  id: string;
  tableId: string; // Or Customer Name
  items: { name: string; quantity: number }[];
  status: KitchenStatus;
  timestamp: string; // ISO String
  userId: string;
}
