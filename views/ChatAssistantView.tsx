import React, { useState } from 'react';
import { generateCustomerServiceReply } from '../services/groqService';

export const ChatAssistantView: React.FC = () => {
  const [customerMessage, setCustomerMessage] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<{ optionA: string; optionB: string; optionC: string } | null>(null);

  const handleGenerate = async () => {
    if (!customerMessage.trim()) return;
    setLoading(true);
    setResponses(null);
    try {
      const result = await generateCustomerServiceReply(customerMessage, additionalContext);
      const parsed = JSON.parse(result);
      setResponses(parsed);
    } catch (e) {
      alert("Failed to generate response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Visual feedback could be added here
  };

  // Quick preset scenarios to populate input
  const fillPreset = (msg: string) => {
    setCustomerMessage(msg);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Smart Chat Assistant</h2>
          <p className="text-blue-100 max-w-xl">
            Don't sound like a robot. Paste your customer's message below to generate 
            human-like, empathetic, and policy-compliant responses instantly.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-1 rounded">1</span>
              Customer's Message
            </h3>
            
            <textarea
              className="w-full h-32 p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none mb-4 text-sm"
              placeholder="Paste the angry complaint or question here..."
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
            />

            <div className="mb-4">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Quick Presets</label>
               <div className="flex flex-wrap gap-2">
                 <button onClick={() => fillPreset("Barang saya kok belum sampai?? Padahal sudah 5 hari!")} className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full transition-colors border border-slate-200 dark:border-slate-600">
                    Late Shipping
                 </button>
                 <button onClick={() => fillPreset("Kak barangnya rusak pecah pas dibuka! Gimana ini??")} className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full transition-colors border border-slate-200 dark:border-slate-600">
                    Damaged Item
                 </button>
                 <button onClick={() => fillPreset("Cara pakainya gimana ya kak? Aman buat bumil?")} className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full transition-colors border border-slate-200 dark:border-slate-600">
                    Product Usage
                 </button>
               </div>
            </div>

            <div className="mb-4">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Your Context (Optional)</label>
               <input 
                  type="text" 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                  placeholder="e.g. Stock is empty, or Courier is overloaded"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
               />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !customerMessage}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Thinking like a Human...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Generate Replies
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-1 rounded">2</span>
              Choose Your Response
            </h3>

            {!responses && !loading && (
                <div className="h-64 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 text-center p-6">
                    <p>Enter a customer message on the left to generate human-friendly responses.</p>
                </div>
            )}

            {loading && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
            )}

            {responses && (
                <div className="space-y-4">
                    {/* Option A */}
                    <div className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-all relative">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded uppercase">Empathetic (For Complaints)</span>
                             <button onClick={() => copyToClipboard(responses.optionA)} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Copy
                             </button>
                         </div>
                         <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{responses.optionA}</p>
                    </div>

                    {/* Option B */}
                    <div className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-all relative">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded uppercase">Professional (Standard SOP)</span>
                             <button onClick={() => copyToClipboard(responses.optionB)} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Copy
                             </button>
                         </div>
                         <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{responses.optionB}</p>
                    </div>

                    {/* Option C */}
                    <div className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-all relative">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded uppercase">Friendly (Casual)</span>
                             <button onClick={() => copyToClipboard(responses.optionC)} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Copy
                             </button>
                         </div>
                         <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{responses.optionC}</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
