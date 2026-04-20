"use client";
import { useEffect, useTransition } from "react";
import { useUserStore } from "@/store/useUserStore";
import { getKycRecord } from "@/app/actions/kyc";
import { 
  Zap, ShieldCheck, Landmark, TrendingUp, 
  Clock, CheckCircle2, AlertCircle, ArrowUpRight,
  Wallet, Activity, CheckCircle, Mail, User as UserIcon
} from "lucide-react";

export default function UserDashboard() {
  const { user, updateUser } = useUserStore();
  const [isPending, startTransition] = useTransition();

  // 🔄 BACKGROUND SYNC (Silent)
  useEffect(() => {
    async function syncData() {
      if (user?.id) {
        const res = await getKycRecord(user.id);
        if (res.success && res.data) {
          // Syncing state with server data
          updateUser({
            kycStatus: res.data.kycStatus,
            bankDetailsStatus: res.data.bankDetailsStatus,
            stats: res.data.stats,
          });
        }
      }
    }
    startTransition(() => {
      syncData();
    });
  }, [user?.id]);

  // 🔍 DEBUG LOG
  useEffect(() => {
    if (user) console.log("✅ Current User State:", user);
  }, [user]);

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'verified') return { border: 'border-emerald-500/20', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle2 size={14}/> };
    if (s === 'rejected') return { border: 'border-rose-500/20', bg: 'bg-rose-50', text: 'text-rose-600', icon: <AlertCircle size={14}/> };
    return { border: 'border-orange-500/20', bg: 'bg-orange-50', text: 'text-orange-600', icon: <Clock size={14}/> };
  };

  const kycUI = getStatusStyle(user?.kycStatus);
  const bankUI = getStatusStyle(user?.bankDetailsStatus);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 p-4 lg:p-0 animate-in fade-in duration-1000">
      
      {/* --- PREMIUM HEADER --- */}
      <div className="bg-slate-900 rounded-[3rem] p-8 lg:p-12 flex flex-col lg:flex-row justify-between items-center shadow-2xl relative overflow-hidden border-b-[8px] border-blue-600">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] -z-0" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 text-center lg:text-left">
          <div className="w-28 h-28 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-5xl font-black italic text-white shadow-2xl rotate-3 border-4 border-white/10">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
              Hello, <span className="text-blue-500">{user?.name}</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center justify-center lg:justify-start gap-2">
              <Zap size={14} className="text-blue-500 fill-blue-500" /> DTS Node: {user?.role || 'User'}
            </p>
          </div>
        </div>

        <div className="mt-10 lg:mt-0 flex flex-wrap justify-center gap-4 relative z-10">
          <div className={`px-6 py-4 rounded-3xl border-2 ${kycUI.border} ${kycUI.bg} flex items-center gap-3 shadow-xl backdrop-blur-md`}>
             <span className={kycUI.text}>{kycUI.icon}</span>
             <span className={`text-[11px] font-black uppercase tracking-widest ${kycUI.text}`}>KYC {user?.kycStatus || 'Pending'}</span>
          </div>
          <div className={`px-6 py-4 rounded-3xl border-2 ${bankUI.border} ${bankUI.bg} flex items-center gap-3 shadow-xl backdrop-blur-md`}>
             <span className={bankUI.text}>{bankUI.icon}</span>
             <span className={`text-[11px] font-black uppercase tracking-widest ${bankUI.text}`}>Bank {user?.bankDetailsStatus || 'Pending'}</span>
          </div>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Live Tasks', val: user?.stats?.inProgressCount || 0, icon: <Activity size={22}/>, color: 'blue' },
          { label: 'Earnings Approved', val: user?.stats?.approvedCount || 0, icon: <CheckCircle size={22}/>, color: 'emerald' },
          { label: 'Pending Review', val: user?.stats?.pendingCount || 0, icon: <Clock size={22}/>, color: 'orange' },
          { label: 'Rejected', val: user?.stats?.rejectedCount || 0, icon: <AlertCircle size={22}/>, color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border-2 border-slate-50 p-10 rounded-[3.5rem] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-all duration-700" />
             <div className="p-4 rounded-2xl inline-block mb-6 bg-slate-900 text-white shadow-2xl relative z-10 group-hover:bg-blue-600 transition-colors">
                {stat.icon}
             </div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest relative z-10">{stat.label}</p>
             <h3 className="text-5xl font-black text-slate-900 italic mt-2 relative z-10 tracking-tighter italic">
                {isPending ? "..." : stat.val}
             </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white border-2 border-slate-50 rounded-[4rem] p-12 shadow-sm space-y-8">
            <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
               <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] shadow-inner"><UserIcon size={28}/></div>
               <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Account</h2>
            </div>
            <div className="space-y-6">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registered Email</p>
                  <p className="text-sm font-black text-slate-800 break-all italic">{user?.email}</p>
               </div>
               <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Security Node</p>
                     <ShieldCheck size={20} className="text-emerald-500"/>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase italic">Verification assets are encrypted and locked for payout processing.</p>
               </div>
            </div>
        </div>

        {/* Velocity Card */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-50 rounded-[4rem] p-12 shadow-sm flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Task Velocity</h2>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2 italic underline decoration-blue-500 decoration-2 underline-offset-4">Real-time Node Throughput</p>
                </div>
                <div className="px-5 py-2.5 bg-emerald-50 rounded-2xl text-emerald-600 text-[11px] font-black tracking-widest uppercase">SYNC ACTIVE</div>
            </div>
            <div className="flex items-end justify-between h-48 gap-5 px-4 border-b-4 border-slate-50 pb-4">
                {[55, 35, 85, 60, 100, 75, 90].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-slate-100 rounded-[1.2rem] hover:bg-blue-600 transition-all cursor-pointer shadow-inner" />
                ))}
            </div>
            <div className="flex justify-between mt-8 px-6">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                    <span key={day} className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{day}</span>
                ))}
            </div>
        </div>
      </div>

    </div>
  );
}