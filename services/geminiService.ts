
import { GoogleGenAI, Type } from "@google/genai";
import { SalesRecord, SHOPS } from '../types';
import { formatCurrency, formatPercent, formatNumber } from '../utils';

interface CoachContext {
  startDate: string;
  endDate: string;
  shopNames: string[];
}

export const getSalesCoachInsight = async (records: SalesRecord[], context: CoachContext) => {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;
  
  if (!apiKey) {
    return "API Key is missing. Please set GEMINI_API_KEY in .env or run localStorage.setItem('gemini_api_key', 'YOUR_KEY') in console.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. Contextual Data Preparation
  // If data is small (< 50 rows), send raw data. 
  // If large, send weekly aggregates to keep token usage efficient and insights trend-focused.
  let dataSummary = '';
  
  // Sort by date ascending for the AI to read chronological trends
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedRecords.length === 0) {
      return "No data found for the selected range. Please add daily sales reports.";
  }

  // Calculate High Level Stats
  const totalSales = sortedRecords.reduce((acc, r) => acc + r.penjualan, 0);
  const totalOrders = sortedRecords.reduce((acc, r) => acc + r.pesanan, 0);
  const totalVisitors = sortedRecords.reduce((acc, r) => acc + r.pengunjung, 0);
  const avgConv = sortedRecords.length > 0 
    ? sortedRecords.reduce((acc, r) => acc + r.konversi, 0) / sortedRecords.length 
    : 0;

  if (sortedRecords.length > 50) {
      // Aggregate mode for long date ranges
      dataSummary = `Dataset too large for row-by-row. Aggregated Stats:\n` +
                    `- Total Records: ${sortedRecords.length}\n` +
                    `- Date Range: ${context.startDate} to ${context.endDate}\n` +
                    `- Shops: ${context.shopNames.join(', ')}`;
  } else {
      // Granular mode
      dataSummary = sortedRecords.map(r => {
        const shopName = SHOPS.find(s => s.id === r.shopId)?.name || r.shopId;
        return `[${r.date}] ${shopName}: Sales=${formatCurrency(r.penjualan)}, Orders=${r.pesanan}, Visits=${formatNumber(r.pengunjung)}, Conv=${formatPercent(r.konversi)}`;
      }).join('\n');
  }

  const prompt = `
    You are an elite Digital Marketing Sales Coach for Shopee Indonesia.
    
    **ANALYSIS CONTEXT:**
    - **Period:** ${context.startDate} to ${context.endDate}
    - **Shops Analyzed:** ${context.shopNames.join(', ')}
    - **Total Sales:** ${formatCurrency(totalSales)}
    - **Total Orders:** ${formatNumber(totalOrders)}
    - **Traffic (Visitors):** ${formatNumber(totalVisitors)}
    - **Avg Conversion:** ${formatPercent(avgConv)}
    
    **RAW DATA LOGS:**
    ${dataSummary}
    
    **YOUR MISSION:**
    Provide a high-impact, strategic performance review. Do not just summarize the numbers; tell me *why* they matter and *what* to do.

    **REQUIRED OUTPUT FORMAT (Markdown):**
    
    ## 🏆 Performance Snapshot
    (Give a 1-sentence executive summary of the performance trend. Is it up? Down? Stable?)

    ## 🚀 Key Wins & Trends
    (Bullet points. Highlight specific days or shops that performed well. Use **bold** for emphasis.)

    ## 💡 Actionable Growth Strategy
    (Give 2 specific, hard-hitting recommendations to improve based on the lowest metrics. e.g. If traffic is low, suggest ads/content. If conversion is low, suggest pricing/vouchers.)

    **TONE:**
    Energetic, professional, and motivating. Keep it concise (under 200 words total).
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
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;

  if (!apiKey) {
    return "API Key is missing.";
  }

  const ai = new GoogleGenAI({ apiKey });

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

export const generateBroadcastMessage = async (type: string) => {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;

  if (!apiKey) {
    return "API Key is missing.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Create a Shopee Chat Broadcast Message (Blast) in Bahasa Indonesia.
    Target Audience/Goal: ${type}
    
    CRITICAL RULES:
    1. Max 250 characters TOTAL (including spaces & emoji). This is a strict hard limit.
    2. Tone: Urgent, Exciting, Friendly. Use relevant emojis (🔥, 🎁, ⚡).
    3. Call to Action (CTA): Must be clear (e.g., "Cek keranjang skrg!", "Checkout yuk!").
    4. Language: Natural Indonesian marketing slang (Casual but polite).
    
    Output ONLY the message text. Do not add quotes or explanations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Broadcast Error:", error);
    return "Error generating broadcast. Please try again.";
  }
};

export const generateCustomerServiceReply = async (customerMessage: string, context: string) => {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;

  if (!apiKey) {
    return JSON.stringify({
      optionA: "API Key is missing.",
      optionB: "API Key is missing.",
      optionC: "API Key is missing."
    });
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert Customer Service Agent for Shopee Indonesia.
    
    **Customer Message:** "${customerMessage}"
    **Context:** ${context || "None provided"}
    
    Generate 3 distinct responses in Bahasa Indonesia:
    
    1. **Option A (Empathetic):** Focus on apologizing, showing understanding, and de-escalating anger.
    2. **Option B (Professional):** Standard SOP, formal, clear, and direct.
    3. **Option C (Friendly):** Casual, warm, using emojis, suitable for younger customers.
    
    Return strictly a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optionA: { type: Type.STRING },
            optionB: { type: Type.STRING },
            optionC: { type: Type.STRING },
          },
        },
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Chat Error:", error);
    return JSON.stringify({
      optionA: "Error generating reply.",
      optionB: "Error generating reply.",
      optionC: "Error generating reply."
    });
  }
};

export const createCampaignChat = () => {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are a world-class E-commerce Campaign Strategist specifically for Shopee Indonesia. 
    Your goal is to help the user brainstorm, plan, and refine high-conversion marketing campaigns.

    **YOUR CAPABILITIES:**
    1. **Idea Generation:** Suggest themes (e.g., Payday, Twin Date 9.9, Clearance, New Arrival).
    2. **Mechanics:** Recommend specific mechanics (Flash Sale, Bundles, Add-on Deal, Shopee Live, Affiliate challenges).
    3. **Copywriting:** Create catchy campaign names and hooks in Bahasa Indonesia.
    4. **Refinement:** Ask clarifying questions to tailor the campaign to the user's budget and product type.

    **OUTPUT STYLE:**
    - Use Bahasa Indonesia mixed with English marketing terms (Shopee slang like "CO sekarang", "Gercep").
    - Be structured: Use **Bold** headers, lists, and emojis.
    - Be Actionable: Don't just say "do a sale", say "Set up a Flash Sale at 12:00-14:00 with 50% off hero SKU".

    **FORMAT FOR CAMPAIGN IDEAS:**
    When suggesting a campaign, try to include:
    - **Campaign Name**: Catchy title.
    - **Hook**: Why customers will care.
    - **Mechanics**: What setup is needed in Seller Center.
    - **Channels**: Where to promote (Feed, Live, Blast).
  `;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};
