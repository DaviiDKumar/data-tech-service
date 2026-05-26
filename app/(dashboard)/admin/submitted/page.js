"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from "react";
import { getAdminReports, bulkUpdateResumeStatus } from "@/app/actions/admin";
import { 
  CheckCircle, XCircle, Search, Filter, 
  FileText, ExternalLink, Loader2, Users, 
  CheckSquare, Square, RefreshCcw,
  ShieldCheck, Eye, Download, ChevronLeft, ChevronRight
} from "lucide-react";
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

function AdminSubmittedContent() {
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
        const res = await getAdminReports(["submitted", "approved", "rejected"]);
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

  const refreshData = async () => {
    setLoading(true);
    const res = await getAdminReports(["submitted", "approved", "rejected"]);
    if (res.success) setSubmissions(res.data);
    setLoading(false);
  };

  const uniqueUsersList = useMemo(() => {
    const userMap = new Map();
    submissions.forEach(item => {
      if (item.userId?._id && item.userId?.name) {
        userMap.set(item.userId._id, item.userId.name);
      }
    });
    return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));
  }, [submissions]);

  const processedData = useMemo(() => {
    let output = submissions.filter(item => {
      const matchesStatus = item.status === activeTab;
      const matchesUser = selectedUserFilter === "all" || item.userId?._id === selectedUserFilter;
      const matchesSearch = 
        item.resumeId?.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleAction = async (status) => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(`Update ${selectedIds.length} items to ${status.toUpperCase()}?`);
    if (!confirm) return;

    const res = await bulkUpdateResumeStatus(selectedIds, status);
    if (res.success) {
      setSelectedIds([]);
      refreshData();
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
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Master Database...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-400 mx-auto min-h-screen bg-slate-50/30 font-sans">
      
      {/* Header Grid Wrap */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl text-white shadow-xl">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Administrator</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-slate-900">
            Review <span className="text-blue-600">Portal</span>
          </h1>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-[2rem] border border-blue-100 shadow-2xl animate-in zoom-in duration-300">
            <div className="px-6 border-r border-slate-100">
               <span className="text-sm font-black text-blue-600 italic">{selectedIds.length} Selected</span>
            </div>
            <button onClick={() => handleAction('approved')} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all">
              <CheckCircle size={14} /> Approve
            </button>
            <button onClick={() => handleAction('rejected')} className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 transition-all">
              <XCircle size={14} /> Reject
            </button>
            <button onClick={() => handleAction('review')} className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-amber-600 transition-all">
              <RefreshCcw size={14} /> Review
            </button>
          </div>
        )}
      </div>

      {/* Control Panel Strip Box */}
      <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-[2rem] mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200/60 text-[9px] font-black uppercase tracking-wider">
            <span className="pl-3 pr-1 text-slate-400">Select Options:</span>
            <button onClick={() => handleBulkSelectAmount("all")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-full hover:bg-slate-900 hover:text-white transition-all">All Current</button>
            <button onClick={() => handleBulkSelectAmount("50")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-full hover:bg-slate-900 hover:text-white transition-all">Top 50</button>
            <button onClick={() => handleBulkSelectAmount("100")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-full hover:bg-slate-900 hover:text-white transition-all">Top 100</button>
            <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-rose-500 hover:bg-rose-50 rounded-full transition-all">Clear</button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={exportSelectedOnly} 
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
            >
              <Download size={12} /> Export Selected ({selectedIds.length})
            </button>
            <button 
              onClick={exportAllCurrentTab}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
            >
              <Download size={12} /> Export Tab Data ({processedData.length})
            </button>
            <button 
              onClick={exportAllForSpecificUser}
              disabled={selectedUserFilter === "all"}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
            >
              <Download size={12} /> Export Agent Set
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 pt-2 border-t border-slate-100">
          <div className="w-full md:w-1/3 flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Agent Map:</label>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Tele-callers / Workers</option>
              {uniqueUsersList.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/3 flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sort Sequence:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="newest">Timestamp: Newest First</option>
              <option value="oldest">Timestamp: Oldest First</option>
              <option value="alphabetical">File Identifier (A-Z)</option>
            </select>
          </div>
          
          <div className="w-full md:w-1/3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Matching Metrics: <span className="text-slate-900">{processedData.length} entries found</span>
          </div>
        </div>
      </div>

      {/* Tab Filter Headers */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            {["submitted", "approved", "rejected"].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); }}
                className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab} ({submissions.filter(s => s.status === tab).length})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 pr-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" placeholder="Search data details..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border-none rounded-full pl-12 pr-6 py-3 text-[11px] font-bold w-64 focus:ring-2 focus:ring-blue-100 transition-all"
                />
             </div>
          </div>
        </div>
      </div>

      {/* Main Render List */}
      <div className="grid gap-4 mb-8">
        {paginatedData.map((item) => {
          const isSelected = selectedIds.includes(item._id);
          return (
            <div 
              key={item._id} 
              className={`group bg-white border-2 rounded-[2.5rem] p-6 flex items-center justify-between transition-all duration-300 ${
                isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-white hover:border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-8">
                 <button onClick={() => toggleSelect(item._id)} className={`${isSelected ? 'text-blue-600' : 'text-slate-200 group-hover:text-slate-300'}`}>
                    {isSelected ? <CheckSquare size={24} fill="currentColor" /> : <Square size={24} />}
                 </button>

                 <div className={`p-5 rounded-2xl transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                    <FileText size={24} />
                 </div>

                 <div className="space-y-1">
                    <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight truncate max-w-md">
                      {item.resumeId?.originalName || "Unnamed_Entry.pdf"}
                    </h3>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                       <span className="text-blue-600">{item.userId?.name || "Unknown"}</span>
                       <span className="w-1 h-1 bg-slate-200 rounded-full" />
                       <span className="flex items-center gap-1"><Eye size={12}/> {item._id.slice(-6).toUpperCase()}</span>
                       <span className="w-1 h-1 bg-slate-200 rounded-full" />
                       <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <Link 
                  href={`/admin/review/${item._id}`}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all group/btn"
                 >
                    Inspect <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                 </Link>

                 {activeTab === 'submitted' && (
                   <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                      <button onClick={() => bulkUpdateResumeStatus([item._id], 'approved').then(() => refreshData())} className="p-3 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                        <CheckCircle size={20} />
                      </button>
                      <button onClick={() => bulkUpdateResumeStatus([item._id], 'rejected').then(() => refreshData())} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <XCircle size={20} />
                      </button>
                      <button onClick={() => bulkUpdateResumeStatus([item._id], 'review').then(() => refreshData())} className="p-3 text-amber-500 hover:bg-amber-50 rounded-xl transition-all font-black text-xs">
                        R
                      </button>
                   </div>
                 )}
              </div>
            </div>
          );
        })}

        {processedData.length === 0 && (
          <div className="text-center py-16 bg-white border rounded-[2.5rem] border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
            No pipeline records found matching these criteria.
          </div>
        )}
      </div>

      {/* Pagination Footer Elements */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-full shadow-sm max-w-md mx-auto">
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

export default dynamic(() => Promise.resolve(AdminSubmittedContent), { ssr: false });