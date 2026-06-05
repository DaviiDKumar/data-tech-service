"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getAdminSavedResumes, bulkUpdateResumeStatus } from "@/app/actions/admin";
import { passero, ubuntu, robotoSlab } from "@/lib/fonts";
import {
  Loader2, Search, FileText, CheckCircle,
  XCircle, ExternalLink, RefreshCcw,
  Download, ChevronLeft, ChevronRight, CheckSquare, Square
} from "lucide-react";
import Link from "next/link";

// Custom helper function to handle 3-way clean CSV creation and execution download
const executeCsvDownload = (dataset, reportTitle) => {
  if (!dataset || dataset.length === 0) {
    alert("No records found to generate CSV export payload.");
    return;
  }

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

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await getAdminSavedResumes();
      if (res.success) setItems(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

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
    const cleanSearch = search.trim().toLowerCase();

    let output = items.filter(item => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesUser = userFilter === "all" || item.userId?._id === userFilter;
      const matchesSearch =
        (item.userId?.name || "").toLowerCase().includes(cleanSearch) ||
        (item.resumeId?.originalName || "").toLowerCase().includes(cleanSearch);
      return matchesStatus && matchesUser && matchesSearch;
    });

    if (sortBy === "newest") {
      output.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sortBy === "oldest") {
      output.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
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

  // ✅ OPTIMIZED: Processes status changes instantly using local state mapping
  const handleBulkUpdate = async (status) => {
    if (!selected.length || !confirm(`Process ${selected.length} items as ${status.toUpperCase()}?`)) return;

    setLoading(true);
    const res = await bulkUpdateResumeStatus(selected, status);
    if (res.success) {
      // Local structural layout updates stop extra network lookups
      setItems(prevItems => prevItems.map(item => {
        if (selected.includes(item._id)) {
          return { ...item, status, updatedAt: new Date().toISOString() };
        }
        return item;
      }));
      setSelected([]);
    } else {
      alert("Database failed to process bulk status updates.");
    }
    setLoading(false);
  };

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
    <div className="h-screen flex flex-col items-center justify-center gap-3 bg-white text-black">
      <Loader2 className="animate-spin text-black" size={32} />
      <p className={`${passero.className} text-xs uppercase tracking-[4px] text-zinc-400`}>Accessing System Logs...</p>
    </div>
  );

  return (
    <div className={`p-6 md:p-10 max-w-[120rem] mx-auto min-h-screen bg-gray-50/50 text-black ${ubuntu.className}`}>

      {/* Header View Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 bg-transparent shrink-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center text-white shadow-xs">
              <RefreshCcw size={12} />
            </div>
            <span className="text-[9px] font-mono font-black uppercase tracking-[3px] text-zinc-400">Master Audit Logs</span>
          </div>
          <h1 className={`${robotoSlab.className} text-4xl font-black uppercase tracking-tight`}>
            Saved <span className="text-zinc-400 font-light">Drafts</span>
          </h1>
        </div>

        {/* Action Trigger Strip Bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm animate-in zoom-in-95 duration-200 w-full lg:w-auto justify-end">
            <div className="px-4 border-r border-zinc-100 hidden sm:block">
              <span className="text-xs font-black text-black italic">{selected.length} Selected</span>
            </div>
            <button onClick={() => handleBulkUpdate('approved')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 cursor-pointer transition-all">
              Approve
            </button>
            <button onClick={() => handleBulkUpdate('rejected')} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 cursor-pointer transition-all">
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Control Strip Config Panel Box */}
      <div className="bg-white border border-zinc-200 shadow-xs p-5 rounded-2xl mb-6 space-y-4 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-[9px] font-black uppercase tracking-wider w-fit">
            <span className="pl-2 pr-1 text-zinc-400">Select:</span>
            <button onClick={() => handleBulkSelectAmount("all")} className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-800 rounded-md hover:border-black cursor-pointer transition-all">All Matches</button>
            <button onClick={() => handleBulkSelectAmount("50")} className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-800 rounded-md hover:border-black cursor-pointer transition-all">Top 50</button>
            <button onClick={() => handleBulkSelectAmount("100")} className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-800 rounded-md hover:border-black cursor-pointer transition-all">Top 100</button>
            <button onClick={() => setSelected([])} className="px-2 py-1 text-rose-500 hover:bg-rose-50 rounded-md transition-all cursor-pointer">Clear</button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportSelectedOnly}
              disabled={selected.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-900 text-white disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              <Download size={11} /> Export Selected ({selected.length})
            </button>
            <button
              onClick={exportAllCurrentView}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              <Download size={11} /> Export View Set ({processedData.length})
            </button>
            <button
              onClick={exportAllForSpecificUser}
              disabled={userFilter === "all"}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 text-white disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              <Download size={11} /> Export Agent Data
            </button>
          </div>
        </div>

        {/* Matrix Filtering Dropdowns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-zinc-100 font-medium">
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 shrink-0">Agent Map:</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-[11px] font-bold rounded-xl px-3 py-2 outline-none focus:border-black transition-colors"
            >
              <option value="all">All Tele-callers / Workers</option>
              {uniqueUsersList.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 shrink-0">Status State:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-[11px] font-bold rounded-xl px-3 py-2 outline-none focus:border-black transition-colors"
            >
              <option value="all">All Processing States</option>
              <option value="in-progress">In-Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 shrink-0">Sort Step:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-[11px] font-bold rounded-xl px-3 py-2 outline-none focus:border-black transition-colors"
            >
              <option value="newest">Timestamp: Newest First</option>
              <option value="oldest">Timestamp: Oldest First</option>
              <option value="alphabetical">File Sequence Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Core Search Utility Block */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
        <input
          type="text"
          placeholder="SEARCH RECORDS VIA KEYWORDS..."
          className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-wider outline-none focus:border-black transition-all placeholder:text-zinc-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Brutalist Frame Structural Data Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden mb-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-20 flex items-center justify-center select-none">
            <Loader2 className="animate-spin text-black" size={24} />
          </div>
        )}
        <div className="overflow-x-auto min-h-[26rem]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 font-black uppercase tracking-widest text-[9px] text-zinc-400 select-none">
                <th className="px-5 py-4 w-12 text-center">
                  <button
                    onClick={() => handleBulkSelectAmount(selected.length === processedData.length ? "clear" : "all")}
                    className="cursor-pointer text-zinc-300 hover:text-black transition-colors"
                  >
                    {selected.length === processedData.length && processedData.length > 0 ? (
                      <CheckSquare size={14} className="text-black" />
                    ) : (
                      <Square size={14} />
                    )}
                  </button>
                </th>
                <th className="p-4">File Reference Details</th>
                <th className="p-4 w-64">Agent Workspace Identifier</th>
                <th className="p-4 w-32">State Status</th>
                <th className="p-4 w-20 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {paginatedData.map((item) => {
                const isSelected = selected.includes(item._id);
                return (
                  <tr key={item._id} className={`hover:bg-zinc-50/50 transition-colors ${isSelected ? 'bg-zinc-50' : ''}`}>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => toggleSelect(item._id)} className={`cursor-pointer ${isSelected ? 'text-black' : 'text-zinc-300'}`}>
                        {isSelected ? <CheckSquare size={14} fill="currentColor" /> : <Square size={14} />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText size={14} className="text-zinc-400 shrink-0" />
                        <div className="flex flex-col min-w-0 max-w-xs sm:max-w-md">
                          <span className="font-black uppercase tracking-tight text-zinc-900 truncate">{item.resumeId?.originalName || 'Anonymous_File.pdf'}</span>
                          <span className="text-[8px] font-mono text-zinc-400 select-all tracking-tighter mt-0.5 truncate">{item._id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col min-w-0 max-w-[220px]">
                        <span className="font-black uppercase text-zinc-900 truncate">{item.userId?.name || "Unassigned Operations"}</span>
                        <span className="text-[9px] font-mono text-zinc-400 truncate mt-0.5">{item.userId?.email || "---"}</span>
                      </div>
                    </td>
                    <td className="p-4 select-none">
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest
                        ${item.status === 'in-progress' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          item.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          item.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right select-none">
                      <Link
                        href={`/admin/review/${item._id}`}
                        className="p-1.5 inline-flex items-center justify-center bg-white border border-zinc-200 hover:border-black text-zinc-500 hover:text-black rounded-xl transition-all shadow-xs"
                      >
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {processedData.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-20 bg-white select-none">
                    <p className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-300">No matching tracking records found within this vector block</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Actions */}
        {totalPages > 1 && (
          <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between select-none">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black disabled:opacity-20 disabled:pointer-events-none transition-all rounded-lg cursor-pointer"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <span className="font-mono text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Block <span className="text-black font-bold">{currentPage}</span> of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black disabled:opacity-20 disabled:pointer-events-none transition-all rounded-lg cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}