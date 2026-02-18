
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'გამარჯობა! მე ვარ Lumina AI. რით შემიძლია დაგეხმარო დღეს?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: "შენ ხარ მეგობრული AI ასისტენტი სახელად Lumina. უპასუხე მომხმარებლის კითხვებს ქართულად ან ინგლისურად, კონტექსტის შესაბამისად. იყავი თავაზიანი და კრეატიული.",
        }
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "ბოდიში, პასუხის მიღება ვერ მოხერხდა.",
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "მოხდა შეცდომა API-სთან დაკავშირებისას.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="px-8 py-6 border-b border-slate-800 flex justify-between items-center glass">
        <div>
          <h2 className="text-xl font-bold font-outfit">Lumina Chat</h2>
          <p className="text-sm text-slate-500">Gemini 3 Pro-ს მეშვეობით</p>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-blue-400" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800/50 border border-slate-700 rounded-tl-none text-slate-200'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <span className="text-[10px] mt-2 block opacity-50">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8">
        <div className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="დასვი კითხვა..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
