"use client";
import { useState, useEffect, useCallback } from "react";
import { getResumes } from "@/app/actions/resume";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Database, 
  Search, 
  Loader2, 
  X 
} from "lucide-react";

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 5;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getResumes(page, limit, search);
      if (result.success) {
        setResumes(result.data);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalResumes);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      // Chhota sa delay smoother feel ke liye
      setTimeout(() => setLoading(false), 300);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [loadData]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            Resume <span className="text-blue-600">Inventory</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
            Centralized Data Management System
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search assets..."
              className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm w-64 md:w-80 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2">
            <Database size={14} className="text-blue-600" />
            <span className="text-xs font-black">{totalCount} Records</span>
          </div>
        </div>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden relative">
        
        {/* Loader Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-500">Syncing Engine...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto min-h-112.5"> {/* Fixed Min-Height to stop jerking */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-widest text-[10px] text-slate-400">
                <th className="p-5">ID</th>
                <th className="p-5">Document Name</th>
                <th className="p-5">Upload Date</th>
                <th className="p-5 text-center">Hits</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic">
              <AnimatePresence mode="popLayout">
                {resumes.length > 0 ? (
                  resumes.map((res, i) => (
                    <motion.tr 
                      key={res._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                      className="hover:bg-blue-50/50 transition-colors group"
                    >
                      <td className="p-5">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          RES-{String(res.resumeNo).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <FileText size={18} />
                          </div>
                          <div className="flex flex-col max-w-50">
                            <span className="text-sm font-bold text-slate-800 truncate">{res.originalName}</span>
                            <span className="text-[8px] text-slate-400 font-mono uppercase tracking-tighter opacity-60">UID: {res.uniqueId.slice(0, 18)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-[11px] font-bold text-slate-500 uppercase">
                        {new Date(res.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-5 text-center">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
                          {res.totalHits} Clicks
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <a 
                          href={res.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl transition-all border border-blue-100 shadow-sm active:scale-95"
                        >
                          <Eye size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Open</span>
                        </a>
                      </td>
                    </motion.tr>
                  ))
                ) : !loading && (
                  <tr>
                    <td colSpan="5" className="p-32 text-center opacity-20">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={40} />
                        <p className="text-xs font-black uppercase tracking-[5px]">Data Not Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION --- */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <button 
            disabled={page === 1 || loading}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-20 hover:text-blue-600 transition-all group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Previous
          </button>

          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                  page === i + 1 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-110' 
                  : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            disabled={page === totalPages || loading}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-20 hover:text-blue-600 transition-all group"
          >
            Next <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}