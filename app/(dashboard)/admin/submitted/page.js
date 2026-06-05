"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getAdminReports, bulkUpdateResumeStatus } from "@/app/actions/admin";
import { 
  CheckCircle, XCircle, Search, 
  FileText, ExternalLink, Loader2, 
  CheckSquare, Square, RefreshCcw,
  ShieldCheck, Eye, Download, ChevronLeft, ChevronRight
} from "lucide-react";
import { robotoSlab } from "@/lib/fonts";
import Link from "next/link";

// 3-way pure CSV distribution generator handling every explicit schema property
const executeCsvDownload = (dataset, reportTitle) => {
  if (!dataset || dataset.length === 0) {
    alert("No records found to generate CSV download.");
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

export default function AdminSubmittedContent() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState("submitted");
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await getAdminReports(["submitted", "approved", "rejected", "review"]);
        if (!cancelled && res.success) {
          setSubmissions(res.data);
        }
      } catch (err) {
        console.error("Admin Fetch Error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const uniqueUsersList = useMemo(() => {
    const userMap = new Map();
    submissions.forEach(item => {
      if (item.userId?._id && item.userId?.name) {
        userMap.set(item.userId._id, item.userId.name);
      }
    });
    return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));
  }, [submissions]);

  // ✅ OPTIMIZED: Memoized collection counts prevent typing performance leaks entirely
  const tabCounts = useMemo(() => {
    const counts = { submitted: 0, approved: 0, rejected: 0, review: 0 };
    submissions.forEach(s => {
      if (counts[s.status] !== undefined) counts[s.status]++;
    });
    return counts;
  }, [submissions]);

  const processedData = useMemo(() => {
    const cleanSearch = searchTerm.toLowerCase().trim();
    
    let output = submissions.filter(item => {
      const matchesStatus = item.status === activeTab;
      const matchesUser = selectedUserFilter === "all" || item.userId?._id === selectedUserFilter;
      const matchesSearch = 
        (item.resumeId?.originalName || "").toLowerCase().includes(cleanSearch) || 
        (item.userId?.name || "").toLowerCase().includes(cleanSearch);
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
  }, [submissions, activeTab, selectedUserFilter, searchTerm, sortBy]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, selectedUserFilter, searchTerm, sortBy]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkSelectAmount = (amount) => {
    if (amount === "all") {
      setSelectedIds(processedData.map(i => i._id));
    } else {
      const targetCount = parseInt(amount, 10);
      setSelectedIds(processedData.slice(0, targetCount).map(i => i._id));
    }
  };

  // ✅ OPTIMIZED: Mutates row status items inline locally to stop forced network re-fetching
  const handleAction = async (status, specifiedIds = null) => {
    const targetIds = specifiedIds || selectedIds;
    if (targetIds.length === 0) return;

    if (!specifiedIds) {
      const confirm = window.confirm(`Update ${targetIds.length} items to ${status.toUpperCase()}?`);
      if (!confirm) return;
    }

    const res = await bulkUpdateResumeStatus(targetIds, status);
    if (res.success) {
      setSubmissions(prev => prev.map(item => {
        if (targetIds.includes(item._id)) {
          return { ...item, status, updatedAt: new Date().toISOString() };
        }
        return item;
      }));
      setSelectedIds([]);
    } else {
      alert("System failed to process status state modifications.");
    }
  };

  const exportSelectedOnly = () => {
    const targetData = submissions.filter(item => selectedIds.includes(item._id));
    executeCsvDownload(targetData, "Selected_Resumes");
  };

  const exportAllCurrentTab = () => {
    executeCsvDownload(processedData, `All_${activeTab}_Resumes`);
  };

  const exportAllForSpecificUser = () => {
    if (selectedUserFilter === "all") {
      alert("Please select a specific agent from the dropdown filter first.");
      return;
    }
    const targetUser = uniqueUsersList.find(u => u.id === selectedUserFilter);
    executeCsvDownload(processedData, `Data_For_${targetUser?.name || 'Agent'}`);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={32} />
      <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-zinc-400">Syncing Master Database...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-[120rem] mx-auto min-h-screen bg-slate-50/30 font-sans text-black">
      
      {/* Header Grid Wrap */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-black rounded-lg text-white shadow-sm">
              <ShieldCheck size={14} />
            </div>
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.4em] text-blue-600">Operations Control</span>
          </div>
          <h1 className={`${robotoSlab.className} text-4xl font-black uppercase tracking-tight`}>
            Review <span className="text-blue-600 font-light">Portal</span>
          </h1>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm animate-in zoom-in-95 duration-200 w-full lg:w-auto justify-end">
            <div className="px-4 border-r border-zinc-100 hidden sm:block">
               <span className="text-xs font-black text-blue-600 italic">{selectedIds.length} Selected</span>
            </div>
            <button onClick={() => handleAction('approved')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 cursor-pointer transition-all">
              Approve
            </button>
            <button onClick={() => handleAction('rejected')} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 cursor-pointer transition-all">
              Reject
            </button>
            <button onClick={() => handleAction('review')} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 cursor-pointer transition-all">
              Review
            </button>
          </div>
        )}
      </div>

      {/* Control Panel Strip Box */}
      <div className="bg-white border border-zinc-200 shadow-xs p-5 rounded-2xl mb-6 space-y-4 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-[9px] font-black uppercase tracking-wider w-fit">
            <span className="pl-2 pr-1 text-zinc-400">Flags:</span>
            <button onClick={() => handleBulkSelectAmount("all")} className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-800 rounded-md hover:border-black cursor-pointer transition-all">All Current</button>
            <button onClick={() => handleBulkSelectAmount("50")} className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-800 rounded-md hover:border-black cursor-pointer transition-all">Top 50</button>
            <button onClick={() => handleBulkSelectAmount("100")} className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-800 rounded-md hover:border-black cursor-pointer transition-all">Top 100</button>
            <button onClick={() => setSelectedIds([])} className="px-2 py-1 text-rose-500 hover:bg-rose-50 rounded-md transition-all cursor-pointer">Clear</button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={exportSelectedOnly} 
              disabled={selectedIds.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-900 text-white disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              <Download size={11} /> Export Selected ({selectedIds.length})
            </button>
            <button 
              onClick={exportAllCurrentTab}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              <Download size={11} /> Export Tab Data ({processedData.length})
            </button>
            <button 
              onClick={exportAllForSpecificUser}
              disabled={selectedUserFilter === "all"}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 text-white disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              <Download size={11} /> Export Agent Set
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 pt-3 border-t border-zinc-100 font-medium">
          <div className="w-full md:w-1/3 flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 shrink-0">Agent Map:</label>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-[11px] font-bold rounded-xl px-3 py-2 outline-none focus:border-black transition-colors"
            >
              <option value="all">All Tele-callers / Workers</option>
              {uniqueUsersList.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/3 flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 shrink-0">Sequence:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-[11px] font-bold rounded-xl px-3 py-2 outline-none focus:border-black transition-colors"
            >
              <option value="newest">Timestamp: Newest First</option>
              <option value="oldest">Timestamp: Oldest First</option>
              <option value="alphabetical">File Identifier (A-Z)</option>
            </select>
          </div>
          
          <div className="w-full md:w-1/3 text-left md:text-right text-[9px] font-mono font-black text-zinc-400 uppercase tracking-widest">
            Matching Metrics: <span className="text-zinc-900 font-sans text-xs">{processedData.length} entries located</span>
          </div>
        </div>
      </div>

      {/* Tab Filter Headers */}
      <div className="flex flex-col gap-4 mb-6 select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-2 rounded-2xl border border-zinc-200 shadow-xs gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {["submitted", "approved", "rejected", "review"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                  activeTab === tab 
                    ? 'bg-black text-white shadow-xs' 
                    : 'text-zinc-400 hover:text-black hover:bg-zinc-50'
                }`}
              >
                {tab} ({tabCounts[tab]})
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64 pr-0 md:pr-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" placeholder="Search parameters..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-wider outline-none focus:border-black transition-all placeholder:text-zinc-300"
            />
          </div>
        </div>
      </div>

      {/* Main Render List */}
      <div className="space-y-3 mb-6">
        {paginatedData.map((item) => {
          const isSelected = selectedIds.includes(item._id);
          return (
            <div 
              key={item._id} 
              className={`bg-white border-2 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${
                isSelected ? 'border-black bg-zinc-50/50' : 'border-zinc-100 hover:border-zinc-300 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                 <button onClick={() => toggleSelect(item._id)} className={`cursor-pointer shrink-0 ${isSelected ? 'text-black' : 'text-zinc-300 hover:text-zinc-400'}`}>
                    {isSelected ? <CheckSquare size={18} fill="currentColor" /> : <Square size={18} />}
                 </button>

                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-black border-black text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 group-hover:bg-black group-hover:text-white'}`}>
                    <FileText size={16} />
                 </div>

                 <div className="space-y-0.5 min-w-0">
                    <h3 className="font-black text-zinc-900 uppercase text-xs tracking-tight truncate max-w-md">
                      {item.resumeId?.originalName || "Unnamed_Entry.pdf"}
                    </h3>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono font-bold uppercase tracking-wide text-zinc-400">
                       <span className="text-black font-sans font-black tracking-normal">{item.userId?.name || "Unknown Operator"}</span>
                       <span className="text-zinc-300 shrink-0">|</span>
                       <span className="flex items-center gap-0.5"><Eye size={10}/> {item._id.slice(-6).toUpperCase()}</span>
                       <span className="text-zinc-300 shrink-0">|</span>
                       <span>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
                 <Link 
                  href={`/admin/review/${item._id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl text-[9px] font-black uppercase tracking-wider hover:border-black transition-all"
                 >
                  Inspect <ExternalLink size={11} />
                 </Link>

                 {activeTab === 'submitted' && (
                   <div className="flex items-center gap-1 border-l border-zinc-200 pl-3">
                      <button onClick={() => handleAction('approved', [item._id])} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer" title="Approve Entry">
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => handleAction('rejected', [item._id])} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" title="Reject Entry">
                        <XCircle size={16} />
                      </button>
                      <button onClick={() => handleAction('review', [item._id])} className="w-8 h-8 flex items-center justify-center text-amber-500 hover:bg-amber-50 rounded-lg font-mono font-black text-xs border border-transparent hover:border-amber-200 transition-all cursor-pointer" title="Flag for Review">
                        R
                      </button>
                   </div>
                 )}
              </div>
            </div>
          );
        })}

        {processedData.length === 0 && (
          <div className="text-center py-16 bg-white border-2 border-dashed rounded-2xl border-zinc-200 p-6 select-none">
            <p className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-300">No matching tracking tokens found within this vector segment</p>
          </div>
        )}
      </div>

      {/* Pagination Footer Elements */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-zinc-200 p-4 rounded-xl shadow-xs max-w-sm mx-auto select-none">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 text-zinc-500 hover:text-black hover:bg-zinc-50 disabled:opacity-20 disabled:pointer-events-none transition-all rounded-lg cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="font-mono text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Block <span className="text-black font-bold">{currentPage}</span> of {totalPages}
          </span>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 text-zinc-500 hover:text-black hover:bg-zinc-50 disabled:opacity-20 disabled:pointer-events-none transition-all rounded-lg cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

    </div>
  );
}