"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { useAdminStore } from "@/store/useAdminStore"; // Binding admin store hooks
import { robotoSlab, ubuntu, passero } from "@/lib/fonts";
import { fetchAdminLiveStats } from "@/app/actions/admin";
import Chart from "chart.js/auto";
import { create } from 'zustand'; // <-- ADD THIS LINE
import {
  UploadCloud, Users, FileText, ArrowUpRight, Activity, 
  CalendarClock, MessageCircleQuestionMark, CheckCheck, 
  FileChartLine, SquareCheckBig, SquareUser, Database, 
  Loader2, TrendingUp, FileClock
} from 'lucide-react';

export default function AdminPage() {
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  
  // Explicitly reference the canvas storage container to completely clear rendering memory leaks
  const chartRef = useRef(null); 

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
    const tick = () => setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour12: true }));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const end = new Date("2026-05-15T00:00:00.000+00:00");
    const now = new Date();
    const timeProgress = Math.max(0, Math.min(100, 100 - ((end - now) / (end - new Date("2026-04-23T10:29:18.580+00:00"))) * 100));

    return {
      totalInstances: adminStats?.totalResumes ?? 0,
      totalUploaded: adminStats?.totalUploaded ?? 0,
      approved: adminStats?.approved ?? 0,
      rejected: adminStats?.rejected ?? 0,
      inProgress: adminStats?.inProgress ?? 0,
      saved: adminStats?.saved ?? 0,
      pending: adminStats?.pending ?? 0,
      activeUsers: adminStats?.activeUsersCount ?? 0,
      chartData: adminStats?.chartData ?? [],
      latency: adminStats?.latency ?? 0,
      actionHistory: adminStats?.actionHistory ?? [],
      dbUsage: adminStats?.dbUsage ?? 38,
      timeProgress: Math.round(timeProgress),
    };
  }, [adminStats]);

  // Safe ChartJS Initialization Lifecycle Loop
  useEffect(() => {
    if (!stats.chartData.length) return;

    const canvasCtx = document.getElementById("trendChart");
    if (!canvasCtx) return;

    // Strict cleanup check using refs before instantiating a new chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = stats.chartData.map(d =>
      new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
    );
    const counts = stats.chartData.map(d => d.count);
    const peak = Math.max(...counts, 0);

    chartRef.current = new Chart(canvasCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Resumes",
          data: counts,
          backgroundColor: counts.map(v => v === peak && peak > 0 ? "#5b21b6" : "#8b5cf6"),
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1e1b4b",
            titleColor: "#c4b5fd",
            bodyColor: "#fff",
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: ctx => ` ${ctx.parsed.y} resume${ctx.parsed.y !== 1 ? "s" : ""}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: "#94a3b8", autoSkip: false, maxRotation: 0 },
            border: { display: false }
          },
          y: {
            grid: { color: "rgba(148,163,184,0.12)", drawTicks: false },
            ticks: { font: { size: 11 }, color: "#94a3b8", padding: 8, stepSize: 1 },
            border: { display: false }
          }
        }
      }
    });

    // Complete cleanup on unmount or refresh events
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [stats.chartData]);

  const quickActions = [
    { name: 'Upload Resume', icon: <UploadCloud size={20} />, path: '/admin/upload', isBlack: true },
    { name: 'All Users', icon: <Users size={20} />, path: '/admin/users', isBlack: false },
    { name: 'All Resumes', icon: <FileText size={20} />, path: '/admin/savedresume', isBlack: false },
    { name: 'All Queries', icon: <MessageCircleQuestionMark size={20} />, path: '/admin/queries', isBlack: false },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-violet-600" size={40} />
          <p className={`${passero.className} text-[11px] text-zinc-400 font-bold uppercase tracking-widest`}>Syncing Core Infrastructure...</p>
        </div>
      </div>
    );
  }

  const chartTotal = stats.chartData.reduce((a, d) => a + d.count, 0);
  const chartPeak = Math.max(...stats.chartData.map(d => d.count), 0);
  const chartAvg = Math.round(chartTotal / (stats.chartData.length || 1));

  return (
    <div className={`min-h-screen bg-white p-6 lg:p-10 ${ubuntu.className} text-black animate-in fade-in duration-700`}>
      <div className="max-w-7xl mx-auto space-y-10">

        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-xl shadow-xl border-2 border-slate-100 relative overflow-hidden">
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <h1 className={`${robotoSlab.className} text-6xl uppercase italic tracking-tighter leading-none`}>
              Admin Panel
            </h1>
          </div>
          <div className="mt-8 md:mt-0 flex items-center gap-8 bg-slate-50 p-6 rounded-[2rem]">
            <div className="text-right">
              <p className="text-[12px] text-black tracking-widest mb-1">Network Time</p>
              <p className="text-xl font-bold tabular-nums text-violet-600">{currentTime || "--:--:--"}</p>
            </div>
            <div className="w-14 h-14 bg-violet-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
              <CalendarClock size={24} />
            </div>
          </div>
        </header>

        {/* --- QUICK ACTIONS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, i) => (
            <Link href={action.path} key={i} className="group">
              <div className={`flex items-center justify-between px-8 h-24 rounded-xl transition-all duration-500 cursor-pointer shadow-sm border border-slate-100
                ${action.isBlack ? 'bg-slate-900 text-white hover:bg-violet-600' : 'bg-white text-black hover:border-violet-600'}`}>
                <div className="flex items-center gap-5">
                  <div className={`transition-all duration-300 ${action.isBlack ? 'text-violet-400 group-hover:text-white' : 'text-black group-hover:text-violet-600'}`}>
                    {action.icon}
                  </div>
                  <span className="text-[14px] font-semibold group-hover:underline underline-offset-8">{action.name}</span>
                </div>
                <ArrowUpRight size={18} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* --- METRIC NODES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricNode label="Activated Resumes" value={stats.totalInstances} sub="Total Resumes Started" type="violet" icon={<CheckCheck size={24} />} />
          <MetricNode label="Total Approved" value={stats.approved} sub="Approved Resumes Count" type="emerald" icon={<SquareCheckBig size={24} />} />
          <MetricNode label="Total Uploaded" value={stats.totalUploaded} sub="Total Resumes Count" type="red" icon={<FileChartLine size={24} />} />
          <MetricNode label="Active Users" value={stats.activeUsers} sub="Currently Active Users" type="yellow" icon={<SquareUser size={24} />} />
        </div>

        {/* --- PIPELINE + LATENCY + STORAGE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 bg-white border border-slate-100 rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                <Activity size={18} className="text-violet-600" />
              </div>
              <div>
                <h3 className={`${robotoSlab.className} text-lg font-bold`}>Resume Pipeline</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Live Stage Breakdown</p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { label: "In Progress", value: stats.inProgress, color: "bg-violet-500", dot: "bg-violet-500" },
                { label: "Submitted", value: stats.pending, color: "bg-blue-500", dot: "bg-blue-500" },
                { label: "Saved", value: stats.saved, color: "bg-green-500", dot: "bg-green-500" },
                { label: "Approved", value: stats.approved, color: "bg-emerald-500", dot: "bg-emerald-500" },
                { label: "Rejected", value: stats.rejected, color: "bg-red-500", dot: "bg-red-500" },
              ].map((stage) => {
                const pct = stats.totalInstances > 0 ? Math.round((stage.value / stats.totalInstances) * 100) : 0;
                return (
                  <div key={stage.label}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                        <span className="text-sm font-medium text-slate-700">{stage.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded
                          ${stage.color === 'bg-emerald-500' ? 'bg-emerald-50 text-emerald-600' :
                            stage.color === 'bg-red-500' ? 'bg-red-50 text-red-600' :
                            stage.color === 'bg-violet-500' ? 'bg-violet-50 text-violet-600' :
                            stage.color === 'bg-blue-500' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {pct}%
                        </span>
                        <span className="text-sm font-bold text-slate-800 w-6 text-right">{stage.value}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-2xl h-2 overflow-hidden">
                      <div className={`${stage.color} h-2 transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 grid grid-cols-3 gap-4">
              {[
                { label: "In Progress", value: stats.inProgress, color: "text-violet-600" },
                { label: "Total Completed", value: stats.approved + stats.rejected, color: "text-emerald-600" },
                { label: "Total Approved", value: stats.approved, color: "text-amber-500" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`${robotoSlab.className} text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-black uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-8 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                    <Activity size={18} className="text-violet-600" />
                  </div>
                  <h3 className={`${robotoSlab.className} text-lg font-bold`}>DB Latency</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full
                  ${stats.latency < 100 ? 'bg-emerald-100 text-emerald-600' : stats.latency < 300 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                  {stats.latency < 100 ? '● GOOD' : stats.latency < 300 ? '● OK' : '● SLOW'}
                </span>
              </div>
              <div>
                <p className={`${robotoSlab.className} text-5xl font-bold tabular-nums text-violet-600 leading-none`}>
                  {stats.latency}<span className="text-lg font-normal text-slate-400 ml-1">ms</span>
                </p>
                <p className="text-xs text-slate-400 mt-2">Last measured on page load</p>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full transition-all duration-700 ${stats.latency < 100 ? 'bg-emerald-500' : stats.latency < 300 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min((stats.latency / 300) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-8 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                  <Database size={18} className="text-violet-600" />
                </div>
                <div>
                  <h3 className={`${robotoSlab.className} text-lg font-bold`}>Atlas Storage</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">512 MB Free Tier</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={stats.dbUsage < 60 ? "#10b981" : stats.dbUsage < 80 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="3" strokeDasharray={`${stats.dbUsage} ${100 - stats.dbUsage}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`${robotoSlab.className} text-sm font-bold text-slate-800`}>{stats.dbUsage}%</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Used</span>
                      <span className="font-bold text-slate-800">{Math.round(512 * stats.dbUsage / 100)} MB</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-700 ${stats.dbUsage < 60 ? 'bg-emerald-500' : stats.dbUsage < 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${stats.dbUsage}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- 7-DAY TREND CHART --- */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100">
                <TrendingUp size={20} className="text-violet-700" />
              </div>
              <div>
                <h3 className={`${robotoSlab.className} text-xl font-black italic tracking-tight`}>Growth Analytics</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live · 7-Day Cycle</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total (7d)", value: chartTotal },
              { label: "Peak Day", value: chartPeak },
              { label: "Daily Avg", value: chartAvg },
            ].map(card => (
              <div key={card.label} className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                <p className={`${robotoSlab.className} text-2xl font-bold text-black`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="relative w-full h-56 overflow-hidden">
            <canvas id="trendChart" role="img" aria-label="Bar chart showing resume submissions over the last 7 days" />
          </div>
        </div>

        {/* --- ACTION HISTORY --- */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-8">
          <h3 className={`${robotoSlab.className} text-xl font-bold mb-6`}>Recent Status Changes</h3>
          <div className="space-y-3">
            {stats.actionHistory.length === 0 ? (
              <p className="text-slate-400 text-sm">No recent actions found.</p>
            ) : (
              stats.actionHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Resume <span className="font-mono text-xs text-slate-400">{item.resumeId.slice(-6).toUpperCase()}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        User <span className="font-mono">{item.userId.slice(-6).toUpperCase()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full
                      ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {item.status.toUpperCase()}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date(item.updatedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short', hour12: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricNode({ label, value, sub, type, icon }) {
  const themes = {
    violet: { bg: "bg-gradient-to-br from-violet-600 to-indigo-900 shadow-violet-200/50", iconBg: "bg-indigo-400/20" },
    red: { bg: "bg-gradient-to-br from-red-600 to-rose-950 shadow-red-300/40", iconBg: "bg-rose-400/20" },
    emerald: { bg: "bg-gradient-to-br from-emerald-500 to-teal-900 shadow-emerald-200/50", iconBg: "bg-teal-400/20" },
    yellow: { bg: "bg-gradient-to-br from-amber-500 to-orange-950 shadow-orange-300/30", iconBg: "bg-orange-400/20" },
  };

  const theme = themes[type] || themes.violet;

  return (
    <div className={`p-8 rounded-lg ${theme.bg} flex flex-row items-center justify-between h-48 shadow-xl relative overflow-hidden group`}>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      <div className="relative z-10 flex flex-col justify-between h-full py-1">
        <p className="text-[14px] font-bold text-white pb-4">{label}</p>
        <div>
          <h2 className={`${robotoSlab.className} text-6xl font-bold leading-none text-white tracking-tighter`}>
            {value ?? 0}
          </h2>
          <p className="text-[12px] text-white mt-2 pt-4">{sub}</p>
        </div>
      </div>
      <div className={`relative z-10 w-14 h-14 ${theme.iconBg} flex items-center justify-center backdrop-blur-md border border-white/5 shadow-inner`}>
        <div className="text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}