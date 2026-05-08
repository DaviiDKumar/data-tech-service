"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { getRejectedResumes } from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import { passero } from "@/lib/fonts";
import { 
  AlertCircle, RefreshCw, Loader2, 
  Search, History, ShieldAlert, ArrowRight, Eye
} from "lucide-react";
import Link from "next/link";

function UserRejectedContent() {
  const userId = useUserStore((state) => state.user?.id);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!userId) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;

    async function fetchData() {
      try {
        const res = await getRejectedResumes(userId);
        if (isMounted && res.success) {
          setData(res.data ?? []);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [userId]);

  const filtered = data.filter(item =>
    item.resumeId?.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!userId && loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-black" size={40} />
      </div>
    );
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
      <Loader2 className="animate-spin text-black" size={40} />
      <p className={`${passero.className} text-[10px] uppercase tracking-[5px] text-slate-400`}>
        Syncing Rejection Logs...
      </p>
    </div>
  );

  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto min-h-screen bg-gray-50">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-600 p-1.5 rounded-md">
              <ShieldAlert size={16} className="text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600">
              Quality Control
            </span>
          </div>
          <h1 className={`${passero.className} text-6xl uppercase tracking-tighter text-black leading-none`}>
            Needs <span className="text-red-600">Rework</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 pt-4">
            <span className="w-10 h-0.5 bg-red-600" />
            Review-only — inspect rejection reason, no edits
          </p>
        </div>

        {/* Counter */}
        <div className="bg-white border-2 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-right">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Flagged</span>
            <span className="text-4xl font-black text-black leading-none italic">{data.length}</span>
          </div>
        </div>
      </div>

      {/* ── REVIEW MODE NOTICE ── */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 mb-10">
        <Eye size={16} className="text-amber-600 flex-shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
          Resumes on this page open in <span className="text-amber-900">read-only review mode</span> — no edits, no save, no submit.
        </p>
      </div>

      {/* ── SEARCH ── */}
      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search logs..."
          className="w-full bg-white border-2 border-slate-200 rounded-2xl py-5 pl-16 pr-8 text-[11px] font-black uppercase tracking-widest focus:border-black focus:ring-0 transition-all outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ── GRID ── */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-32 text-center">
          <History className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className={`${passero.className} text-black uppercase text-sm tracking-[5px]`}>System Clean</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-4">Zero items in rejection queue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="group bg-white border-2 border-slate-200 p-8 rounded-[2.5rem] hover:border-red-400 hover:shadow-xl hover:shadow-red-50 transition-all duration-300 relative overflow-hidden"
            >
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-red-100 transition-all" />

              {/* Top row */}
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg shadow-red-100 transition-transform group-hover:rotate-6">
                  <RefreshCw size={20} />
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-slate-300 uppercase block">Flagged</span>
                  <p className="text-[10px] font-bold text-black uppercase">
                    {new Date(item.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* File info */}
              <div className="space-y-4 mb-10 relative z-10">
                <h3 className="text-sm font-black text-black uppercase tracking-tight leading-tight line-clamp-2">
                  {item.resumeId?.originalName || "Unnamed_Batch_File"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-md text-[8px] font-black uppercase tracking-tighter">
                    <AlertCircle size={10} /> Rejected
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-md text-[8px] font-black uppercase tracking-tighter">
                    <Eye size={10} /> View Only
                  </div>
                </div>
              </div>

              {/* CTA — opens workspace in review/read-only mode */}
              <Link
                href={`/user/workspace/${item.resumeId?._id}?mode=review`}
                className="flex items-center justify-center gap-3 w-full bg-black text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all duration-300 shadow-md"
              >
                <Eye size={14} /> Review Data <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-24 text-center border-t border-slate-200 pt-12">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[1.5em]">
          DataTech Service · Quality Control
        </p>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(UserRejectedContent), { ssr: false });