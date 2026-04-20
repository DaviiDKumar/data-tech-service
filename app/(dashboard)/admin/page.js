"use client";
import React from "react";
import Link from "next/link";
import { UploadCloud, Layers, Users, FileText, Zap, CheckCircle, Database, ArrowUpRight, TrendingUp, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const quickActions = [
    { name: 'Upload Resume', icon: <UploadCloud size={18}/>, path: '/admin/upload', className: "bg-blue-600 text-white hover:bg-blue-700" },
  
    { name: 'User Master', icon: <Users size={18}/>, path: '/admin/users', className: "bg-slate-900 text-white hover:bg-black" },
    { name: 'Pool View', icon: <FileText size={18}/>, path: '/admin/resumes', className: "bg-white text-slate-900 border-2 border-slate-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 p-1">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <Badge className="bg-orange-100 text-orange-600 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic">System Active</Badge>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900">Admin <span className="text-blue-600">Dashboard</span></h1>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[3px]">Growthforge Data Monitoring Pipeline</p>
        </div>
        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-orange-500 shadow-xl"><Globe size={28} className="animate-spin-slow"/></div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {quickActions.map((action, i) => (
          <Link href={action.path} key={i} className="block">
            <Button className={`w-full h-20 justify-between px-8 rounded-[1.5rem] shadow-lg border-none font-black uppercase text-xs transition-transform hover:scale-[1.03] active:scale-95 ${action.className}`}>
              <div className="flex items-center gap-4">{action.icon}<span>{action.name}</span></div>
              <ArrowUpRight size={16} className="opacity-40" />
            </Button>
          </Link>
        ))}
      </div>

      {/* Stats and Progress logic here (Same as previous provided code) */}
    </div>
  );
}