
import React, { useState, useEffect, useRef } from 'react';
import { createCampaignChat } from '../services/groqService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, Send, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// Improved Markdown Parser helpers
const parseBold = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, index) => 
        index % 2 === 1 ? <strong key={index} className="font-bold text-slate-900 dark:text-white">{part}</strong> : part
      )}
    </>
  );
};

const renderMessageText = (text: string) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Headers (### or ## or #)
        if (trimmed.startsWith('#')) {
            const level = trimmed.match(/^#+/)?.[0].length || 0;
            const content = trimmed.replace(/^#+\s*/, '');
            // Sizes: h1=2xl, h2=xl, h3=lg
            const sizeClass = level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base';
            return (
                <h3 key={i} className={`${sizeClass} font-bold text-slate-900 dark:text-white mt-3 mb-1`}>
                    {parseBold(content)}
                </h3>
            );
        }

        // List Items (Bullets)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const content = trimmed.replace(/^[-*•]\s*/, '');
            return (
                <div key={i} className="ml-4 flex items-start gap-2 my-1">
                    <span className="mt-2 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>
                    <span>{parseBold(content)}</span>
                </div>
            );
        }

        // Numbered Lists
        if (/^\d+\.\s/.test(trimmed)) {
            const number = trimmed.match(/^\d+\./)?.[0];
            const content = trimmed.replace(/^\d+\.\s*/, '');
            return (
                <div key={i} className="ml-4 flex items-start gap-2 my-1">
                    <span className="font-bold text-slate-500 dark:text-slate-400 min-w-[1.5rem]">{number}</span>
                    <span>{parseBold(content)}</span>
                </div>
            );
        }

        // Regular Text
        return <p key={i} className="leading-relaxed mb-1">{parseBold(line)}</p>;
      })}
    </div>
  );
};

export const CampaignGeneratorView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'intro', 
      role: 'model', 
      text: "👋 Hi! I'm your AI Campaign Strategist. I can help you plan your next big sale on Shopee. \n\nTell me what you want to achieve (e.g., **'Clear old stock'**, **'Launch new serum'**) or ask for a **'Payday Sale idea'**!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const chat = createCampaignChat();
      setChatSession(chat);
    } catch (e) {
      console.error("Failed to init chat", e);
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "⚠️ Error: API Key missing. Please check configuration." }]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatSession) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for Groq
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text
      }));

      const aiText = await chatSession.sendMessage(text, conversationHistory);
      
      if (aiText) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: aiText }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: "⚠️ Sorry, I had trouble thinking of that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in gap-4 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-600 border-none text-white shadow-lg flex-shrink-0 relative overflow-hidden p-6">
         <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2 font-display">
               <Sparkles size={24} className="text-yellow-300" /> Campaign Idea Generator
            </h2>
            <p className="text-orange-100 text-sm opacity-90 max-w-2xl">
               Stuck on ideas? Ask me to generate a campaign concept, plan a product launch, or strategy to clear inventory. I'll help you structure it for Shopee.
            </p>
         </div>
         <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 overflow-hidden flex flex-col relative p-0 border-slate-100 dark:border-slate-700">
         
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
               <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-shopee-orange text-white rounded-br-none' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                     {msg.role === 'model' ? renderMessageText(msg.text) : parseBold(msg.text as any)}
                  </div>
               </div>
            ))}
            {loading && (
               <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl rounded-bl-none flex gap-2 items-center">
                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* Quick Prompts & Input */}
         <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
            {messages.length < 3 && (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
                    {["💰 Plan Payday Sale", "🚀 New Product Launch", "📦 Clear Old Stock", "🗓️ Twin Date Strategy"].map(p => (
                        <Button 
                            key={p} 
                            onClick={() => handleQuickPrompt(p)}
                            variant="outline"
                            size="sm"
                            className="whitespace-nowrap rounded-full text-xs font-bold hover:bg-orange-50 hover:border-orange-200 dark:hover:border-slate-500 shadow-sm"
                        >
                            {p}
                        </Button>
                    ))}
                </div>
            )}
            
            <div className="flex gap-2">
               <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                  placeholder="Describe your goal (e.g. I want to sell 100 bundles of lipstick...)"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-shopee-orange focus:border-transparent outline-none text-slate-800 dark:text-white transition-all shadow-sm"
                  disabled={loading}
               />
               <Button 
                  onClick={() => handleSendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="h-auto w-12 rounded-xl"
                  isLoading={loading}
               >
                  {!loading && <Send size={20} />}
               </Button>
            </div>
         </div>

      </Card>
    </div>
  );
};
