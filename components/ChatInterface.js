"use client";
import { useState, useEffect, useRef } from "react";
import { Send, User, ShieldCheck } from "lucide-react";
import { sendMessage } from "@/app/actions/queries";

export default function ChatInterface({ query }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [query.messages]);

  async function handleAction(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const currentInput = input;
    setInput("");
    await sendMessage(query._id, currentInput);
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {query.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              msg.sender === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white border border-slate-200 text-black rounded-tl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-50 text-[9px] uppercase font-bold">
                {msg.sender === 'admin' ? <ShieldCheck size={10}/> : <User size={10}/>}
                {msg.sender}
              </div>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <p className="text-[8px] mt-2 opacity-40 text-right">
            
{new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleAction} className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input 
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="TYPE MESSAGE..."
            className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-black uppercase font-medium"
          />
          <button type="submit" className="bg-black text-white p-3 rounded-xl hover:scale-105 transition-all">
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}