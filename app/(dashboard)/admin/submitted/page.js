"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from "react";
import { getAdminReports, bulkUpdateResumeStatus } from "@/app/actions/admin";
import { 
  CheckCircle, XCircle, Search, Filter, 
  FileText, ExternalLink, Loader2, Users, 
  CheckSquare, Square, RefreshCcw,
  ShieldCheck, Eye
} from "lucide-react";
import Link from "next/link";

function AdminSubmittedContent() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("submitted");

  // --- FIXED: Load Data with Cancellation Logic (React 19 Safe) ---
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      // Direct call ki jagah pehle hi loading true hai humare state mein
      try {
        const res = await getAdminReports(["submitted", "approved", "rejected"]);
        if (!cancelled && res.success) {
          setSubmissions(res.data);
        }
      } catch (err) {
        console.error("Admin Fetch Error:", err);
      } finally {
        if (!cancelled) {
          // Wrap in timeout to move to next task queue if needed
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Refresh Logic (Manually triggered)
  const refreshData = async () => {
    setLoading(true);
    const res = await getAdminReports(["submitted", "approved", "rejected"]);
    if (res.success) setSubmissions(res.data);
    setLoading(false);
  };

  // 3. Filter Logic
  const filteredData = useMemo(() => {
    return submissions.filter(item => {
      const matchesStatus = item.status === activeTab;
      const matchesSearch = 
        item.resumeId?.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [submissions, activeTab, searchTerm]);

  // 4. Selection Logic
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) setSelectedIds([]);
    else setSelectedIds(filteredData.map(i => i._id));
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

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Master Database...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-400 mx-auto min-h-screen bg-slate-50/30 font-sans">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
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

        {/* Bulk Action Panel */}
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
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            {["submitted", "approved", "rejected"].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
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
                  type="text" placeholder="Search data..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border-none rounded-full pl-12 pr-6 py-3 text-[11px] font-bold w-64 focus:ring-2 focus:ring-blue-100 transition-all"
                />
             </div>
             <button onClick={toggleSelectAll} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all">
                {selectedIds.length === filteredData.length ? <CheckSquare className="text-blue-600" size={20}/> : <Square size={20}/>}
             </button>
          </div>
        </div>
      </div>

      {/* Grid Listing */}
      <div className="grid gap-4">
        {filteredData.map((item) => {
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
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminSubmittedContent), { ssr: false });