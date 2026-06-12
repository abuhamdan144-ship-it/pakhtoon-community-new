import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Search, MessageSquare, Bot, User, RefreshCw, ChevronRight } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; url: string }[];
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "As-salamu alaykum! I am the Oman Pakhtoon Community Welfare Assistant. I can assist you with understanding membership rules, welfare claims, Dead Body repatriation guidelines, consular emergency resources, and live Omani visa policies. How can I assist you today?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    if (!textToSend) {
      setInputMessage('');
    }

    const newUserMessage: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // Map message history to the format expected by the Gemini API contents rules
      const historyPayload = [...messages, newUserMessage].map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const modelToUse = useThinking ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash';
      // System instructions ensuring standard humble representation
      const systemInstruction = `You are the Oman Pakhtoon Community (OPC) AI Assistant. 
      You communicate in a polite, helpful, and culturally respectful tone (respecting Pakhtoon traditions and Omani laws).
      You assist Pakhtoon community members in Sultanate of Oman (Muscat, Salalah, Sohar, Nizwa, etc.) with questions about:
      1. Dead body repatriation procedures (Muscat to Pakistan)
      2. Medical assistance reports and welfare fund claims
      3. Pakistan Embassy Muscat coordinates (hours: Sun-Thu 8am-4pm, Tel: +968 24603410, Emergency: +968 99222870)
      4. General OPC community operations and registrations.
      If the user enables search grounding, you have live search data. Use it to cross-ref current flights or visa terms.
      Always state facts humbly and clearly. Do not invent details outside of available context or search results.`;

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: historyPayload,
          model: modelToUse,
          systemInstruction,
          thinkingLevel: useThinking ? 'HIGH' : undefined,
          useSearch: useSearch,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server responded with an error');
      }

      const data = await response.json();
      
      const newAssistantMessage: ChatMessage = {
        role: 'model',
        text: data.text || 'I apologize, I could not synthesize a proper answer.',
        sources: data.metadata?.searchGroundingSources || []
      };

      setMessages(prev => [...prev, newAssistantMessage]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: `Error connecting to Assistant: ${error.message || 'Please check that process.env.GEMINI_API_KEY is configured in Settings > Secrets.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Requirements for dead body repatriation to Peshawar?",
    "Consulate hours and emergency helpline numbers?",
    "How does the OPC welfare committee approve members?",
    "What assistance is offered for site accidents or injuries?"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4 py-6">
      
      {/* Search & Intelligence Settings sidebar */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-left space-y-5 h-fit">
        <div className="border-b pb-3">
          <span className="text-emerald-950 font-bold font-serif text-sm block">Intelligence Panel</span>
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider mt-0.5">Gemini 3 Configuration</span>
        </div>

        {/* Use Thinking High reasoning controller */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="text-amber-500 w-3.5 h-3.5" /> High Reasoning
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={useThinking} 
                onChange={(e) => setUseThinking(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-800"></div>
            </label>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal leading-relaxed">
            Uses <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px]">gemini-3.1-pro-preview</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px]">ThinkingLevel.HIGH</code> to dissect complex, multi-variable legal visa queries or emergency processes.
          </p>
        </div>

        {/* Use Search Grounding controller */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Search className="text-blue-500 w-3.5 h-3.5" /> Google Search
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={useSearch} 
                onChange={(e) => setUseSearch(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-800"></div>
            </label>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed leading-normal">
            Enables active Grounding to fetch live, verified search results regarding Pakistan Flight schedules, Oman visa regulations, or Embassy announcements.
          </p>
        </div>

        {/* Clear thread history helper */}
        <div className="pt-2 border-t border-slate-100">
          <button 
            onClick={() => setMessages([
              {
                role: 'model',
                text: "Conversation thread history has been reset. How can I assist you with Oman Pakhtoon support?"
              }
            ])}
            className="w-full inline-flex justify-center items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-[11px] font-bold transition cursor-pointer"
          >
            <RefreshCw size={11} /> Reset Chat History
          </button>
        </div>
      </div>

      {/* Main chat log window */}
      <div className="lg:col-span-3 flex flex-col h-[520px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        
        {/* Chat Title bar */}
        <div className="bg-slate-50 border-b px-4 py-3 flex items-center gap-2.5 text-left">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Bot size={18} />
          </div>
          <div>
            <span className="font-serif font-bold text-sm text-emerald-950 block">OPC Welfare Assistant</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Multilingual Support (English, Pashto, Urdu)
            </span>
          </div>
        </div>

        {/* Messages list scroll area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/25 border-b">
          {messages.map((msg, index) => {
            const isModel = msg.role === 'model';
            return (
              <div 
                key={index} 
                className={`flex gap-2.5 max-w-[85%] text-left ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isModel ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-emerald-950'
                }`}>
                  {isModel ? <Bot size={13} /> : <User size={13} />}
                </div>
                
                <div className="space-y-1">
                  <div className={`p-3.5 rounded-xl text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                    isModel 
                      ? 'bg-white border border-slate-150 text-slate-800 rounded-tl-none' 
                      : 'bg-emerald-900 text-amber-50 rounded-tr-none'
                  }`}>
                    {msg.text}

                    {/* Sources section if grounding is enabled */}
                    {isModel && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">Search Grounding References:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <a 
                              key={sIdx} 
                              href={src.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-0.5 bg-slate-100 hover:bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded text-[9px] border hover:border-emerald-600/30 transition max-w-[200px] truncate"
                            >
                              <Search size={8} /> {src.title || src.url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Thinking status loading state indicator */}
          {loading && (
            <div className="flex gap-2.5 mr-auto max-w-[80%] text-left">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center animate-spin">
                <Bot size={13} />
              </div>
              <div className="p-3 bg-white border rounded-xl rounded-tl-none flex items-center gap-2 text-xs font-semibold text-slate-500 shadow-sm">
                <span>{useThinking ? 'Thinking & reasoning...' : 'Consulting database...'}</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input prompt sandbox or list of suggestions if input is empty */}
        {messages.length === 1 && (
          <div className="px-4 py-3 bg-slate-50 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Suggested Prompt Starters:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="p-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-900/30 rounded text-slate-700 transition flex justify-between items-center cursor-pointer font-medium"
                >
                  <span className="truncate">{p}</span>
                  <ChevronRight size={12} className="text-emerald-800 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Send message text form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white flex gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            placeholder={useSearch ? "Ask live visa rules or airline queries with Search..." : "Type a help message for the OPC representative assistant..."}
            className="flex-1 px-3.5 py-2 border rounded-lg text-xs focus:outline-emerald-800 bg-slate-50/50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="bg-emerald-900 hover:bg-emerald-950 text-white p-2.5 rounded-lg transition shrink-0 shadow cursor-pointer disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </form>

      </div>

    </div>
  );
}
