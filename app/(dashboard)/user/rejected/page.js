"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { getRejectedResumes } from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import { 
  AlertCircle, FileText, RefreshCw, Loader2, 
  Search, XCircle, ArrowRight, History 
} from "lucide-react";
import Link from "next/link";

function UserRejectedContent() {
  const userId = useUserStore((state) => state.user?.id);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      const timer = setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 0);
      return () => { cancelled = true; clearTimeout(timer); };
    }

    async function fetchData() {
      try {
        const res = await getRejectedResumes(userId);
        if (!cancelled && res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setTimeout(() => setLoading(false), 0);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [userId]);

  const filtered = data.filter(item => 
    item.resumeId?.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-red-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Rejected Files...</p>
    </div>
  );

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto min-h-screen bg-white font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-xl text-white shadow-lg shadow-red-100">
              <XCircle size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600">Rejection Logs</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
            Needs <span className="text-red-600">Rework</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
            <span className="w-12 h-px bg-slate-200"></span> Correct the highlighted errors and resubmit
          </p>
        </div>

        <div className="flex items-center gap-4 bg-red-50 px-8 py-5 rounded-[2.5rem] border border-red-100 shadow-sm">
          <div className="text-center">
            <span className="block text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Total Rejected</span>
            <span className="text-3xl font-black text-red-600 italic leading-none">{data.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-10 group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search rejected files..." 
          className="w-full bg-slate-50 border-none rounded-full py-5 pl-16 pr-8 text-sm font-bold focus:ring-4 focus:ring-red-100 transition-all outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[4rem] py-32 text-center">
          <History className="mx-auto text-slate-200 mb-6" size={48} />
          <h3 className="text-slate-900 font-black uppercase text-sm tracking-widest italic">All Clear</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">No resumes are currently rejected</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((item) => (
            <div key={item._id} className="group relative bg-white border-2 border-slate-50 p-8 rounded-[3.5rem] hover:border-red-500 hover:shadow-2xl hover:shadow-red-100/50 transition-all duration-500">
              
              <div className="flex items-start justify-between mb-8">
                <div className="p-5 bg-red-600 text-white rounded-[1.5rem] shadow-xl shadow-red-200 transition-transform duration-500 group-hover:scale-110">
                  <RefreshCw size={24} />
                </div>
                <div className="text-right">
                  <span className="block text-[8px] font-black text-slate-300 uppercase italic">Rejected On</span>
                  <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                    {new Date(item.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-red-600 transition-colors">
                  {item.resumeId?.originalName || "Rejected_File.pdf"}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                    <AlertCircle size={10} /> Needs Correction
                  </div>
                </div>
              </div>

              {/* REWORK BUTTON: Seedha workspace mein le jayega purane data ke sath */}
              <Link 
                href={`/user/workspace/${item.resumeId?._id}`}
                className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:bg-red-600 transition-all duration-300"
              >
                Rework Extraction <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Decorative Red Dot */}
              <div className="absolute top-8 right-8 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      )}

      <p className="mt-20 text-center text-[9px] font-black text-slate-200 uppercase tracking-[1em]">
        End of Rework List
      </p>
    </div>
  );
}

export default dynamic(() => Promise.resolve(UserRejectedContent), { ssr: false });