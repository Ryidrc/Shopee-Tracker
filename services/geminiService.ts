
import { GoogleGenAI } from "@google/genai";
import { SalesRecord, SHOPS } from '../types';
import { formatCurrency, formatPercent, formatNumber } from '../utils';

export const getSalesCoachInsight = async (records: SalesRecord[]) => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please check your environment configuration.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // OPTIMIZATION: Strictly limit to recent data regardless of input size
  // Sort by date desc and take max 21 entries (approx 1 week for 3 shops)
  // This ensures the AI request never becomes "heavy" or exceeds token limits.
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 21);
    
  if (recentRecords.length === 0) {
      return "Not enough data to generate insights. Please log daily reports first.";
  }

  // Pre-calculate aggregate stats to help the AI (Reduces hallucination)
  const totalSales = recentRecords.reduce((acc, r) => acc + r.penjualan, 0);
  const totalOrders = recentRecords.reduce((acc, r) => acc + r.pesanan, 0);
  const avgConv = recentRecords.length > 0 
    ? recentRecords.reduce((acc, r) => acc + r.konversi, 0) / recentRecords.length 
    : 0;

  // Format the granular data for the prompt
  const dataSummary = recentRecords.map(r => {
    const shopName = SHOPS.find(s => s.id === r.shopId)?.name || r.shopId;
    return `${r.date} | ${shopName}: Sales=${formatCurrency(r.penjualan)}, Orders=${r.pesanan}, Conv=${formatPercent(r.konversi)}`;
  }).join('\n');

  const prompt = `
    You are an expert Digital Marketing Sales Coach for Shopee. 
    
    **DATA CONTEXT (Last 7 Days)**
    - Total Sales: ${formatCurrency(totalSales)}
    - Total Orders: ${formatNumber(totalOrders)}
    - Avg Conversion: ${formatPercent(avgConv)}
    
    **DETAILED LOGS:**
    ${dataSummary}
    
    **TASK:**
    Analyze this data briefly.
    1. Give me a specific **Morale Boost** highlighting a win or positive trend.
    2. Give me 1 specific **Actionable Advice** to improve based on the lowest performing metric.
    
    **RULES:**
    - Use **bold** for key metrics and emphasis (e.g. **+5% increase**, **Conversion Rate**).
    - Keep the tone professional, energetic, and motivating. 
    - Keep it under 150 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Currently unable to reach your AI Sales Coach. Please try again later.";
  }
};

export const generateVideoCaption = async (productName: string, description: string) => {
  if (!process.env.API_KEY) {
    return "API Key is missing.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Create a Shopee Video caption in Indonesian (Bahasa Indonesia).
    Product: ${productName}
    Selling Points/Context: ${description}
    
    Requirements:
    1. STRICTLY under 150 characters (alphabets/spaces) total.
    2. Tone: Punchy, Persuasive, Viral. High energy.
    3. Include 2-3 relevant hashtags at the end.
    4. No fluff. Get straight to the hook.
    
    Output ONLY the caption text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Caption Error:", error);
    return "Error generating caption. Please try again.";
  }
};
