"use client";
import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle, Lock, ShieldCheck, User } from "lucide-react";
import { adminReply, closeTicket } from "@/app/actions/queries";

export default function AdminChatInterface({ query }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const isClosed = query.status === "closed";

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [query.messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || isClosed) return;
    const msg = input;
    setInput("");
    await adminReply(query._id, msg);
  }

  return (
    <div className="flex-1 flex flex-col bg-white border-r border-slate-200">
      {/* Header with Resolve Button */}
      <div className="h-16 border-b px-6 flex justify-between items-center bg-slate-50/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
           <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
             {query.category}
           </span>
           <h3 className="text-xs font-bold uppercase tracking-tight text-black">{query.subject}</h3>
        </div>
        
        {!isClosed ? (
          <button 
            onClick={() => closeTicket(query._id)}
            className="flex items-center gap-2 text-[10px] font-bold text-green-600 border border-green-200 px-4 py-2 rounded-xl hover:bg-green-600 hover:text-white transition-all duration-300"
          >
            <CheckCircle size={14} /> RESOLVE TICKET
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
            <Lock size={12} /> TICKET CLOSED
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {query.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
              msg.sender === 'admin' 
              ? 'bg-zinc-900 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-black rounded-tl-none'
            }`}>
               <div className="flex items-center gap-1.5 mb-2 opacity-40 text-[8px] uppercase font-black tracking-widest">
                {msg.sender === 'admin' ? <ShieldCheck size={10}/> : <User size={10}/>}
                {msg.sender}
              </div>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <p suppressHydrationWarning className="text-[8px] mt-2 opacity-40 text-right">
                {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area (Disabled if Closed) */}
      <div className="p-4 bg-white border-t border-slate-200">
        {!isClosed ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="TYPE YOUR RESPONSE..."
              className="flex-1 bg-slate-100 rounded-2xl px-5 py-4 text-xs outline-none focus:ring-1 focus:ring-black uppercase font-medium"
            />
            <button type="submit" className="bg-black text-white p-4 rounded-2xl hover:bg-zinc-800 transition-all">
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div className="py-4 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[4px]">
              Conversation finalized. No further replies allowed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}