"use client";

import { useState, useEffect, useCallback } from "react";
import { getResumes } from "@/app/actions/resume";
import { useAdminStore } from "@/store/useAdminStore"; // Connecting global pool states
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, ChevronLeft, ChevronRight, Eye,
  Database, Search, Loader2, X
} from "lucide-react";
import { passero, ubuntu, robotoSlab } from "@/lib/fonts";

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Decoupled input states stop pagination click delay cascades
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 5;

  // Sync keyboard inputs into a single debounced variable string
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Force reset boundary to index map on text mutation
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const loadData = useCallback(async (targetPage, currentSearch) => {
    setLoading(true);
    try {
      const result = await getResumes(targetPage, limit, currentSearch);
      if (result.success) {
        setResumes(result.data);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalResumes);
      }
    } catch (error) {
      console.error("Master Registry Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Fired strictly when page indices or verified debounced searches alter values
  useEffect(() => {
    loadData(page, debouncedSearch);
  }, [page, debouncedSearch, loadData]);

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
  };

  return (
    <div className={`p-6 md:p-10 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900 ${ubuntu.className}`}>

      {/* --- HEADER CONTROLS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className={`${robotoSlab.className} text-4xl font-black uppercase tracking-tight`}>
            Resume <span className="text-blue-600 font-light">Inventory</span>
          </h1>
          <p className="text-[9px] font-mono tracking-widest text-zinc-400 mt-1 uppercase">
            Centralized Asset Registry Storage Vault
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search resource assets..."
              className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs w-full md:w-72 font-semibold tracking-wide outline-none focus:border-black transition-all shadow-xs"
            />
            {searchInput && (
              <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 shrink-0 select-none">
            <Database size={12} className="text-blue-600" />
            <span className="text-[10px] font-mono font-black uppercase text-slate-500">{totalCount} Records</span>
          </div>
        </div>
      </div>

      {/* --- DATA VIEWS TABLE MATRIX --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden relative">

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/60 backdrop-blur-xs z-20 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-black" size={24} />
                <span className={`${passero.className} text-[9px] uppercase tracking-[3px] text-slate-400`}>Syncing Registry...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto min-h-[26rem]"> 
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 font-black uppercase tracking-widest text-[9px] text-slate-400 select-none">
                <th className="p-5 w-24">Token ID</th>
                <th className="p-5">Document Signature Target</th>
                <th className="p-5 w-44">Upload Date Stamp</th>
                <th className="p-5 w-32 text-center">Workload Hits</th>
                <th className="p-5 w-28 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <AnimatePresence mode="popLayout">
                {resumes.length > 0 ? (
                  resumes.map((res, i) => (
                    <motion.tr
                      key={res._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.99 }}
                      transition={{ duration: 0.15, delay: Math.min(i * 0.03, 0.15) }}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      <td className="p-5">
                        <span className="text-[9px] font-mono font-black text-blue-600 bg-blue-50/60 border border-blue-100 px-2 py-0.5 rounded">
                          RES-{String(res.resumeNo).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all shadow-xs">
                            <FileText size={14} />
                          </div>
                          <div className="flex flex-col max-w-xs md:max-w-md min-w-0">
                            <span className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{res.originalName}</span>
                            <span className="text-[8px] text-zinc-400 font-mono tracking-tighter truncate mt-0.5">Hash Key: {res.uniqueId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-[10px] font-mono font-bold text-slate-500 uppercase">
                        {new Date(res.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-5 text-center">
                        <span className="text-[9px] font-mono font-bold bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                          {res.totalHits || 0} Clicks
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <a
                          href={res.fileData || res.fileUrl} 
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-black border border-slate-200 hover:border-black bg-white px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-97 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span className="text-[9px] font-black uppercase tracking-wider">Open</span>
                        </a>
                      </td>
                    </motion.tr>
                  ))
                ) : !loading && (
                  <tr>
                    <td colSpan="5" className="p-32 text-center select-none">
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                        <Search size={32} />
                        <p className="text-[10px] font-mono font-black uppercase tracking-widest mt-1">No matching assets found in pool indexing registry</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* --- DUAL PAGINATION CONTROL LAYOUT --- */}
        <div className="p-5 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between select-none">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black disabled:opacity-20 disabled:hover:text-slate-400 transition-all group cursor-pointer"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Prev Block
          </button>

          <div className="hidden sm:flex items-center gap-1.5">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-[9px] font-mono font-black transition-all cursor-pointer ${page === i + 1
                    ? 'bg-black text-white shadow-xs scale-105'
                    : 'bg-white border border-slate-200 text-slate-400 hover:border-black hover:text-black'
                  }`}
              >
                {(i + 1).toString().padStart(2, "0")}
              </button>
            ))}
          </div>

          <button
            disabled={page === totalPages || loading}
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black disabled:opacity-20 disabled:hover:text-slate-400 transition-all group cursor-pointer"
          >
            Next Block <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}