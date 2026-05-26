"use client";

import { useMemo, useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { passero, robotoSlab } from "@/lib/fonts";
import { Wallet, Target, Award, Clock, ShieldCheck } from "lucide-react";

export default function UserReportPage() {
  const { user } = useUserStore();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const approved = user?.stats?.approvedCount || 0;
    const rejected = user?.stats?.rejectedCount || 0;
    const inProgress = user?.stats?.inProgressCount || 0;
    const totalSubmitted = approved + rejected;
    const accuracy = totalSubmitted > 0 ? Math.round((approved / totalSubmitted) * 100) : 0;

    // Exact match logic tracking back against your 10 custom steps
    const getTierData = (acc) => {
      if (acc < 50) return { label: "Learning", rate: 2, next: 50 };
      if (acc >= 50 && acc < 55) return { label: "Emerging", rate: 5, next: 55 };
      if (acc >= 55 && acc < 60) return { label: "Emerging", rate: 10, next: 60 };
      if (acc >= 60 && acc < 65) return { label: "Progressing", rate: 15, next: 65 };
      if (acc >= 65 && acc < 70) return { label: "Progressing", rate: 20, next: 70 };
      if (acc >= 70 && acc < 75) return { label: "Meets Expectation", rate: 30, next: 75 };
      if (acc >= 75 && acc < 80) return { label: "Meets Expectation", rate: 40, next: 80 };
      if (acc >= 80 && acc < 85) return { label: "Proficient", rate: 50, next: 85 };
      if (acc >= 85 && acc <= 90) return { label: "Proficient", rate: 60, next: 91 };
      return { label: "Master", rate: 70, next: 100 };
    };

    const tier = getTierData(accuracy);
    return { 
      approved, 
      rejected, 
      inProgress, 
      totalSubmitted, 
      accuracy, 
      tier, 
      earnings: approved * tier.rate 
    };
  }, [user?.stats]);

  return (
    <div className={`min-h-screen bg-[#F3F4F6] p-4 md:p-6 ${robotoSlab.className} text-black`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- MINIMAL HEADER --- */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-neutral-300 p-6 rounded-xl shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Agent Report Desk</h1>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider mt-0.5">ID: {user?.name || 'DTS_USER'}</p>
            </div>
          </div>
          <div className="bg-neutral-100 px-3 py-1.5 rounded border border-neutral-200 font-mono text-xs text-neutral-600">
            {currentTime || "00:00:00"}
          </div>
        </header>

        {/* --- STAT CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Net Earnings" value={`₹${stats.earnings}`} sub={`Current Rate: ₹${stats.tier.rate}/resume`} icon={<Wallet size={16}/>} />
          <MetricCard label="Node Accuracy" value={`${stats.accuracy}%`} sub={`${stats.totalSubmitted} total processed`} invert />
          <MetricCard label="Assigned Tier" value={stats.tier.label} sub={`Next scale target: ${stats.tier.next}%`} icon={<Award size={16}/>} />
        </div>

        {/* --- MAIN SPLIT CONTAINER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDE: LIVE ANALYTICS SUMMARY */}
          <div className="lg:col-span-5 bg-white border border-neutral-300 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">📊 Production Summary</h3>
            
            <div className="space-y-4">
              <DataRow label="Approved Resumes" value={stats.approved} sub="Accurate verified nodes" />
              <hr className="border-neutral-200" />
              <DataRow label="Rejected Resumes" value={stats.rejected} sub="Validation match failures" isRed />
              <hr className="border-neutral-200" />
              <DataRow label="In-Progress Status" value={stats.inProgress} sub="Active processing sessions" isGray icon={<Clock size={12}/>} />
              
              <div className="pt-4 border-t border-neutral-300 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-neutral-500">Gross Processed</span>
                <span className={`${passero.className} text-4xl`}>{stats.totalSubmitted}</span>
              </div>
            </div>

            {/* POLICY DISCLOSURE NOTATIONS */}
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2 text-[11px] text-neutral-500 leading-relaxed font-sans">
              <p>⚠️ <strong>Payout Notice:</strong> Payout rates are calculated per resume. Earnings accumulate exclusively from accurate, approved submissions.</p>
              <p>📉 <strong>Disqualification Guard:</strong> Even if overall session quality falls below 50% accuracy, DataSort guarantees a minimum safety baseline rate of <strong>INR 2/-</strong> for every single verified accurate record.</p>
              <p>💰 <strong>Withdrawal Threshold:</strong> The absolute minimum balance requirement to trigger an outward fund transfer payout is <strong>Rs. 1,000</strong>.</p>
            </div>
          </div>

          {/* RIGHT SIDE: THE COMPREHENSIVE 10-TIER BLUEPRINT */}
          <div className="lg:col-span-7 bg-white border border-neutral-300 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider w-24">Accuracy Matrix</span>
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider text-center flex-1">Work Quality Rating</span>
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider text-right w-20">Rate</span>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <TierRow range="91% - 100%" label="Master" rate="INR 70/-" active={stats.accuracy >= 91} />
              <TierRow range="85% - 90%"  label="Proficient" rate="INR 60/-" active={stats.accuracy >= 85 && stats.accuracy <= 90} />
              <TierRow range="80% - 85%"  label="Proficient" rate="INR 50/-" active={stats.accuracy >= 80 && stats.accuracy < 85} />
              <TierRow range="75% - 80%"  label="Meets Expectation" rate="INR 40/-" active={stats.accuracy >= 75 && stats.accuracy < 80} />
              <TierRow range="70% - 75%"  label="Meets Expectation" rate="INR 30/-" active={stats.accuracy >= 70 && stats.accuracy < 75} />
              <TierRow range="65% - 70%"  label="Progressing" rate="INR 20/-" active={stats.accuracy >= 65 && stats.accuracy < 70} />
              <TierRow range="60% - 65%"  label="Progressing" rate="INR 15/-" active={stats.accuracy >= 60 && stats.accuracy < 65} />
              <TierRow range="55% - 60%"  label="Emerging" rate="INR 10/-" active={stats.accuracy >= 55 && stats.accuracy < 60} />
              <TierRow range="50% - 55%"  label="Emerging" rate="INR 5/-" active={stats.accuracy >= 50 && stats.accuracy < 55} />
              <TierRow range="Below 50%"  label="Learning" rate="INR 2/-" active={stats.accuracy < 50 && stats.totalSubmitted > 0} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* --- LOGICALLY ISOLATED UI COMPONENT PRIMITIVES --- */

function MetricCard({ label, value, sub, icon, invert }) {
  return (
    <div className={`p-6 border border-neutral-300 rounded-xl h-40 flex flex-col justify-between transition-all ${
      invert ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-wider opacity-50">{label}</span>
        <span className={invert ? 'text-neutral-400' : 'text-neutral-500'}>{icon || <Target size={14}/>}</span>
      </div>
      <div>
        <h2 className={`${passero.className} text-4xl leading-none`}>{value}</h2>
        <p className="text-[10px] font-medium opacity-40 mt-2 uppercase tracking-wide">{sub}</p>
      </div>
    </div>
  );
}

function DataRow({ label, value, sub, isRed, isGray, icon }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-black uppercase tracking-tight">{label}</p>
          {icon && <span className="text-neutral-400">{icon}</span>}
        </div>
        <p className="text-[10px] text-neutral-400 font-sans">{sub}</p>
      </div>
      <span className={`${passero.className} text-3xl ${isRed ? 'text-red-500' : isGray ? 'text-neutral-400' : 'text-black'}`}>
        {value}
      </span>
    </div>
  );
}

function TierRow({ range, label, rate, active }) {
  return (
    <div className={`flex justify-between items-center px-3 py-2 rounded border ${
      active 
        ? 'bg-black text-white border-black font-bold scale-[1.01] shadow-sm' 
        : 'bg-neutral-50 text-neutral-500 border-neutral-200 opacity-80'
    }`}>
      <span className="w-24 text-left font-mono text-[11px]">{range}</span>
      <span className="text-center flex-1 text-[11px] uppercase tracking-wide">{label}</span>
      <span className="w-20 text-right font-mono text-[11px] font-bold">{rate}</span>
    </div>
  );
}