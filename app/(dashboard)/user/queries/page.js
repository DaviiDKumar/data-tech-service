import connectDB from "@/lib/db";
import Query from "@/models/Queries";
import { cookies } from "next/headers";
import { passero, robotoSlab } from "@/lib/fonts";
import ChatInterface from "@/components/ChatInterface";
import { createTicket } from "@/app/actions/queries";
import { Plus, MessageSquare, ShieldCheck, CreditCard, ChevronDown, UserCircle, Briefcase, Info } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

export default async function QueriesPage({ searchParams }) {
  await connectDB();
  const userId = (await cookies()).get('userId')?.value;

  // Fetch tickets for David Kumar
  const userQueries = await Query.find({ user: userId }).sort({ updatedAt: -1 }).lean();

  const user = useUserStore.getState().user; // Access user from Zustand store
  const params = await searchParams;
  const selectedId = params.id;
  const isCreating = params.new === 'true';
  const activeQuery = userQueries.find(q => q._id.toString() === selectedId);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#F8FAFC] text-left font-sans">

      {/* ─── SIDEBAR: TICKET REPOSITORY ─── */}
      <div className="w-96 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex flex-col text-left">
            <h2 className={`${passero.className} text-[11px] tracking-[4px] uppercase text-slate-400`}>Support Node</h2>
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Active Syncs</span>
          </div>
          <a href="?new=true" className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 active:scale-95">
            <Plus size={18} />
          </a>
        </div>

        <div className="flex-1 overflow-y-auto">
          {userQueries.map(q => {
            const isActive = selectedId === q._id.toString();
            return (
              <a href={`?id=${q._id}`} key={q._id.toString()} className="block group">
                <div className={`p-6 border-b border-slate-50 transition-all relative ${isActive ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-violet-600" />}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">#{q._id.toString().slice(-6)}</span>
                    <StatusBadge status={q.status} />
                  </div>
                  <h3 className={`text-xs font-bold uppercase truncate mb-3 ${isActive ? 'text-violet-600' : 'text-slate-700'}`}>
                    {q.subject}
                  </h3>
                  <CategoryTag category={q.category} />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN: COMMUNICATION CONSOLE ─── */}
      <div className="flex-1 flex flex-col bg-[#F8FAFC]">
        {isCreating ? (
          <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
            <form action={createTicket} className="w-full max-w-2xl bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">

              <div className="bg-slate-900 p-10 text-white text-left">
                <h2 className={`${passero.className} text-xl uppercase tracking-[0.3em]`}>Initialize Support Sync</h2>
                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Connection: {user?.loginId || "DTS Node"}</p>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                  {/* CLEAN DROPDOWN (Fixed overlapping from image_e882a3.png) */}
                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Category</label>
                    <div className="relative group">
                      <select
                        name="category"
                        required
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold uppercase outline-none focus:border-violet-600 focus:bg-white transition-all appearance-none cursor-pointer pr-12"
                      >
                        <option value="General">General Inquiry</option>
                        <option value="Login">Login / Access Issue</option>
                        <option value="Payment">Payment & Settlement</option>
                        <option value="Work">Work / Project Related</option>
                        <option value="KYC">Identity Verification</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
                        <ChevronDown size={18} strokeWidth={3} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Header</label>
                    <input
                      name="subject"
                      placeholder="SHORT TITLE..."
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold uppercase outline-none focus:border-violet-600 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Message</label>
                  <textarea
                    name="message"
                    placeholder="DESCRIBE YOUR PROBLEM CLEARLY..."
                    rows="6"
                    className="w-full bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 outline-none text-[11px] font-bold uppercase focus:border-violet-600 focus:bg-white transition-all leading-loose resize-none shadow-inner"
                    required
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <a href="/user/queries" className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-red-500 transition-all">Discard Ticket</a>
                  <button
                    type="submit"
                    className="px-14 py-4 bg-violet-600 text-white rounded-2xl font-bold text-[10px] tracking-[0.2em] hover:bg-violet-700 transition-all shadow-xl shadow-violet-100 uppercase active:scale-95"
                  >
                    Open Ticket
                  </button>
                </div>
              </div>
            </form>
          </div>


        ) : activeQuery ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
            <ChatInterface
              key={activeQuery._id.toString()} // FIX: Resets internal state and prevents layout jumps
              query={JSON.parse(JSON.stringify(activeQuery))}
            />
          </div>
        ) : (
          // ...

          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-8">
            <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
              <MessageSquare size={48} className="text-slate-100" />
            </div>
            <div className="space-y-4">
              <h3 className={`${passero.className} text-2xl text-slate-400 uppercase tracking-[0.4em]`}>Node Support</h3>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300 max-w-sm leading-loose">
                Select an active thread or initialize a new support sync to connect with technicians.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HELPER UI COMPONENTS ───

function StatusBadge({ status }) {
  const isOpen = status === 'open';
  return (
    <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter italic border ${isOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
      }`}>
      {status}
    </span>
  );
}

function CategoryTag({ category }) {
  const icons = {
    KYC: <ShieldCheck size={11} />,
    Payment: <CreditCard size={11} />,
    Login: <UserCircle size={11} />,
    Work: <Briefcase size={11} />,
    General: <Info size={11} />,
  };
  return (
    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
      <span className="text-violet-500">{icons[category] || icons.General}</span>
      {category}
    </div>
  );
}