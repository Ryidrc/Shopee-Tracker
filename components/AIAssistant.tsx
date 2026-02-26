
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SalesRecord, PricingItem, SHOPS, ShopID } from '../types';
import { 
  getSalesCoachInsight, 
  generateVideoCaption, 
  generateBroadcastMessage,
  generateCustomerServiceReply,
  createCampaignChat
} from '../services/groqService';
import { formatCurrency, formatNumber } from '../utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  salesData: SalesRecord[];
  pricingItems: PricingItem[];
  selectedShops?: ShopID[];
  dateRange?: { start: string; end: string };
}

type AIMode = 'coach' | 'caption' | 'broadcast' | 'customer' | 'campaign';

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  salesData,
  pricingItems,
  selectedShops = [],
  dateRange,
}) => {
  const [mode, setMode] = useState<AIMode>('coach');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form states for different modes
  const [captionProduct, setCaptionProduct] = useState('');
  const [captionContext, setCaptionContext] = useState('');
  const [broadcastType, setBroadcastType] = useState('');
  const [broadcastShop, setBroadcastShop] = useState<ShopID>('shop1');
  const [broadcastProduct, setBroadcastProduct] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');
  const [customerContext, setCustomerContext] = useState('');
  const [csResponse, setCsResponse] = useState<{ optionA: string; optionB: string; optionC: string } | null>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setResponse('');
      setCsResponse(null);
    }
  }, [isOpen]);

  const handleSalesCoach = async () => {
    setIsLoading(true);
    setResponse('');
    
    try {
      const shops = selectedShops.length > 0 
        ? selectedShops.map(id => SHOPS.find(s => s.id === id)?.name || id)
        : SHOPS.map(s => s.name);
      
      const filteredData = salesData.filter(record => {
        const matchesShop = selectedShops.length === 0 || selectedShops.includes(record.shopId);
        const matchesDate = !dateRange || (
          record.date >= dateRange.start && record.date <= dateRange.end
        );
        return matchesShop && matchesDate;
      });

      const result = await getSalesCoachInsight(filteredData, {
        startDate: dateRange?.start || 'All time',
        endDate: dateRange?.end || 'Present',
        shopNames: shops,
      });
      
      setResponse(result || 'No insights available.');
    } catch (error) {
      setResponse('Unable to connect to AI. Please check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!captionProduct.trim()) return;
    setIsLoading(true);
    setResponse('');
    
    try {
      const result = await generateVideoCaption(captionProduct, captionContext);
      setResponse(result || 'Unable to generate caption.');
    } catch (error) {
      setResponse('Error generating caption.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBroadcast = async () => {
    if (!broadcastType.trim()) return;
    setIsLoading(true);
    setResponse('');
    
    try {
      const shopName = SHOPS.find(s => s.id === broadcastShop)?.name || broadcastShop;
      const result = await generateBroadcastMessage(broadcastType, shopName, broadcastProduct.trim() || undefined);
      setResponse(result || 'Unable to generate broadcast.');
    } catch (error) {
      setResponse('Error generating broadcast.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerService = async () => {
    if (!customerMessage.trim()) return;
    setIsLoading(true);
    setCsResponse(null);
    
    try {
      const result = await generateCustomerServiceReply(customerMessage, customerContext);
      const parsed = JSON.parse(result);
      setCsResponse(parsed);
    } catch (error) {
      setCsResponse({
        optionA: 'Error generating response.',
        optionB: 'Error generating response.',
        optionC: 'Error generating response.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignChat = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Initialize chat if not exists
      if (!chatRef.current) {
        chatRef.current = await createCampaignChat();
      }
      
      const result = await chatRef.current.sendMessage({ message: inputValue });
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: result.text || 'No response.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: 'Error connecting to AI. Please check your API key.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const modes: { id: AIMode; label: string; icon: React.ReactNode }[] = [
    { id: 'coach', label: 'Sales Coach', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: 'caption', label: 'Video Caption', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { id: 'broadcast', label: 'Chat Blast', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
    { id: 'customer', label: 'CS Reply', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'campaign', label: 'Campaign AI', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-shopee-orange rounded-xl text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white">AI Assistant</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Groq</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex gap-1 overflow-x-auto no-scrollbar">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setResponse('');
                setCsResponse(null);
                setMessages([]);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                mode === m.id
                  ? 'bg-shopee-orange text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Sales Coach Mode */}
          {mode === 'coach' && (
            <div>
              <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Analyze your sales performance and get actionable insights from AI.
              </div>
              <button
                onClick={handleSalesCoach}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-shopee-orange text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Get AI Insights
                  </>
                )}
              </button>
            </div>
          )}

          {/* Caption Mode */}
          {mode === 'caption' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={captionProduct}
                  onChange={(e) => setCaptionProduct(e.target.value)}
                  placeholder="e.g., Kaos Oversize Premium Cotton"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selling Points (Optional)</label>
                <textarea
                  value={captionContext}
                  onChange={(e) => setCaptionContext(e.target.value)}
                  placeholder="e.g., Bahan adem, anti kusut, ready size S-XXL"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none"
                />
              </div>
              <button
                onClick={handleGenerateCaption}
                disabled={isLoading || !captionProduct.trim()}
                className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : '🎬 Generate Caption'}
              </button>
            </div>
          )}

          {/* Broadcast Mode */}
          {mode === 'broadcast' && (
            <div className="space-y-4">
              {/* Shop Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shop *</label>
                <div className="flex gap-2">
                  {SHOPS.map(shop => (
                    <button
                      key={shop.id}
                      onClick={() => setBroadcastShop(shop.id)}
                      style={broadcastShop === shop.id ? { backgroundColor: shop.color, borderColor: shop.color } : {}}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border-2 transition-all ${
                        broadcastShop === shop.id
                          ? 'text-white'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {shop.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product to Promote (Optional)</label>
                <input
                  type="text"
                  value={broadcastProduct}
                  onChange={(e) => setBroadcastProduct(e.target.value)}
                  placeholder="e.g., Spidol Alis 4 Mata, Lip Matte, Zodiac Lip Gloss"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              {/* Broadcast Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Broadcast Type / Goal *</label>
                <input
                  type="text"
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  placeholder="e.g., Flash Sale, Pengingat Keranjang, New Arrival"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['Flash Sale', 'Pengingat Keranjang', 'Update Produk Terbaru', 'Broadcast Pengirim Khusus', 'Payday Sale'].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setBroadcastType(preset)}
                    className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateBroadcast}
                disabled={isLoading || !broadcastType.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : `📢 Generate Broadcast for ${SHOPS.find(s => s.id === broadcastShop)?.name}`}
              </button>
            </div>
          )}

          {/* Customer Service Mode */}
          {mode === 'customer' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Message *</label>
                <textarea
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  placeholder="Paste the customer's message here..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Context (Optional)</label>
                <input
                  type="text"
                  value={customerContext}
                  onChange={(e) => setCustomerContext(e.target.value)}
                  placeholder="e.g., Late delivery, Wrong item, Refund request"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
              <button
                onClick={handleCustomerService}
                disabled={isLoading || !customerMessage.trim()}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : '💬 Generate Reply Options'}
              </button>
              
              {/* CS Response Options */}
              {csResponse && (
                <div className="space-y-3 mt-4">
                  {['optionA', 'optionB', 'optionC'].map((key, idx) => (
                    <div key={key} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {idx === 0 ? '😊 Empathetic' : idx === 1 ? '📋 Professional' : '🤗 Friendly'}
                        </span>
                        <button
                          onClick={() => copyToClipboard(csResponse[key as keyof typeof csResponse])}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {csResponse[key as keyof typeof csResponse]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Campaign Chat Mode */}
          {mode === 'campaign' && (
            <div className="flex flex-col h-full min-h-[300px]">
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-sm">Start chatting to brainstorm campaigns!</p>
                    <p className="text-xs mt-1">Try: "Bikinkan campaign untuk promo gajian"</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-shopee-orange text-white rounded-br-sm'
                        : msg.role === 'system'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-sm'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCampaignChat()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-full bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
                <button
                  onClick={handleCampaignChat}
                  disabled={isLoading || !inputValue.trim()}
                  className="p-2 bg-shopee-orange text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Response Display */}
          {response && mode !== 'campaign' && mode !== 'customer' && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">AI Response</span>
                <button
                  onClick={() => copyToClipboard(response)}
                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
