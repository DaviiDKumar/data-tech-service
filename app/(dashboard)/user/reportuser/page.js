"use client";

import { useMemo, useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { passero, robotoSlab } from "@/lib/fonts";
import { 
  Wallet, Target, Award, PieChart, 
  BarChart3, ShieldCheck, Clock, ArrowUpRight
} from "lucide-react";

export default function UserReportPage() {
  const { user } = useUserStore();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString());
    const frame = requestAnimationFrame(tick);
    const timer = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, []);

  const stats = useMemo(() => {
    const approved = user?.stats?.approvedCount || 0;
    const rejected = user?.stats?.rejectedCount || 0;
    const inProgress = user?.stats?.inProgressCount || 0;
    const totalSubmitted = approved + rejected;
    const accuracy = totalSubmitted > 0 ? Math.round((approved / totalSubmitted) * 100) : 0;

    const getTierData = (acc) => {
      if (acc < 50) return { label: "Learning", rate: 2, next: 50 };
      if (acc < 60) return { label: "Emerging", rate: 10, next: 60 };
      if (acc < 70) return { label: "Progressing", rate: 20, next: 70 };
      if (acc < 80) return { label: "Expectation", rate: 40, next: 80 };
      if (acc < 91) return { label: "Proficient", rate: 60, next: 91 };
      return { label: "Master", rate: 70, next: 100 };
    };

    return { approved, rejected, inProgress, totalSubmitted, accuracy, tier: getTierData(accuracy), earnings: approved * getTierData(accuracy).rate };
  }, [user?.stats]);

  return (
    <div className={`min-h-screen bg-[#E5E7EB] p-4 md:p-8 ${robotoSlab.className} text-[#1A1A1A] selection:bg-black selection:text-white`}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* --- SMART HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center  backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase leading-none">User Report</h1>
              <p className="text-[10px] opacity-40 font-bold tracking-[0.3em] mt-1">User / {user?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right bg-gray-100/50 px-5 py-2 rounded-2xl border border-gray-200">
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Last Updated</p>
            <p className="text-sm font-black tabular-nums">{currentTime || "00:00:00"}</p>
          </div>
        </header>

        {/* --- HIGH-IMPACT METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Net Earnings" value={`₹${stats.earnings}`} sub={`Rate: ₹${stats.tier.rate}/item`} icon={<Wallet size={16}/>} />
          <MetricCard label="Node Accuracy" value={`${stats.accuracy}%`} sub={`${stats.totalSubmitted} submissions`} invert />
          <MetricCard label="Current Tier" value={stats.tier.label} sub={`Next: ${stats.tier.next}% Accuracy`} icon={<Award size={16}/>} />
        </div>

        {/* --- PERFORMANCE DETAILS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Work breakdown Card */}
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
               <PieChart size={120} />
             </div>
             <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400 mb-8 flex items-center gap-2">
               Live Analytics
             </h3>
             <div className="space-y-6 relative z-10">
                <DataRow label="Approved" value={stats.approved} sub="Confirmed nodes" trend="+4.2%" />
                <DataRow label="Rejected" value={stats.rejected} sub="Accuracy failure" isRed />
                <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                  <DataRow label="In-Progress" value={stats.inProgress} sub="Active work sessions" isGray icon={<Clock size={12}/>} />
                </div>
                <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest ">Total </p>
                   <span className={`${passero.className} text-4xl`}>{stats.totalSubmitted}</span>
                </div>
             </div>
          </section>

          {/* Blueprint Card */}
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-300/20">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">Payout Blueprint</h3>
               <BarChart3 size={16} className="text-gray-300" />
             </div>
             <div className="space-y-1.5">
                <TierItem range="91-100%" label="Master" rate="₹70" active={stats.accuracy >= 91} />
                <TierItem range="80-90%" label="Proficient" rate="₹50-60" active={stats.accuracy >= 80 && stats.accuracy < 91} />
                <TierItem range="70-80%" label="Expected" rate="₹30-40" active={stats.accuracy >= 70 && stats.accuracy < 80} />
                <TierItem range="60-70%" label="Progressive" rate="₹15-20" active={stats.accuracy >= 60 && stats.accuracy < 70} />
                <TierItem range="< 50%" label="Learning" rate="₹2" active={stats.accuracy < 50 && stats.totalSubmitted > 0} />
             </div>
             <div className="mt-8 flex items-center gap-3 p-4 bg-black text-white rounded-2xl transition-transform hover:scale-[1.02] cursor-default">
               <ArrowUpRight size={16} className="text-gray-400" />
               <p className="text-[9px] font-bold uppercase tracking-widest">Accuracy threshold affects lifetime node ROI</p>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* --- UI COMPONENTS --- */

function MetricCard({ label, value, sub, icon, invert }) {
  return (
    <div className={`p-8 rounded-[2.5rem] h-44 flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group ${invert ? 'bg-black text-white' : 'bg-white text-black shadow-sm'}`}>
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">{label}</p>
        <div className="opacity-20 group-hover:opacity-100 transition-all transform group-hover:scale-110">
          {icon || <Target size={16}/>}
        </div>
      </div>
      <div>
        <h2 className={`${passero.className} text-5xl leading-none tracking-tighter`}>{value}</h2>
        <p className="text-[10px] font-bold opacity-30 group-hover:opacity-100 mt-3 uppercase tracking-widest ">{sub}</p>
      </div>
    </div>
  );
}

function DataRow({ label, value, sub, isRed, isGray, icon, trend }) {
  return (
    <div className="flex justify-between items-center">
       <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-black uppercase tracking-tight">{label}</p>
            {trend && <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">{trend}</span>}
            {icon && <span className="text-gray-400 animate-pulse">{icon}</span>}
          </div>
          <p className="text-[9px] opacity-30 uppercase font-bold tracking-tighter">{sub}</p>
       </div>
       <span className={`${passero.className} text-3xl ${isRed ? 'text-red-500' : isGray ? 'text-gray-400' : 'text-black'}`}>
         {value}
       </span>
    </div>
  );
}

function TierItem({ range, label, rate, active }) {
  return (
    <div className={`flex justify-between items-center px-5 py-2.5 rounded-2xl transition-all border ${active ? 'bg-black text-white border-black shadow-xl translate-x-2' : 'bg-white text-gray-400 border-gray-50'}`}>
      <span className="text-[9px] font-black w-14 tabular-nums">{range}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center flex-1 ">{label}</span>
      <span className={`${passero.className} text-lg w-12 text-right`}>{rate}</span>
    </div>
  );
}