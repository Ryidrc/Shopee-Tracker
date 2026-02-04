
import * as XLSX from 'xlsx';
import { SalesRecord, PricingItem, VideoLog, SHOPS } from '../types';
import { formatCurrency } from '../utils';

// Export sales data to Excel
export const exportSalesDataToExcel = (data: SalesRecord[], fileName?: string) => {
  const worksheetData = data.map(record => {
    const shopName = SHOPS.find(s => s.id === record.shopId)?.name || record.shopId;
    return {
      'Date': record.date,
      'Shop': shopName,
      'Sales (IDR)': record.penjualan,
      'Orders': record.pesanan,
      'Visitors': record.pengunjung,
      'Products Clicked': record.produkDiklik,
      'Conversion (%)': (record.konversi * 100).toFixed(2),
      'Chat Response (%)': record.chatResponseRate ?? '',
      'Late Shipment (%)': record.lateShipmentRate ?? ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');
  
  // Auto-size columns
  const colWidths = [
    { wch: 12 }, // Date
    { wch: 15 }, // Shop
    { wch: 15 }, // Sales
    { wch: 10 }, // Orders
    { wch: 12 }, // Visitors
    { wch: 15 }, // Products Clicked
    { wch: 15 }, // Conversion
    { wch: 18 }, // Chat Response
    { wch: 18 }, // Late Shipment
  ];
  worksheet['!cols'] = colWidths;

  const exportFileName = fileName || `sales_data_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, exportFileName);
};

// Export pricing data to Excel
export const exportPricingDataToExcel = (data: PricingItem[], fileName?: string) => {
  const worksheetData = data.map(item => {
    const shopName = SHOPS.find(s => s.id === item.shopId)?.name || item.shopId;
    const percentageSum = item.affiliate + item.admin + item.ongkir + item.flashSale + item.promotion;
    const percentageFees = (item.hargaJual * percentageSum) / 100;
    const netPayout = item.hargaJual - percentageFees - item.biaya1250;
    const profit = netPayout - item.priceNet;

    return {
      'SKU': item.sku,
      'Product Name': item.productName,
      'Shop': shopName,
      'Stock': item.stock,
      'Rating': item.rating ?? '',
      'HPP (Cost)': item.priceNet,
      'Selling Price': item.hargaJual,
      'Affiliate (%)': item.affiliate,
      'Admin (%)': item.admin,
      'Shipping (%)': item.ongkir,
      'Flash Sale (%)': item.flashSale,
      'Promotion (%)': item.promotion,
      'Fixed Fee': item.biaya1250,
      'Net Payout': Math.round(netPayout),
      'Profit': Math.round(profit),
      'Voucher Expiry': item.voucherExpiry ?? ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing Data');
  
  const exportFileName = fileName || `pricing_data_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, exportFileName);
};

// Export video logs to Excel
export const exportVideoLogsToExcel = (data: VideoLog[], pricingItems: PricingItem[], fileName?: string) => {
  const worksheetData = data.map(log => {
    const shopName = SHOPS.find(s => s.id === log.shopId)?.name || log.shopId;
    const product = pricingItems.find(p => p.sku === log.sku);

    return {
      'Date Posted': log.date,
      'Shop': shopName,
      'SKU': log.sku,
      'Product Name': product?.productName || log.sku,
      'Video Code': log.videoCode,
      'Concept': log.concept,
      'Views': log.views,
      'Likes': log.likes,
      'Orders': log.orders,
      'GMV': log.gmv
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Video Logs');
  
  const exportFileName = fileName || `video_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, exportFileName);
};
