"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { robotoSlab, ubuntu } from "@/lib/fonts";
import { fetchAdminLiveStats } from "@/app/actions/admin";
import {
  UploadCloud, Users, FileText, Globe,
  ArrowUpRight, Activity, TrendingUp, Calendar,
  Database, PieChart, Loader2, CheckCircle2
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useUserStore();
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    async function getStats() {
      try {
        const res = await fetchAdminLiveStats();
        if (res.success) {
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

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => ({
    total: adminStats?.totalResumes ?? 0,
    approved: adminStats?.approved ?? 0,
    rejected: adminStats?.rejected ?? 0,
    submittedToday: adminStats?.submittedToday ?? 0,
    activeToday: adminStats?.activeToday ?? 0,
    accuracy: adminStats?.globalAccuracy ?? 0,
    activeNodes: adminStats?.activeUsersCount ?? 0,
    dailyYield: adminStats?.dailyYield ?? 0, // Percentage of target met
  }), [adminStats]);

  const quickActions = [
    { name: 'Upload Resume', icon: <UploadCloud size={20} />, path: '/admin/upload', isBlack: true },
    { name: 'All Users', icon: <Users size={20} />, path: '/admin/users', isBlack: false },
    { name: 'All Resumes', icon: <FileText size={20} />, path: '/admin/resumes', isBlack: false },
    { name: 'All Queries', icon: <Database size={20} />, path: '/admin/queries', isBlack: false },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Infrastructure</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white p-6 lg:p-10 ${ubuntu.className} text-black animate-in fade-in duration-700`}>
      <div className="max-w-7xl mx-auto space-y-10">

        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Admin </p>
            </div>
            <h1 className={`${robotoSlab.className} text-6xl uppercase italic tracking-tighter leading-none`}>
              Admin Panel
            </h1>
          </div>

          <div className="mt-8 md:mt-0 flex items-center gap-8 bg-slate-50 p-6 rounded-[2rem]">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Network Time</p>
              <p className="text-xl font-bold tabular-nums text-blue-600">{currentTime || "--:--:--"}</p>
            </div>
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 rotate-6">
              <Globe size={24} />
            </div>
          </div>
        </header>

        {/* --- QUICK ACTIONS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, i) => (
            <Link href={action.path} key={i} className="group">
              <div className={`flex items-center justify-between px-8 h-24 rounded-[2rem] transition-all duration-500 cursor-pointer shadow-sm border border-slate-100
                ${action.isBlack ? 'bg-slate-900 text-white hover:bg-blue-600' : 'bg-white text-black hover:border-blue-600'}`}>
                <div className="flex items-center gap-5">
                  <div className={`${action.isBlack ? 'text-blue-400' : 'text-slate-400'} group-hover:text-white transition-colors`}>
                    {action.icon}
                  </div>
                  <span className="text-[12px] font-black uppercase tracking-widest">{action.name}</span>
                </div>
                <ArrowUpRight size={18} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* --- TOP PERFORMANCE NODES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricNode label="Active Queue" value={stats.total} sub="Total Live Instances" />
          <MetricNode label="Success Rate" value={stats.approved} sub="Verified Valid" isGreen />
          <MetricNode label="Error Rate" value={stats.rejected} sub="Data Mismatches" isRed />
          <MetricNode label="Global Precision" value={`${stats.accuracy}%`} sub="System Benchmark" isBlue />
        </div>

        {/* --- ANALYTICS SECTIONS (GAUGES & NODES) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          
          {/* Yield Gauge */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-between min-h-[400px]">
             <div className="w-full flex justify-between items-start mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <PieChart size={14} /> Yield Analysis
                </h3>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">Today</span>
             </div>

             <YieldCircle percentage={stats.dailyYield || 0} />

             <div className="w-full grid grid-cols-2 gap-6 pt-8 border-t border-slate-50">
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Target Met</p>
                  <p className="text-2xl font-bold">{stats.submittedToday}</p>
                </div>
                <div className="text-center border-l border-slate-50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Active Nodes</p>
                  <p className="text-2xl font-bold">{stats.activeNodes}</p>
                </div>
             </div>
          </div>

          {/* Large Network Status Card */}
          <div className="lg:col-span-2 bg-slate-900 text-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group min-h-[400px] flex flex-col justify-between">
            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] group-hover:bg-blue-600/30 transition-all duration-1000" />
            
            <div className="relative z-10 flex justify-between">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-2">Real-time Infrastructure</h3>
                <p className="text-slate-500 text-xs">Global Accuracy & Node Throughput</p>
              </div>
              <Activity size={24} className="text-blue-500 animate-pulse" />
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
              <div>
                <h2 className={`${robotoSlab.className} text-[10rem] leading-none tracking-tighter`}>
                  {stats.accuracy}<span className="text-3xl text-blue-600">%</span>
                </h2>
                <p className="text-xs font-black uppercase tracking-[0.3em] mt-6 text-slate-400">Verification Integrity</p>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex justify-between items-center group/item hover:bg-white/10 transition-all">
                   <div>
                      <p className="text-3xl font-bold">{stats.activeToday}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sessions Active Today</p>
                   </div>
                   <TrendingUp className="text-blue-500" />
                </div>
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex justify-between items-center group/item hover:bg-white/10 transition-all">
                   <div>
                      <p className="text-3xl font-bold">{stats.submittedToday}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Submissions Locked</p>
                   </div>
                   <CheckCircle2 className="text-green-500" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* --- REUSABLE UI COMPONENTS --- */

function YieldCircle({ percentage }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
        <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="text-blue-600 transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${robotoSlab.className} text-5xl font-bold`}>{percentage}%</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
      </div>
    </div>
  );
}

function MetricNode({ label, value, sub, isGreen, isRed, isBlue }) {
  return (
    <div className={`p-10 rounded-[2.8rem] transition-all duration-500 group shadow-sm flex flex-col justify-between h-56 border border-slate-100 bg-white hover:bg-slate-900 hover:text-white`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500">{label}</p>
      <div>
        <h2 className={`
          ${robotoSlab.className} text-6xl leading-none transition-colors
          ${isGreen ? 'text-emerald-500 group-hover:text-emerald-400' : ''}
          ${isRed ? 'text-red-500 group-hover:text-red-400' : ''}
          ${isBlue ? 'text-blue-600 group-hover:text-blue-400' : ''}
        `}>
          {value ?? 0}
        </h2>
        <p className="text-[9px] font-bold text-slate-300 mt-4 uppercase tracking-widest group-hover:text-slate-500">{sub}</p>
      </div>
    </div>
  );
}