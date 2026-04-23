"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from "react";
import { getSubmittedResumes } from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import { 
  FileCheck, Clock, CheckCircle2, XCircle, 
  AlertCircle, Search, Loader2, ExternalLink, 
  ArrowRight, ShieldCheck 
} from "lucide-react";
import Link from "next/link";

function SubmittedContent() {
  const userId = useUserStore((state) => state.user?.id);
  const [data, setData] = useState([]);
  
  // FIX: Initial state ko hi smart rakha hai taaki sync update na karni pade
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Agar userId nahi hai, toh async tarike se loading band karo
    if (!userId) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    let isSubscribed = true;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await getSubmittedResumes(userId);
        if (isSubscribed && res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    fetchData();
    return () => { isSubscribed = false; };
  }, [userId]);

  const getStatusConfig = useMemo(() => (status) => {
    const configs = {
      approved: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Approved', icon: <CheckCircle2 size={14} /> },
      rejected: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', label: 'Rejected', icon: <XCircle size={14} /> },
      default: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', label: 'Pending Approval', icon: <AlertCircle size={14} /> }
    };
    return configs[status] || configs.default;
  }, []);

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto min-h-screen ">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <ShieldCheck size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Verification Hub</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
            Submission <span className="text-blue-600 italic font-black">History</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
            <span className="w-12 h-px bg-slate-200"></span> Track your data quality & status
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
          <div className="flex flex-col items-center border-r border-slate-200 pr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
            <span className="text-xl font-black italic text-slate-900 leading-none">{data?.length || 0}</span>
          </div>
          <div className="flex flex-col items-center pl-2">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Approved</span>
            <span className="text-xl font-black italic text-emerald-600 leading-none">
              {data?.filter(i => i.status === 'approved').length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Records...</p>
        </div>
      ) : data?.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3.5rem] py-32 text-center">
          <Search className="mx-auto text-slate-300 mb-4" size={40} />
          <h3 className="text-slate-900 font-black uppercase text-sm tracking-widest">Empty History</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 max-w-xs mx-auto leading-relaxed">
            Assignments will appear here after final submission.
          </p>
          <Link href="/user/allresumesavailable" className="inline-flex items-center gap-2 mt-8 text-[10px] font-black uppercase text-blue-600 hover:gap-4 transition-all">
            Browse Inventory <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {data.map((item) => {
            const config = getStatusConfig(item.status);
            return (
              <div 
                key={item._id} 
                className="group bg-white border border-slate-100 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-100 transition-all duration-500"
              >
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className={`p-5 rounded-[1.5rem] ${config.bg} ${config.text} shadow-sm transition-transform duration-500 group-hover:scale-110`}>
                    <FileCheck size={28} />
                  </div>
                  <div className="space-y-2 overflow-hidden">
                    <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight truncate max-w-xs">
                      {item.resumeId?.originalName || "Untitled_Document.pdf"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                        <Clock size={12} className="text-slate-300" /> 
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-100 hidden md:block"></span>
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                        REF: {item._id.slice(-12).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 mt-8 md:mt-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-6 md:pt-0">
                  <div className={`flex items-center gap-2.5 px-6 py-3 rounded-full border-2 ${config.bg} ${config.text} ${config.border}`}>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${config.text.replace('text', 'bg')}`}></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {config.label}
                    </span>
                  </div>
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors group">
                    Details <ExternalLink size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// SSR disable karke export taaki Hydration aur Sync state ke saare errors khatam ho jayein
export default dynamic(() => Promise.resolve(SubmittedContent), { ssr: false });