"use client";
import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle, Lock, ShieldCheck, User, Clock } from "lucide-react";
import { adminReply, updateTicketStatus } from "@/app/actions/queries";
import { toast } from "sonner";

export default function AdminChatInterface({ query }) {
  // Initializing state directly from props is safe because 'key' handles resets
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState(query.messages);
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef(null);
  const isClosed = query.status === "closed";

  // Still use an effect for scrolling, as that is a side-effect (DOM update)
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || isClosed || isSending) return;

    const msgText = input;
    setInput("");
    setIsSending(true);

    // Optimistic Update
    const optimisticMsg = {
      sender: "admin",
      text: msgText,
      timestamp: new Date().toISOString(),
    };
    
    setLocalMessages((prev) => [...prev, optimisticMsg]);

    try {
      await adminReply(query._id, msgText);
    } catch (error) {
      toast.error("Failed to sync response");
      // Optional: Remove the optimistic message on failure
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white text-left font-sans">
      {/* Dynamic Header */}
      <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
     
        
        {isClosed ? (
          <div className="flex items-center gap-2 px-5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-[9px] font-black text-slate-400 uppercase italic">
            <Lock size={12} /> Sync Finalized
          </div>
        ) : (
          <button 
            onClick={() => updateTicketStatus(query._id, "closed")}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <CheckCircle size={14} /> Resolve Ticket
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FBFBFC] custom-scrollbar">
        {localMessages.map((msg, i) => {
          const isAdmin = msg.sender === 'admin';
          return (
            <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className={`group max-w-[80%] md:max-w-[65%] space-y-2`}>
                <div className={`flex items-center gap-2 opacity-30 text-[8px] font-black uppercase tracking-widest ${isAdmin ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  {isAdmin ? <ShieldCheck size={10} className="text-violet-600"/> : <User size={10}/>}
                  {isAdmin ? 'Technician' : 'User Node'}
                </div>
                
                <div className={`p-5 rounded-3xl shadow-sm text-sm leading-relaxed transition-all ${
                  isAdmin 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>

                <div className={`flex items-center gap-1 opacity-20 text-[8px] font-bold ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <Clock size={8} />
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Action Console */}
      <div className="p-6 bg-white border-t border-slate-100">
        {!isClosed ? (
          <form onSubmit={handleSend} className="relative max-w-5xl mx-auto flex gap-3">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="TYPE YOUR RESPONSE..."
              className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold uppercase outline-none focus:border-slate-900 transition-all placeholder:text-slate-300 shadow-inner"
              disabled={isSending}
            />
            <button 
              type="submit" 
              disabled={isSending || !input.trim()}
              className="bg-slate-900 text-white p-4 px-6 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-30"
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div className="py-2 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic">
              Encrypted channel closed • No further input allowed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}