
export type ShopID = 'shop1' | 'shop2' | 'shop3';

export interface SalesRecord {
  id: string;
  date: string; // YYYY-MM-DD
  shopId: ShopID;
  penjualan: number;
  pesanan: number;
  konversi: number; // Percentage as decimal
  pengunjung: number;
  produkDiklik: number;
  // Operational Health
  chatResponseRate?: number; // 0-100
  lateShipmentRate?: number; // 0-100
}

export interface VideoLog {
  id: string;
  date: string;
  shopId: ShopID;
  sku: string; // Links to PricingItem
  concept: string; // e.g. "Unboxing", "Soft Sell", "Trend/Meme", "Review"
  views: number;
  likes: number;
  orders: number; // Orders generated from this video
  gmv?: number; // Optional Sales amount
}

export interface Product {
  id: string;
  shopId: ShopID;
  name: string;
  rank: number;
  sales: number;
  image: string;
  sku?: string; // Added for linking to PricingItem
}

export interface Task {
  id: string;
  text: string;
  frequency: 'daily' | 'weekly';
  reminderTime?: string; // HH:mm format
}

export interface TaskCompletion {
  date: string; // YYYY-MM-DD
  shopId: ShopID;
  taskId: string;
  completed: boolean;
}

// New Interface for Numeric Productivity Tracking
export interface WorkLog {
  date: string;
  shopId: ShopID;
  flashSalesCreated: number;
  productsRenamed: number;
  vouchersUpdated: number;
  reviewsAudited: number;
  competitorsChecked: number;
}

export interface PricingItem {
  id: string;
  sku: string;
  shopId: ShopID;
  productName: string;
  image: string;
  brand: string;
  stock: number;
  rating?: number; // New: 0-5 Star Rating
  price: number; // Normal Price
  
  priceNet: number; // HPP / Bottom Price
  biaya1250: number; // Fixed cost
  voucher: number; // Fixed Rp
  voucherExpiry?: string; // YYYY-MM-DD
  discount: number;
  hargaJual: number; // Selling Price

  // Deductions (Fixed Rp)
  flashSale: number; 
  promotion: number;

  // Percentages (0-100)
  affiliate: number;
  admin: number;
  ongkir: number;

  total: number; // Net Revenue (Calculated)
}

export interface CompetitorItem {
  id: string;
  mySku: string;
  shopId: ShopID;
  competitorName: string;
  competitorPrice: number;
  lastChecked: string;
}

export const SHOPS: { id: ShopID; name: string; color: string }[] = [
  { id: 'shop1', name: 'MINIGLAM', color: '#F472B6' }, // Soft Pink
  { id: 'shop2', name: 'KISSMART', color: '#DC2626' }, // Red
  { id: 'shop3', name: 'KGLOW', color: '#8B5CF6' },    // Purplish
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', text: 'Check Chat Response Rate', frequency: 'daily', reminderTime: '08:00' },
  { id: 't2', text: 'Process Pending Orders', frequency: 'daily', reminderTime: '09:00' },
  { id: 't4', text: 'Upload 1 Video (Remix for all 3 Shops)', frequency: 'daily', reminderTime: '13:00' },
  { id: 't8', text: 'Send Chat Broadcast (Use AI Helper)', frequency: 'daily', reminderTime: '16:00' },
  { id: 't5', text: 'Competitor Price Check (Top 20 Only)', frequency: 'weekly' },
  { id: 't6', text: 'Decorate Shop Banner', frequency: 'weekly' },
];

export const CAMPAIGN_TASKS: Task[] = [
  { id: 'c1', text: '⚡ Broadcast Chat Message', frequency: 'daily' },
  { id: 'c2', text: '⚡ Verify Flash Sale Slots Active', frequency: 'daily' },
  { id: 'c3', text: '⚡ Check Voucher Budget & Claims', frequency: 'daily' },
  { id: 'c4', text: '⚡ Monitor Top 10 SKU Stock', frequency: 'daily' },
  { id: 'c6', text: '⚡ Upload 3 Videos (Teasers/Countdown)', frequency: 'daily' },
];
