import Groq from "groq-sdk";
import { SalesRecord, SHOPS } from '../types';
import { formatCurrency, formatPercent, formatNumber } from '../utils';

interface CoachContext {
  startDate: string;
  endDate: string;
  shopNames: string[];
}

export const getSalesCoachInsight = async (records: SalesRecord[], context: CoachContext) => {
  const apiKey = localStorage.getItem('groq_api_key') || process.env.API_KEY;
  
  if (!apiKey) {
    return "API Key is missing. Please set GROQ_API_KEY in .env or run localStorage.setItem('groq_api_key', 'YOUR_KEY') in console.";
  }

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

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
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });
    return response.choices[0]?.message?.content || "No response generated.";
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Currently unable to reach your AI Sales Coach. Please try again later.";
  }
};

export const generateVideoCaption = async (productName: string, description: string) => {
  const apiKey = localStorage.getItem('groq_api_key') || process.env.API_KEY;

  if (!apiKey) {
    return "API Key is missing.";
  }

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  const prompt = `
    Create a VIRAL Shopee Video caption for a BEAUTY/SKINCARE product in Bahasa Indonesia.
    
    **Product:** ${productName}
    **Benefits/Context:** ${description}
    
    **CRITICAL REQUIREMENTS:**
    1. **CHARACTER LIMIT: 140-150 characters TOTAL** (including spaces, emojis, hashtags). YOU MUST MAXIMIZE THIS LIMIT.
    2. **Target:** Indonesian beauty shoppers (18-35F) who scroll fast and need instant hooks.
    3. **Persona:** You're a beauty influencer bestie sharing a "holy grail" find.
    
    **⚠️ ABSOLUTE RULES - DO NOT VIOLATE:**
    - **NEVER mention specific voucher codes** (e.g., NO "BEAUTY15", NO "GLOW20")
    - **NEVER mention specific discount percentages** unless it's in the product description provided
    - **NEVER mention free items/gifts** unless explicitly stated in the description
    - **NEVER make up promotions** (no "Gratis ongkir", "Cashback 50%", etc.)
    - ONLY mention the product itself and its benefits
    
    **FORMULA (Fit ALL of this in 140-150 chars):**
    - **HOOK** (20-30 chars): Emotional trigger about the PRODUCT BENEFIT (e.g., "Glowing 3 hari!", "Jerawat ilang cepet!")
    - **BENEFIT** (40-50 chars): What problem it solves from the description (e.g., "Kusam jadi cerah alami", "Pori mengecil keliatan!")
    - **SOCIAL PROOF/URGENCY** (30-40 chars): Create urgency WITHOUT fake promos (e.g., "Viral di TikTok!", "Best seller bulan ini!", "Stok sering habis!")
    - **CTA** (15-20 chars): Simple action (e.g., "Wajib coba!", "Checkout sekarang!", "Jangan skip!")
    - **HASHTAGS** (25-35 chars): Viral tags (e.g., #SkincareMurah #GlowingSkin #BeautyHack)
    
    **LANGUAGE RULES:**
    - Use Indonesian slang: "Racun parah", "Auto glowing", "Wajib punya", "Nyesel kalo skip"
    - Use emojis strategically (max 3): ✨💖🔥⚡
    - NO formal language, NO "Dapatkan"
    
    **SAFE URGENCY TACTICS (Use these instead of fake promos):**
    - "Viral di TikTok/IG!"
    - "Best seller bulan ini!"
    - "Stok sering habis!"
    - "Review 4.9 bintang!"
    - "Repeat order terus!"
    - "Holy grail aku!"
    
    **EXAMPLES OF GOOD CAPTIONS (145-150 chars, NO FAKE PROMOS):**
    - "Glowing 3 hari pake ini! 😍 Serum vitamin C racun banget, kusam ilang! Best seller terus, stok sering habis! 🔥 #SkincareMurah #GlowingSkin #Viral" (149)
    - "Jerawat stubborn auto kempes! 💖 Salicylic acid hero produk aku, wajib punya! Viral di TikTok bgt! ⚡ #AntiJerawat #SkincareRoutine #BeautyHack" (147)
    
    **OUTPUT INSTRUCTIONS:**
    - Return ONLY the caption text (no quotes, no explanations)
    - Aim for 145-150 characters to MAXIMIZE space
    - DO NOT invent promotions or discounts
    - Focus on product benefits and social proof only
  `;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 120,
    });
    return response.choices[0]?.message?.content || "Error generating caption.";
  } catch (error) {
    console.error("Groq API Caption Error:", error);
    return "Error generating caption. Please try again.";
  }
};

export const generateBroadcastMessage = async (type: string, promoDetails?: {
  hasVoucher?: boolean;
  voucherCode?: string;
  discount?: string;
  hasFreeShipping?: boolean;
  shippingMinPurchase?: string;
  hasGift?: boolean;
  giftDescription?: string;
  validUntil?: string;
}) => {
  const apiKey = localStorage.getItem('groq_api_key') || process.env.API_KEY;

  if (!apiKey) {
    return "API Key is missing.";
  }

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  // Build VERIFIED promo details string
  let verifiedPromo = '';
  if (promoDetails) {
    if (promoDetails.hasVoucher && promoDetails.voucherCode && promoDetails.discount) {
      verifiedPromo += `- Voucher: ${promoDetails.voucherCode} (${promoDetails.discount} off)\n`;
    }
    if (promoDetails.hasFreeShipping) {
      const minPurchase = promoDetails.shippingMinPurchase || 'tanpa minimum';
      verifiedPromo += `- Gratis ongkir: ${minPurchase}\n`;
    }
    if (promoDetails.hasGift && promoDetails.giftDescription) {
      verifiedPromo += `- Bonus: ${promoDetails.giftDescription}\n`;
    }
    if (promoDetails.validUntil) {
      verifiedPromo += `- Valid sampai: ${promoDetails.validUntil}\n`;
    }
  }

  const prompt = `
    Create a HIGH-CONVERSION Shopee Chat Broadcast (Blast) for BEAUTY/SKINCARE products in Bahasa Indonesia.
    
    **Campaign Type/Goal:** ${type}
    
    ${verifiedPromo ? `**VERIFIED ACTIVE PROMOTIONS (ONLY use these, DO NOT invent others):**\n${verifiedPromo}` : '**NO ACTIVE PROMOTIONS** - Focus on product benefits and general shop visit CTA only.'}
    
    **CRITICAL REQUIREMENTS:**
    1. **CHARACTER LIMIT: 240-250 characters TOTAL** (including spaces, emojis). YOU MUST MAXIMIZE THIS LIMIT.
    2. **Target:** Existing Shopee customers who need a nudge to checkout.
    3. **Persona:** You're their beauty bestie with insider deals.
    
    **⚠️ ABSOLUTE RULES - DO NOT VIOLATE:**
    - **ONLY mention promotions explicitly listed above in "VERIFIED ACTIVE PROMOTIONS"**
    - **NEVER invent voucher codes** (e.g., NO random "BEAUTY15", "GLOW20")
    - **NEVER mention discounts/percentages** unless provided in verified promos
    - **NEVER mention free items/gifts** unless listed in verified promos
    - **NEVER mention "Flash Sale" timing** unless provided
    - If NO verified promos: Focus on product benefits, new arrivals, restocks, reviews
    
    **FORMULA (Fit ALL of this in 240-250 chars):**
    - **PERSONALIZED HOOK** (25-35 chars): Make it feel exclusive (e.g., "Halo Kak! Kabar baik nih", "Bestie, ada update!")
    - **VALUE/BENEFIT** (60-90 chars): 
      * IF promos exist: State them EXACTLY as provided
      * IF NO promos: Highlight product benefits, new stock, best sellers, reviews (e.g., "Serum favorit kamu RESTOK! Review 4.9 bintang, banyak repeat order!")
    - **URGENCY** (30-40 chars): 
      * IF deadline exists: Use the verified date
      * IF NO deadline: Use social proof urgency (e.g., "Stok terbatas!", "Best seller terus!", "Sering sold out!")
    - **CTA** (25-35 chars): Strong action (e.g., "Cek toko sekarang!", "Klik link buat liat koleksi!", "Yuk mampir ke toko!")
    - **EMOJIS** (5-10 chars): Max 4 emojis (✨💖🛒🔥⚡)
    
    **LANGUAGE RULES:**
    - Indonesian beauty slang: "Auto checkout", "Racun banget", "Wajib punya"
    - Avoid: "Dapatkan", "Silakan"
    - Use "Kak/Bestie" to personalize
    
    **SAFE URGENCY TACTICS (when NO verified promos):**
    - "Stok terbatas!"
    - "Best seller terus!"
    - "Sering sold out!"
    - "Review 4.8+ bintang!"
    - "Banyak repeat order!"
    - "Produk baru!"
    - "RESTOK sekarang!"
    
    **EXAMPLE WITH VERIFIED PROMO (248 chars):**
    "Halo Kak! 🎉 Khusus hari ini voucher BEAUTY20 aktif, diskon 20% min belanja 100K! Semua serum best seller termasuk ya. Valid sampai jam 23:59 malam ini aja. Buruan cek keranjang sebelum voucher habis! 🔥✨ Klik: [link]"
    
    **EXAMPLE WITHOUT PROMO (247 chars):**
    "Bestie! Ada kabar gembira 💖 Serum vitamin C favorit kamu RESTOK lagi! Review 4.9 bintang, banyak yang repeat order terus. Stok terbatas banget, sering sold out. Yuk mampir ke toko sekarang sebelum kehabisan! ✨🛒 Klik: [link]"
    
    **OUTPUT INSTRUCTIONS:**
    - Return ONLY the message text (no quotes, no explanations)
    - Aim for 245-250 characters to MAXIMIZE space
    - DO NOT hallucinate promotions
    - Include placeholder "[link]" for Shopee link
    - If no verified promos, focus on PRODUCT VALUE and SOCIAL PROOF
  `;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75, // Lowered from 0.85 to reduce hallucination
      max_tokens: 180,
    });
    return response.choices[0]?.message?.content || "Error generating broadcast.";
  } catch (error) {
    console.error("Groq API Broadcast Error:", error);
    return "Error generating broadcast. Please try again.";
  }
};

export const generateCustomerServiceReply = async (customerMessage: string, context: string) => {
  const apiKey = localStorage.getItem('groq_api_key') || process.env.API_KEY;

  if (!apiKey) {
    return JSON.stringify({
      optionA: "API Key is missing.",
      optionB: "API Key is missing.",
      optionC: "API Key is missing.",
    });
  }

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  const prompt = `
    You are a professional customer service expert for a Shopee beauty/skincare shop in Indonesia.
    
    **Customer Message:** ${customerMessage}
    **Context/Issue Type:** ${context || 'General inquiry'}
    
    **YOUR TASK:**
    Generate 3 different reply options in Bahasa Indonesia, each with a different tone:
    
    1. **Option A (Empathetic):** Warm, understanding, shows genuine care
    2. **Option B (Professional):** Polite, formal, solution-focused
    3. **Option C (Friendly):** Casual, approachable, like talking to a friend
    
    **REQUIREMENTS:**
    - Each reply should be 50-80 words
    - Address the customer's concern directly
    - Provide a clear solution or next step
    - Use appropriate Indonesian customer service language
    - Be helpful and maintain positive brand image
    
    **OUTPUT FORMAT (JSON only, no markdown):**
    {
      "optionA": "empathetic reply here",
      "optionB": "professional reply here",
      "optionC": "friendly reply here"
    }
  `;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });
    return response.choices[0]?.message?.content || JSON.stringify({
      optionA: "Error generating response.",
      optionB: "Error generating response.",
      optionC: "Error generating response.",
    });
  } catch (error) {
    console.error("Groq API CS Error:", error);
    return JSON.stringify({
      optionA: "Error generating response.",
      optionB: "Error generating response.",
      optionC: "Error generating response.",
    });
  }
};

export const createCampaignChat = async () => {
  const apiKey = localStorage.getItem('groq_api_key') || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  
  // Conversation history
  const conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are a creative marketing strategist for Shopee Indonesia beauty/skincare shops. 
      
Your role is to help brainstorm and develop marketing campaigns, promotions, and content strategies.

**Your expertise includes:**
- Campaign ideation (flash sales, seasonal promos, product launches)
- Content strategy (video ideas, captions, themes)
- Customer engagement tactics
- Promotional mechanics (vouchers, bundles, free shipping strategies)
- Target audience insights for Indonesian beauty shoppers

**Communication style:**
- Professional yet creative
- Provide actionable, specific ideas
- Use Indonesian marketing terminology when appropriate
- Ask clarifying questions when needed
- Give examples and best practices

Keep responses concise (under 150 words) unless the user asks for detailed plans.`
    }
  ];

  return {
    sendMessage: async ({ message }: { message: string }) => {
      conversationHistory.push({
        role: 'user',
        content: message
      });

      try {
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: conversationHistory,
          temperature: 0.8,
          max_tokens: 500,
        });

        const assistantMessage = response.choices[0]?.message?.content || "I couldn't generate a response.";
        
        conversationHistory.push({
          role: 'assistant',
          content: assistantMessage
        });

        return { text: assistantMessage };
      } catch (error) {
        console.error("Groq API Campaign Chat Error:", error);
        throw error;
      }
    }
  };
};