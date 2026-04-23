"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { passero, robotoSlab } from "@/lib/fonts";
import { fetchAdminLiveStats } from "@/app/actions/admin"; // Ensure this action exists
import { 
  UploadCloud, Users, FileText, Globe, 
  ArrowUpRight, ShieldCheck, Activity, 
  Zap, Database, PieChart, Clock, Loader2
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useUserStore();
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  // 1. Fetch Real Data from Server Action
  useEffect(() => {
    async function getStats() {
      try {
        const res = await fetchAdminLiveStats();
        if (res.success) {
          console.log("📊 Data Sync Success:", res);
          setAdminStats(res);
        }
      } catch (error) {
        console.error("❌ Dashboard Sync Error:", error);
      } finally {
        setLoading(false);
      }
    }
    getStats();
  }, []);

  // 2. Hydration-safe clock (satisfies ESLint & React 19)
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString());
    const frame = requestAnimationFrame(tick);
    const timer = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, []);

  // 3. Memoized Data Processing
  const stats = useMemo(() => {
    return {
      total: adminStats?.totalResumes ?? 0,
      approved: adminStats?.approved ?? 0,
      rejected: adminStats?.rejected ?? 0,
      submitted: adminStats?.pending ?? 0, 
      inProgress: adminStats?.inProgress ?? 0,
      accuracy: adminStats?.globalAccuracy ?? 0,
      activeNodes: adminStats?.activeUsersCount ?? 0
    };
  }, [adminStats]);

  const quickActions = [
    { name: 'Upload Pool', icon: <UploadCloud size={20}/>, path: '/admin/upload', isBlack: true },
    { name: 'User Master', icon: <Users size={20}/>, path: '/admin/users', isBlack: false },
    { name: 'Pool View', icon: <FileText size={20}/>, path: '/admin/resumes', isBlack: false },
    { name: 'System Logs', icon: <Database size={20}/>, path: '/admin/support', isBlack: false },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-200">
        <Loader2 className="animate-spin text-black" size={40} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-200 p-6 lg:p-10 ${robotoSlab.className} text-black animate-in fade-in duration-700`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-white relative overflow-hidden">
          <div className="relative z-10 space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
               <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Root Access / {user?.name || "Admin"}</p>
            </div>
            <h1 className={`${passero.className} text-5xl uppercase italic tracking-tight leading-none`}>
              Admin <span className="opacity-20 italic">Console</span>
            </h1>
          </div>
          
          <div className="mt-6 md:mt-0 flex items-center gap-6">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Pipeline Pulse</p>
              <p className="text-sm font-black tabular-nums">{currentTime || "--:--:--"}</p>
            </div>
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
              <Globe size={28} />
            </div>
          </div>
        </header>

        {/* --- QUICK ACTIONS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickActions.map((action, i) => (
            <Link href={action.path} key={i} className="group">
              <div className={`flex items-center justify-between px-8 h-20 rounded-3xl transition-all duration-500 cursor-pointer shadow-sm
                ${action.isBlack 
                  ? 'bg-black text-white hover:bg-white hover:text-black' 
                  : 'bg-white text-black hover:bg-black hover:text-white'
                }`}>
                <div className="flex items-center gap-4">
                  {action.icon}
                  <span className="text-[11px] font-black uppercase tracking-widest">{action.name}</span>
                </div>
                <ArrowUpRight size={16} className="opacity-20 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>

        {/* --- PERFORMANCE NODES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricNode label="Total Pool" value={stats.total} sub="Lifetime Instances" />
          <MetricNode label="Approved" value={stats.approved} sub="Verified Data" isGreen />
          <MetricNode label="Rejected" value={stats.rejected} sub="Accuracy Failed" isRed />
          <MetricNode label="System Accuracy" value={`${stats.accuracy}%`} sub="Global ROI" isBlack />
        </div>

        {/* --- ANALYTICS SECTIONS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-20">
          
          {/* Work Breakdown */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm space-y-8">
            <h3 className="text-xs font-black uppercase italic tracking-widest flex items-center gap-2 opacity-30">
              <PieChart size={16} /> Data Flow
            </h3>
            <div className="space-y-6">
               <DataLine label="In-Progress" value={stats.inProgress} sub="Active mapping sessions" icon={<Clock size={14} className="animate-pulse"/>} />
               <DataLine label="Pending Audit" value={stats.submitted} sub="Awaiting Admin QC" isGray />
               <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30 leading-none">Load Profile</p>
                  <div className="flex gap-1 h-8 items-end">
                    {[40, 70, 35, 80, 50].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className="w-1.5 bg-black/10 rounded-full" />
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Infrastructure Stats */}
          <div className="lg:col-span-2 bg-black text-white rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between group hover:bg-white hover:text-black transition-all duration-500 min-h-[300px]">
            <div className="flex justify-between items-start">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100">Infrastructure Health</h3>
              <Activity size={20} className="opacity-20 group-hover:opacity-100" />
            </div>
            <div className="flex items-end justify-between mt-12">
               <div>
                  <h2 className={`${passero.className} text-8xl leading-none`}>
                    {stats.accuracy}<span className="text-2xl opacity-40">%</span>
                  </h2>
                  <p className="text-xs font-bold uppercase tracking-widest mt-4 opacity-40 group-hover:opacity-100 italic">
                    Node Efficiency Verified
                  </p>
               </div>
               <div className={`${passero.className} text-right`}>
                  <p className="text-[10px] uppercase opacity-40 mb-1">Active Nodes</p>
                  <p className="text-6xl">{stats.activeNodes}</p>
               </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

/* --- REUSABLE UI COMPONENTS --- */

function MetricNode({ label, value, sub, isGreen, isRed, isBlack }) {
  return (
    <div className={`p-8 rounded-[2.2rem] transition-all duration-500 group shadow-sm flex flex-col justify-between h-48 border border-black/5
      ${isBlack ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}
    `}>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-60">{label}</p>
      <div>
        <h2 className={`
          ${passero.className} text-5xl leading-none transition-colors
          ${isGreen ? 'text-emerald-500 group-hover:text-white' : ''}
          ${isRed ? 'text-red-500 group-hover:text-white' : ''}
        `}>
          {value ?? 0}
        </h2>
        <p className="text-[9px] font-bold opacity-30 mt-3 uppercase tracking-widest italic group-hover:opacity-100">{sub}</p>
      </div>
    </div>
  );
}

function DataLine({ label, value, sub, isGray, icon }) {
  return (
    <div className="flex justify-between items-center group">
       <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black uppercase tracking-tight">{label}</p>
            {icon && <span className="text-black/20 group-hover:text-black/100">{icon}</span>}
          </div>
          <p className="text-[9px] opacity-30 uppercase font-bold tracking-tighter">{sub}</p>
       </div>
       <span className={`${passero.className} text-3xl ${isGray ? 'text-gray-300' : 'text-black'}`}>
         {value ?? 0}
       </span>
    </div>
  );
}