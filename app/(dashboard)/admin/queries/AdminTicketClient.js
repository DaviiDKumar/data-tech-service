"use client";
import { useState, useTransition } from "react";
import { passero } from "@/lib/fonts";
import AdminChatInterface from "@/components/AdminChatInterface";
import { updateTicketStatus } from "@/app/actions/queries"; // Assume this action exists
import { 
  User as UserIcon, MessageSquare, ExternalLink, 
  X, CheckCircle, MoreVertical, Search 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminTicketClient({ initialQueries, initialSelectedId }) {
  const [queries, setQueries] = useState(initialQueries);
  const [activeTicket, setActiveTicket] = useState(
    initialQueries.find(q => q._id === initialSelectedId) || null
  );
  const [isPending, startTransition] = useTransition();

  // FUNCTION: Close/Resolve Ticket
  const handleResolve = async (ticketId) => {
    startTransition(async () => {
      const res = await updateTicketStatus(ticketId, "closed");
      if (res.success) {
        toast.success("Ticket marked as Resolved");
        setQueries(prev => prev.map(q => q._id === ticketId ? { ...q, status: 'closed' } : q));
        if (activeTicket?._id === ticketId) {
          setActiveTicket(prev => ({ ...prev, status: 'closed' }));
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 text-left font-sans">
      <div className="max-w-[1600px] mx-auto space-y-10">
        
        {/* Header with Search */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-2">
            <h2 className="text-[10px] font-black uppercase tracking-[4px] text-slate-300">Admin Node</h2>
            <h1 className={`${passero.className} text-4xl text-slate-900 uppercase`}>Support Hub</h1>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input placeholder="SEARCH USER OR ID..." className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 text-[10px] font-bold uppercase outline-none focus:border-violet-400 transition-all" />
            </div>
          </div>
        </div>

        {/* ─── TICKET GRID (Small Cards) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {queries.map((q) => (
            <div 
              key={q._id} 
              onClick={() => setActiveTicket(q)}
              className="bg-white rounded-lg border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-52 cursor-pointer relative overflow-hidden"
            >
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-violet-600 font-bold text-xl shadow-inner">
                      {q.user?.name?.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight">{q.user?.name || "David Kumar"}</h3>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[2px] mt-1 italic">ID: {q.user?.loginId || "DTS_NODE"}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase italic border ${
                    q.status === 'open' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {q.status}
                  </span>
                </div>

                <div className="space-y-2 text-left">
                   <p className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded inline-block uppercase tracking-widest">{q.category}</p>
                   <h2 className="text-sm font-black uppercase text-slate-700 leading-tight line-clamp-2">{q.subject}</h2>
                </div>
              </div>

            
            </div>
          ))}
        </div>
      </div>

      {/* ─── FULL SCREEN CHAT MODAL ─── */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-7xl h-full bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col relative">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-6">
                 <button onClick={() => setActiveTicket(null)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-red-500 hover:bg-red-50 transition-all">
                    <X size={20} />
                 </button>
                 <div className="text-left">
                    <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">{activeTicket.subject}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest italic">{activeTicket.user?.name}</span>
                      <div className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">ID: {activeTicket.user?.loginId}</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 {activeTicket.status === 'open' && (
                   <button 
                    onClick={() => handleResolve(activeTicket._id)}
                    disabled={isPending}
                    className="px-8 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                   >
                    <CheckCircle size={14} /> Resolve Ticket
                   </button>
                 )}
                 <Link 
                  href={`/admin/user/${activeTicket.user?._id}`}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-violet-600 transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
                 >
                    <UserIcon size={14} /> Profile Node
                 </Link>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden bg-slate-50/50">
               <AdminChatInterface query={activeTicket} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}