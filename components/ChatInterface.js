"use client";
import { useState, useEffect, useRef } from "react";
import { Send, User, ShieldCheck } from "lucide-react";
import { sendMessage } from "@/app/actions/queries";

export default function ChatInterface({ query }) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  // Initialize state directly from props. 
  // Because we added a 'key' in the parent, this resets automatically.
  const [localMessages, setLocalMessages] = useState(query.messages);
  
  const scrollContainerRef = useRef(null);

  // INTERNAL SCROLL ONLY: 
  // Using scrollTo on the container avoids moving the whole browser window.
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [localMessages]);

  async function handleAction(e) {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const currentInput = input;
    setInput("");
    setIsSending(true);

    // Optimistic Update
    const optimisticMsg = {
      sender: 'user',
      text: currentInput,
      timestamp: new Date().toISOString()
    };
    setLocalMessages(prev => [...prev, optimisticMsg]);

    try {
      await sendMessage(query._id, currentInput);
    } catch (err) {
      console.error("Sync failed");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden border-l border-slate-100">
      
      {/* ─── SCROLLABLE AREA (Fixed internal height) ─── */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FBFBFC]"
      >
        {localMessages.map((msg, i) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-3xl shadow-sm ${
                isUser 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                <div className={`flex items-center gap-2 mb-2 opacity-40 text-[8px] font-black uppercase tracking-[0.2em] ${isUser ? 'flex-row-reverse text-right' : ''}`}>
                  {msg.sender === 'admin' ? <ShieldCheck size={10}/> : <User size={10}/>}
                  {msg.sender === 'admin' ? 'Support Technician' : 'My Node'}
                </div>
                
                <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                
                <p suppressHydrationWarning className="text-[8px] mt-3 opacity-30 text-right font-bold italic">
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true 
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── INPUT CONSOLE ─── */}
      <div className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleAction} className="max-w-5xl mx-auto flex gap-3">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="TYPE MESSAGE..."
            disabled={isSending}
            className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-xs font-bold uppercase outline-none focus:border-slate-900 focus:bg-white transition-all shadow-inner"
          />
          <button 
            type="submit" 
            disabled={isSending || !input.trim()}
            className="bg-slate-900 text-white p-4 px-6 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-20"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}