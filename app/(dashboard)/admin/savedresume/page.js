"use client";

import { useState, useEffect, useMemo } from "react";
import { getAdminSavedResumes, bulkUpdateResumeStatus } from "@/app/actions/admin";
import { passero } from "@/lib/fonts";
import { 
  Loader2, Search, FileText, CheckCircle, 
  XCircle, Filter, ExternalLink, RefreshCcw,
  Download, ChevronLeft, ChevronRight, CheckSquare, Square
} from "lucide-react";
import Link from "next/link";

// Custom helper function to handle 3-way clean CSV creation and execution download
const executeCsvDownload = (dataset, reportTitle) => {
  if (!dataset || dataset.length === 0) {
    alert("No records found to generate CSV export payload.");
    return;
  }
  
  // Full structural header mapping matching all user input keys
  const headers = [
    "Record ID,Resume ID,User ID,File Name,Agent Name,Status,Last Updated,First Name,Middle Name,Last Name,D.O.B,Gender,Nationality,Marital Status,Passport,Hobbies,Languages,Address,Landmark,City,State,Pincode,Mobile,Email,SSC Result,SSC Board,SSC Year,HSC Result,HSC Board,HSC Year,Grad Degree,Grad Result\n"
  ];

  const rows = dataset.map(item => {
    const f = item.formData || {};
    return `"${item._id || ''}","${item.resumeId?._id || item.resumeId || ''}","${item.userId?._id || item.userId || ''}","${item.resumeId?.originalName || 'N/A'}","${item.userId?.name || 'Unassigned'}","${item.status}","${new Date(item.updatedAt).toLocaleDateString()}","${f.firstName || ''}","${f.middleName || ''}","${f.lastName || ''}","${f.dob || ''}","${f.gender || ''}","${f.nationality || ''}","${f.maritalStatus || ''}","${f.passport || ''}","${f.hobbies || ''}","${f.languages || ''}","${f.address || ''}","${f.landmark || ''}","${f.city || ''}","${f.state || ''}","${f.pincode || ''}","${f.mobile || ''}","${f.email || ''}","${f.sscResult || ''}","${f.sscBoard || ''}","${f.sscYear || ''}","${f.hscResult || ''}","${f.hscBoard || ''}","${f.hscYear || ''}","${f.gradDegree || ''}","${f.gradResult || ''}"`;
  });

  const blob = new Blob([headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${reportTitle}_Export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function GlobalAuditPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await getAdminSavedResumes();
      if (res.success) setItems(res.data);
    } catch (err) {
      console.error("Refresh Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const res = await getAdminSavedResumes();
        if (isMounted && res.success) {
          setItems(res.data);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Compile unique agents from datasets dynamically
  const uniqueUsersList = useMemo(() => {
    const userMap = new Map();
    items.forEach(item => {
      if (item.userId?._id && item.userId?.name) {
        userMap.set(item.userId._id, item.userId.name);
      }
    });
    return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  // Unified Multi-Filter & Sorting Logic Engine
  const processedData = useMemo(() => {
    let output = items.filter(item => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesUser = userFilter === "all" || item.userId?._id === userFilter;
      const matchesSearch = 
        item.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.resumeId?.originalName?.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesUser && matchesSearch;
    });

    if (sortBy === "newest") {
      output.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sortBy === "oldest") {
      output.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    } else if (sortBy === "alphabetical") {
      output.sort((a, b) => (a.resumeId?.originalName || "").localeCompare(b.resumeId?.originalName || ""));
    }
    return output;
  }, [items, search, statusFilter, userFilter, sortBy]);

  // Paginated View Slice
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage) || 1;

  // Track layout resets when parameter changes occur
  useEffect(() => {
    setCurrentPage(1);
    setSelected([]);
  }, [search, statusFilter, userFilter, sortBy]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkSelectAmount = (amount) => {
    if (amount === "all") {
      setSelected(processedData.map(i => i._id));
    } else {
      const targetCount = parseInt(amount, 10);
      setSelected(processedData.slice(0, targetCount).map(i => i._id));
    }
  };

  const handleBulkUpdate = async (status) => {
    if (!selected.length || !confirm(`Process ${selected.length} items as ${status.toUpperCase()}?`)) return;
    
    setLoading(true);
    const res = await bulkUpdateResumeStatus(selected, status); 
    if (res.success) {
      setSelected([]);
      const refresh = await getAdminSavedResumes();
      if (refresh.success) setItems(refresh.data);
    }
    setLoading(false);
  };

  // --- 3-WAY EXPORT CONTROLLERS ---
  const exportSelectedOnly = () => {
    const targetData = items.filter(item => selected.includes(item._id));
    executeCsvDownload(targetData, "Selected_Draft_Resumes");
  };

  const exportAllCurrentView = () => {
    executeCsvDownload(processedData, "Filtered_Draft_Resumes");
  };

  const exportAllForSpecificUser = () => {
    if (userFilter === "all") {
      alert("Please select a specific agent workspace folder dropdown view first.");
      return;
    }
    const targetUser = uniqueUsersList.find(u => u.id === userFilter);
    executeCsvDownload(processedData, `Drafts_For_${targetUser?.name || 'Agent'}`);
  };

  if (loading && items.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white text-black">
      <Loader2 className="animate-spin" size={40} />
      <p className={`${passero.className} text-[10px] uppercase tracking-[5px]`}>Accessing System Logs...</p>
    </div>
  );

  return (
    <div className="p-8 md:p-12 bg-gray-50 min-h-screen font-sans">
      
      {/* Header View Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                <RefreshCcw size={16} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Master Audit Logs</span>
          </div>
          <h1 className={`${passero.className} text-6xl uppercase tracking-tighter text-black leading-none italic`}>
            Saved <span className="text-zinc-400">Drafts</span>
          </h1>
        </div>

        {/* Action Trigger Strip Bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-[2rem] border border-neutral-200 shadow-2xl animate-in zoom-in duration-300">
            <div className="px-6 border-r border-slate-100">
               <span className="text-sm font-black text-black italic">{selected.length} Selected</span>
            </div>
            <button onClick={() => handleBulkUpdate('approved')} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all">
              <CheckCircle size={14} /> Approve
            </button>
            <button onClick={() => handleBulkUpdate('rejected')} className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 transition-all">
              <XCircle size={14} /> Reject
            </button>
          </div>
        )}
      </div>

      {/* Control Strip Config Panel Box */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-[2rem] mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Internal Quick Selections */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200 text-[9px] font-black uppercase tracking-wider">
            <span className="pl-3 pr-1 text-slate-400">Select:</span>
            <button onClick={() => handleBulkSelectAmount("all")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-full hover:bg-slate-900 hover:text-white transition-all">All Matches</button>
            <button onClick={() => handleBulkSelectAmount("50")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-full hover:bg-slate-900 hover:text-white transition-all">Top 50</button>
            <button onClick={() => handleBulkSelectAmount("100")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-full hover:bg-slate-900 hover:text-white transition-all">Top 100</button>
            <button onClick={() => setSelected([])} className="px-3 py-1.5 text-rose-500 hover:bg-rose-50 rounded-full transition-all">Clear</button>
          </div>

          {/* 3-Way CSV Download Export Action Clusters */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={exportSelectedOnly} 
              disabled={selected.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
            >
              <Download size={12} /> Export Selected ({selected.length})
            </button>
            <button 
              onClick={exportAllCurrentView}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
            >
              <Download size={12} /> Export View Set ({processedData.length})
            </button>
            <button 
              onClick={exportAllForSpecificUser}
              disabled={userFilter === "all"}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
            >
              <Download size={12} /> Export Agent Data
            </button>
          </div>
        </div>

        {/* Matrix Filtering Dropdowns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Agent Map:</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="all">All Tele-callers / Workers</option>
              {uniqueUsersList.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Status State:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="all">All Processing States</option>
              <option value="in-progress">In-Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Sort Step:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="newest">Timestamp: Newest First</option>
              <option value="oldest">Timestamp: Oldest First</option>
              <option value="alphabetical">File Sequence Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Core Search Utility Block */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH RECORDS VIA KEYWORDS..."
            className="w-full bg-white border-2 border-slate-200 rounded-2xl py-5 pl-16 pr-8 text-[11px] font-black uppercase tracking-widest outline-none focus:border-black transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Brutalist Frame Structural Data Table */}
      <div className="bg-white border-2 border-black rounded-[3rem] overflow-hidden shadow-xl mb-8">
        <table className="w-full text-left">
          <thead className="bg-black text-white text-[9px] font-black uppercase tracking-[3px]">
            <tr>
              <th className="p-6 w-16 text-center">
                <button 
                  onClick={() => handleBulkSelectAmount(selected.length === processedData.length ? "clear" : "all")}
                  className="text-white hover:text-neutral-300 transition-colors"
                >
                  {selected.length === processedData.length && processedData.length > 0 ? (
                    <CheckSquare size={20} />
                  ) : (
                    <Square size={20} />
                  )}
                </button>
              </th>
              <th className="p-6">File Reference Details</th>
              <th className="p-6">Agent Workspace Identifier</th>
              <th className="p-6">State Status</th>
              <th className="p-6 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-black font-sans">
            {paginatedData.map((item) => {
              const isSelected = selected.includes(item._id);
              return (
                <tr key={item._id} className={`group hover:bg-zinc-50/50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-6 text-center">
                    <button onClick={() => toggleSelect(item._id)} className={isSelected ? 'text-blue-600' : 'text-slate-200 group-hover:text-slate-400'}>
                      {isSelected ? <CheckSquare size={20} fill="currentColor" /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <FileText size={18} className="text-slate-400" />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black uppercase tracking-tight text-neutral-800 truncate max-w-xs">{item.resumeId?.originalName || 'Anonymous_File.pdf'}</span>
                        <span className="text-[9px] font-mono text-neutral-400 select-all">{item._id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-neutral-800">{item.userId?.name || "Unassigned"}</span>
                      <span className="text-[9px] font-mono text-slate-400">{item.userId?.email || "---"}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border
                      ${item.status === 'in-progress' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                        item.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        item.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                        'bg-zinc-100 text-black border-black'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                     {/* Links safely to the shared Audit review component screen folder matching */}
                     <Link 
                      href={`/admin/review/${item._id}`}
                      className="p-3 inline-flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl hover:bg-black hover:text-white transition-all"
                     >
                        <ExternalLink size={14} />
                     </Link>
                  </td>
                </tr>
              );
            })}

           {processedData.length === 0 && (
  <tr>
    <td colSpan={5} className="text-center py-16 text-slate-400 text-xs font-black uppercase tracking-widest border-dashed border-2 border-neutral-200 bg-white">
      No tracking records found matching parameters.
    </td>
  </tr>
)}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Actions */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-full shadow-sm max-w-md mx-auto">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-20 disabled:pointer-events-none transition-all rounded-full"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-widest">
            Page <span className="text-slate-900">{currentPage}</span> of {totalPages}
          </span>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-20 disabled:pointer-events-none transition-all rounded-full"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}