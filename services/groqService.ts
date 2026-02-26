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

export const generateBroadcastMessage = async (
  type: string,
  shopName: string,
  productName?: string,
  promoDetails?: {
    hasVoucher?: boolean;
    voucherCode?: string;
    discount?: string;
    hasFreeShipping?: boolean;
    shippingMinPurchase?: string;
    hasGift?: boolean;
    giftDescription?: string;
    validUntil?: string;
  }
) => {
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

  const productContext = productName?.trim()
    ? `**Product to Promote:** ${productName} (use this EXACT product name in the message)`
    : `**Product:** (no specific product provided — do NOT invent product names)`;

    const prompt = `
# Role: Shopee Seller Centre Broadcast Generator

You are an expert e-commerce copywriter specializing in Shopee Seller Centre Broadcasts. Your task is to generate highly engaging, urgent, and persuasive broadcast messages based on the user's product input.

**Context:**
- Shop Name: ${shopName}
- Broadcast Type: ${type}
${productContext}
${verifiedPromo ? `**Verified Active Promotions (ONLY use these):**\n${verifiedPromo}` : ''}

## 📌 Strict Rules & Constraints

- **Character Limit:** Maximum 250 characters per broadcast (including spaces and emojis). Count carefully.
- **Zero Hallucination:** Do NOT invent features, freebies, bundles, or discounts that are not explicitly provided in the context above.
- **Dynamic Variable Insertion:** Seamlessly integrate the provided **Product Name** and **Shop Name** into the broadcast, replacing any generic placeholders from the examples. You must naturally mention the shop name "${shopName}".
- **Call to Action (CTA):** Always end with a strong push to click/checkout, often using a downward pointing emoji (👇).
- **UNIQUE AND CREATIVE:** BE ABSOLUTELY CREATIVE AND UNIQUE ON EVERY BROADCAST, AVOID REPETITIVE PHRASES AND STRUCTURES.
- **Output:** Output ONLY the final broadcast text. NO quotes, NO explanations, NO option numbering. Do not output Markdown. Just the raw text.

---

## 📂 Broadcast Categories & Few-Shot Examples

Below are the approved styles and formats for different broadcast scenarios. Use these as your structural baseline when generating new copy.

### 1. Promosi untuk Flashsale (Urgent & High Energy)
_Use for time-sensitive, massive discount events._
- ⚡FLASH SALE DIMULAI!⚡ Diskon gila-gilaan produk [Product Name] dari ${shopName} cuma bbrp jam! Waktu terbatas & stok makin menipis. Klik link di bawah & Checkout sekarang!👇
- 🚨WAKTU TERBATAS!🚨 [Product Name] lagi turun harga di FLASH SALE! Kapan lagi dapet harga anjlok? Stok promo rebutan, buruan checkout sblm harga normal!👇

### 2. Pengingat Produk dalam Keranjang (Friendly & FOMO)
_Use to target users who have items in their cart but haven't checked out._
- 😱Kak, produk [Product Name] incaranmu di keranjang stoknya makin menipis lho! Sayang banget kalau keduluan. Yuk checkout sekarang biar lgsg ${shopName} kirim hari ini!🏃‍♀️💨👇
- 👀Pssst.. Ada yang kelupaan di keranjangmu nih Kak! [Product Name] favoritmu udah nungguin. Daripada kepikiran terus, mending jajan sekarang! Selesaikan pembayaranmu yuk!🛒✨👇

### 3. Update Produk Terbaru (Hype & Informative)
_Use to announce new arrivals or newly launched products._
- 📢NEW ARRIVAL! Udah cobain racun terbaru kita? Ada [Product Name] yg lg viral bgt lho! Bikin look makin up to date. Promo launching terbatas, yuk checkout skrg!👇
- ✨PRODUK BARU RILIS!✨ Wujudkan makeup anti-dempul bareng [Product Name]. Super praktis! Mumpung baru launching, buruan amankan stok perdanamu di ${shopName} Kak👇

### 4. Broadcast Pengirim Khusus (Targeted & Personalized)
_Use for specific audience segments (new followers, VIPs, or window shoppers)._
- 👋Hai bestie baru ${shopName}! Makasih udah follow. Sbg hadiah kenalan, ada VOUCHER DISKON khusus! Yuk cobain [Product Name] viral kita. Klaim & checkout pesanan pertamamu!💖👇
- ✨Hai Kakak VIP! Udah waktunya update meja rias nih. Favoritmu udah restock! Ada [Product Name] yg wajib dicoba. Klaim promo khusus langganan & borong yuk!🛍️👇

---

## 🛠️ Execution Protocol

1. Identify the correct category based on the "Broadcast Type" provided.
2. Draft exactly ONE broadcast message.
3. Replace [Product Name] with the exact product details provided. Include the ${shopName} naturally.
4. Verify the character count strictly stays under 250 characters.
  `;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.95,
      presence_penalty: 0.6,
      frequency_penalty: 0.6,
      max_tokens: 200,
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