
import { PricingItem, VideoLog } from './types';

// Updated Logic: FlashSale and Promotion are now Percentages (0-100), not fixed amounts.
const calculateInitialTotal = (hargaJual: number, biaya1250: number, voucherPct: number, flashSalePct: number, promotionPct: number, affiliate: number, admin: number, ongkir: number) => {
  // Deductions based on Selling Price (Harga Jual)
  const percentageDeductions = (hargaJual * (affiliate + admin + ongkir + flashSalePct + promotionPct)) / 100;
  // Fixed Fees
  const fixedFees = biaya1250;
  
  return hargaJual - percentageDeductions - fixedFees;
};

// --- DATA IMPORT KGLOW (SHOP 3) ---
// Format: [SKU, Display Price, Selling Price (Targeted), Affiliate%, Admin%, Ongkir%]
const NEW_KGLOW_IMPORT: [string, number, number, number, number, number][] = [
  ["KAHF ALL VAR", 34499, 24591, 7, 9, 4],
  ["XX020", 38799, 38799, 11, 9, 4],
  ["XX061 (SELIP XX419)", 10200, 7650, 2, 9, 4],
  ["XX080", 22600, 15800, 11, 9, 4],
  ["XX083", 33250, 26500, 12, 9, 4],
  ["XX156", 273000, 29000, 2, 9, 4],
  ["XX186", 38750, 22825, 10, 9, 4],
  ["XX298", 73900, 36945, 11, 9, 4],
  ["XX298 BLUE", 59900, 39490, 11, 9, 4],
  ["XX298 PINK", 88554, 52500, 11, 9, 4],
  ["XX299", 42290, 38000, 11, 9, 4],
  ["XX315", 44299, 31009.3, 13, 9, 4],
  ["XX316", 30590, 29060.5, 7, 9, 4],
  ["XX316", 31370, 29800, 13, 9, 4],
  ["XX317", 32875, 29324, 7, 9, 4],
  ["XX317", 31370, 29800, 13, 9, 4],
  ["XX320", 44900, 34200, 10, 9, 4],
  ["XX321", 43000, 27950, 7, 9, 4],
  ["XX322", 43000, 27950, 7, 9, 4],
  ["XX323", 43000, 27950, 7, 9, 4],
  ["XX324", 43000, 27950, 7, 9, 4],
  ["XX325", 26500, 25175, 7, 9, 4],
  ["XX330", 47816, 33471.2, 13, 9, 4],
  ["XX364", 43900, 21500, 13, 9, 4],
  ["XX365", 48715, 34100, 13, 9, 4],
  ["XX325", 36000, 25175, 7, 9, 4],
  ["XX335", 44860, 31400, 13, 9, 4],
  ["XX334", 38500, 26639, 13, 9, 4],
  ["XX360", 44150, 30900, 13, 9, 4],
  ["XX369", 40000, 27700, 13, 9, 4],
  ["XX380", 39900, 28308, 13, 9, 4],
  ["XX183", 49700, 34800, 13, 9, 4],
  ["XX396", 150000, 77000, 13, 9, 4],
  ["XX331", 37900, 31800, 7, 9, 4],
  ["XX331", 37400, 35490, 13, 9, 4],
  ["XX333", 39800, 25850, 7, 9, 4],
  ["XX334", 29599, 26639, 7, 9, 4],
  ["XX335", 59900, 31400, 7, 9, 4],
  ["XX336", 30547, 18328, 6, 9, 4],
  ["XX338", 42667, 31499, 10, 9, 4],
  ["XX340", 64700, 35998, 16, 9, 4],
  ["XX342", 88200, 44125, 13, 9, 4],
  ["XX343", 81200, 56840, 13, 9, 4],
  ["XX345", 19980, 19980, 2, 9, 4],
  ["XX360", 41320, 28211, 7, 9, 4],
  ["XX364", 58000, 34800, 11, 9, 4],
  ["XX365", 42600, 34100, 11, 9, 4],
  ["XX369", 27700, 23400, 7, 9, 4],
  ["XX373", 115000, 92000, 16, 9, 4],
  ["XX375", 32900, 24675, 7, 9, 4],
  ["XX378", 30547, 18349, 6, 9, 4],
  ["XX380", 35385, 28308, 10, 9, 4],
  ["XX381", 32106, 20868.9, 2, 9, 4],
  ["XX382", 69000, 34500, 16, 9, 4],
  ["XX382 NEWER VER.", 62700, 27650, 10, 9, 4],
  ["XX386", 81390, 81390, 16, 9, 4],
  ["XX387", 83500, 50590, 16, 9, 4],
  ["XX389", 64500, 45120, 11, 9, 4],
  ["XX390", 111911, 61551.05, 16, 9, 4],
  ["XX393", 60000, 35500, 13, 9, 4],
  ["XX393", 37350, 35490, 13, 9, 4],
  ["XX395", 47750, 35800, 16, 9, 4],
  ["XX396", 100000, 77000, 16, 9, 4],
  ["XX397", 85000, 79990, 16, 9, 4],
  ["XX398", 37800, 24560, 7, 9, 4],
  ["XX398", 31060, 29500, 13, 9, 4],
  ["XX399", 31060, 29500, 13, 9, 4],
  ["XX405", 33040, 26990, 7, 9, 4],
  ["XX406", 199500, 125299, 16, 9, 4],
  ["XX406 DISC", 94990, 94990, 16, 9, 4],
  ["XX407", 68899, 45160, 13, 9, 4],
  ["XX410", 39000, 31200, 10, 9, 4],
  ["XX411", 31150, 31150, 7, 9, 4],
  ["XX412", 31150, 31150, 7, 9, 4],
  ["XX413", 34999, 26249, 10, 9, 4],
  ["XX414", 37000, 29600, 10, 9, 4],
  ["XX416", 34839, 22645.35, 7, 9, 4],
  ["XX417", 55250, 37905, 13, 9, 4],
  ["XX417 & XX418", 55250, 37905, 13, 9, 4],
  ["XX418", 55250, 37905, 13, 9, 4],
  ["XX419", 27750, 20812.5, 6, 9, 4],
  ["XX422", 28899, 23119.2, 7, 9, 4],
  ["XX423", 44500, 29324, 7, 9, 4],
  ["XX424", 39899, 29324, 7, 9, 4],
  ["XX425", 44500, 29324, 7, 9, 4],
  ["XX426", 25990, 24690.5, 7, 9, 4],
  ["XX427", 43999, 33172, 7, 9, 4],
  ["XX443", 39500, 25675, 7, 9, 4],
  ["XX448", 94050, 56050, 11, 9, 4],
  ["XX449", 52846, 44919, 11, 9, 4],
  ["XX450", 29647, 24000, 7, 9, 4],
  ["XX253", 207000, 31329, 10, 9, 4],
];

// --- DATA IMPORT KISSMART (SHOP 2) ---
// Format: [SKU, Display Price, Selling Price (Targeted), Affiliate%, Admin%, Ongkir%]
const NEW_KISSMART_IMPORT: [string, number, number, number, number, number][] = [
  ["KAHF ALL FACE WASH", 34500, 24592, 2, 9, 4],
  ["XX083", 33250, 26600, 11, 9, 4],
  ["XX298", 0, 0, 2, 9, 4], // Missing price data in source (DIV/0)
  ["XX315", 60000, 30000, 6, 9, 4],
  ["XX325", 22999, 22999, 2, 9, 4],
  ["XX330", 55000, 39900, 2, 9, 4],
  ["XX334", 34900, 29665, 2, 9, 4],
  ["XX335", 50370, 45333, 2, 9, 4],
  ["XX336", 30547, 18328, 6, 9, 4],
  ["XX345", 28900, 20230, 2, 9, 4],
  ["XX360", 43500, 23925, 6, 9, 4],
  ["XX364", 58000, 34800, 2, 9, 4],
  ["XX365", 42600, 31950, 2, 9, 4],
  ["XX373", 125900, 104245, 2, 9, 4],
  ["XX378", 30547, 18349, 2, 9, 4],
  ["XX380", 38910, 29400, 6, 9, 4],
  ["XX382", 84990, 63742, 2, 9, 4],
  ["XX389", 64500, 45120, 11, 9, 4],
  ["XX390", 58800, 52920, 6, 9, 4],
  ["XX393", 60000, 29520, 6, 9, 4],
  ["XX395", 40800, 22440, 5, 9, 4],
  ["XX396", 100000, 65000, 11, 9, 4],
  ["XX397", 85000, 59500, 11, 9, 4],
  ["XX405", 29320, 22146, 6, 9, 4],
  ["XX406", 210000, 154560, 2, 9, 4],
  ["XX406 CHEAP", 95000, 94500, 2, 9, 4],
  ["XX412", 43800, 30660, 2, 9, 4],
  ["XX413", 35000, 25990, 6, 9, 4],
  ["XX417", 55250, 38675, 2, 9, 4],
  ["XX418", 55250, 38675, 2, 9, 4],
  ["XX422", 37420, 29792, 2, 9, 4],
  ["XX423", 44500, 33375, 2, 9, 4],
  ["XX424", 44500, 31150, 2, 9, 4],
  ["XX425", 44500, 33375, 2, 9, 4],
  ["XX427", 49900, 39920, 2, 9, 4],
  ["XX427 CHEAP", 38000, 37650, 2, 9, 4],
  ["XX443", 39500, 25675, 5, 9, 4],
  ["XX449", 54300, 46155, 11, 9, 4],
  ["XX450", 30000, 27000, 2, 9, 4],
];

// Helper to calculate default date (+2 years)
const getDefaultExpiry = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
};

// Generate Pricing Items strictly for Shop 3 based on import
const KGLOW_ITEMS: PricingItem[] = NEW_KGLOW_IMPORT.map((item, idx) => {
  const [sku, displayPrice, sellPrice, aff, adm, ong] = item;
  // Initialize with 0 flash sale/promo percentages
  const total = calculateInitialTotal(sellPrice, 1250, 0, 0, 0, aff, adm, ong);
  
  return {
    id: `kglow-new-${idx}-${sku.replace(/\s+/g, '')}`,
    sku: sku,
    shopId: 'shop3',
    productName: sku,
    brand: 'KGLOW',
    stock: 0, 
    rating: 0, 
    price: displayPrice,
    priceNet: 20000, // Default HPP
    biaya1250: 1250,
    voucher: 0,
    discount: displayPrice - sellPrice,
    hargaJual: sellPrice,
    flashSale: 0, // 0%
    promotion: 0, // 0%
    affiliate: aff,
    admin: adm,
    ongkir: ong,
    total: total,
    voucherExpiry: getDefaultExpiry(),
    image: ''
  };
});

// Generate Pricing Items strictly for Shop 2 (KISSMART) based on new import
const KISSMART_ITEMS: PricingItem[] = NEW_KISSMART_IMPORT.map((item, idx) => {
  const [sku, displayPrice, sellPrice, aff, adm, ong] = item;
  const total = calculateInitialTotal(sellPrice, 1250, 0, 0, 0, aff, adm, ong);
  
  return {
    id: `kissmart-new-${idx}-${sku.replace(/\s+/g, '')}`,
    sku: sku,
    shopId: 'shop2', // KISSMART
    productName: sku,
    brand: 'KISSMART',
    stock: 0, 
    rating: 0, 
    price: displayPrice,
    priceNet: 20000, // Default HPP
    biaya1250: 1250,
    voucher: 0,
    discount: displayPrice - sellPrice,
    hargaJual: sellPrice,
    flashSale: 0,
    promotion: 0,
    affiliate: aff,
    admin: adm,
    ongkir: ong,
    total: total,
    voucherExpiry: getDefaultExpiry(),
    image: ''
  };
});

// Combines KGLOW and KISSMART items. Shop 1 (MINIGLAM) remains empty as per instructions.
export const INITIAL_PRICING: PricingItem[] = [...KGLOW_ITEMS, ...KISSMART_ITEMS];

export const INITIAL_VIDEO_LOGS: VideoLog[] = [
  { id: 'v1', date: '2025-12-26', shopId: 'shop1', sku: 'XX450', videoCode: 'XX450-001', views: 50, likes: 0, orders: 0, concept: 'Unboxing' },
  { id: 'v2', date: '2025-12-27', shopId: 'shop1', sku: 'XX331', videoCode: 'XX331', views: 14, likes: 0, orders: 0, concept: 'Unboxing' },
  { id: 'v3', date: '2025-12-28', shopId: 'shop1', sku: 'XX426', videoCode: 'XX426-001', views: 10, likes: 0, orders: 0, concept: 'Unboxing' },
  { id: 'v4', date: '2025-12-28', shopId: 'shop1', sku: 'XX330', videoCode: 'XX330-001', views: 343, likes: 0, orders: 0, concept: 'Unboxing' },
  { id: 'v5', date: '2025-12-28', shopId: 'shop1', sku: 'XX083', videoCode: 'XX083-001', views: 135, likes: 0, orders: 0, concept: 'Unboxing' },
  { id: 'v54', date: '2026-01-02', shopId: 'shop3', sku: 'MP044', videoCode: 'MP044-001', views: 0, likes: 0, orders: 0, concept: 'Unboxing' },
  { id: 'v55', date: '2026-01-03', shopId: 'shop3', sku: 'MP064', videoCode: 'MP064-001', views: 0, likes: 0, orders: 0, concept: 'Unboxing' },
  { id: 'v56', date: '2026-01-03', shopId: 'shop3', sku: 'MP068', videoCode: 'MP068-001', views: 0, likes: 0, orders: 0, concept: 'Unboxing' },
];
