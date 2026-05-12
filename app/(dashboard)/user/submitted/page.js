"use client";

import { useState, useEffect, useMemo } from "react";
import { getSubmittedResumes } from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import {
  Search, Loader2, FileText, ChevronLeft, ChevronRight, Eye , BookMarked,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { passero } from "@/lib/fonts";



function SubmittedContent() {
  const userId = useUserStore((state) => state.user?.id);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let isSubscribed = true;
    async function fetchData() {
      try {
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

  const filtered = data.filter(item =>
    item.resumeId?.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-violet-600" size={32} />
      <p className="text-sm text-slate-500">Loading history...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-12  mx-auto min-h-screen ">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center ">
          <div className="p-3  rounded-2xl text-violet-600 ">
            <BookMarked size={22} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold  text-violet-600 ">
              All Your Submitted Resume Work
            </span>

          </div>
        </div>

        <div className="space-y-2">
          <h1 className={`${passero.className} text-6xl uppercase italic text-slate-900 leading-none tracking-tighter`}>
            All Submitted<span className="text-violet-600 drop-shadow-sm"> Resumes</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
            <span className="w-8 h-[2px] bg-violet-600" />
            All Your Submitted Resumes and their current status will be listed here for your reference and tracking.
          </p>
        </div>
      </div>

     <div className="space-y-6 mt-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-sm border-2 border-slate-100 shadow-sm">
  {/* Search Input Area */}
  <div className="relative w-full md:w-96">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
    <input
      type="text"
      placeholder="Search saved resumes..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        if (typeof setCurrentPage === 'function') setCurrentPage(1);
      }}
      className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-transparent focus:border-violet-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all outline-none"
    />
  </div>

  {/* Stats Area */}
  <div className="flex items-center gap-3">
    <div className="text-right">
     
      <p className={`${passero.className} text-3xl text-violet-600 leading-none`}>
        {filtered.length}
      </p>
    </div>
    
    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl shadow-inner">
      <BookMarked size={22} className={loading ? "animate-spin" : ""} />
    </div>
  </div>
</div>
      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">S.No</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Resume Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Resume ID</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Submitted Date</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length > 0 ? currentItems.map((item, index) => (
                <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500">{indexOfFirstItem + index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" />
                      <span className="font-medium text-slate-900 truncate max-w-[150px]">
                        {item.resumeId?.originalName || "document.pdf"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {item._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize ${getStatusStyle(item.status)}`}>
                      {item.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/user/workspace/${item.resumeId?._id}?mode=review`}
                      className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-800 font-medium"
                    >
                      <Eye size={14} /> View
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-slate-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-sm disabled:opacity-30 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 text-xs font-medium rounded-sm border transition-all ${
                    currentPage === i + 1 
                    ? 'bg-violet-600 border-violet-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-sm disabled:opacity-30 hover:bg-slate-50 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

// SSR disable karke export taaki Hydration aur Sync state ke saare errors khatam ho jayein
export default dynamic(() => Promise.resolve(SubmittedContent), { ssr: false });