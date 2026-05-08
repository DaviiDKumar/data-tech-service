"use client";

import { useState, useEffect } from "react";
// Updated imports per your request
import { getAdminSavedResumes, bulkUpdateResumeStatus } from "@/app/actions/admin";
import { passero } from "@/lib/fonts";
import { 
  Loader2, Search, FileText, CheckCircle, 
  XCircle, Filter, ExternalLink, RefreshCcw
} from "lucide-react";
import Link from "next/link";

export default function GlobalAuditPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  // Fix: Moved fetchData inside useEffect or wrapped in useCallback to prevent ESLint warnings
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

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulk = async (status) => {
    if (!selected.length || !confirm(`Process ${selected.length} items as ${status}?`)) return;
    
    setLoading(true);
    // Updated to use the requested action name
    const res = await bulkUpdateResumeStatus(selected, status); 
    if (res.success) {
      setSelected([]);
      // Trigger a fresh fetch
      const refresh = await getAdminSavedResumes();
      if (refresh.success) setItems(refresh.data);
    }
    setLoading(false);
  };

  const filtered = items.filter(item => 
    item.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.resumeId?.originalName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && items.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white text-black">
      <Loader2 className="animate-spin" size={40} />
      <p className={`${passero.className} text-[10px] uppercase tracking-[5px]`}>Accessing Logs...</p>
    </div>
  );

  return (
    <div className="p-8 md:p-12 bg-gray-50 min-h-screen font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                <RefreshCcw size={16} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Audit Logs</span>
          </div>
          <h1 className={`${passero.className} text-6xl uppercase tracking-tighter text-black leading-none italic`}>
            Saved <span className="text-zinc-300">Drafts</span>
          </h1>
        </div>

        {/* Floating Bulk Action Bar - Fixed z-index per Tailwind suggestion */}
        {selected.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-100 flex items-center gap-6 bg-black text-white px-8 py-5 rounded-[2.5rem] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-10">
            <span className="text-[10px] font-black uppercase tracking-widest border-r border-white/20 pr-6">
              {selected.length} Selected
            </span>
            <div className="flex gap-3">
              <button onClick={() => handleBulk('approved')} className="flex items-center gap-2 bg-emerald-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all">
                <CheckCircle size={14} /> Approve
              </button>
              <button onClick={() => handleBulk('rejected')} className="flex items-center gap-2 bg-red-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all">
                <XCircle size={14} /> Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 md:col-span-8 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH BY USER OR FILENAME..."
            className="w-full bg-white border-2 border-slate-200 rounded-2xl py-5 pl-16 pr-8 text-[11px] font-black uppercase tracking-widest outline-none focus:border-black transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-span-12 md:col-span-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center gap-4 px-6">
           <Filter size={18} className="text-slate-400" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Records: {filtered.length}</span>
        </div>
      </div>

      {/* Table Interface */}
      <div className="bg-white border-2 border-black rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black text-white text-[9px] font-black uppercase tracking-[3px]">
            <tr>
              <th className="p-8 w-16 text-center">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-zinc-500"
                  onChange={(e) => setSelected(e.target.checked ? filtered.map(i => i._id) : [])}
                />
              </th>
              <th className="p-8">File Name</th>
              <th className="p-8">User</th>
              <th className="p-8">Status</th>
              <th className="p-8 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-black">
            {filtered.map((item) => (
              <tr key={item._id} className={`group hover:bg-zinc-50 transition-colors ${selected.includes(item._id) ? 'bg-zinc-50' : ''}`}>
                <td className="p-8 text-center">
                  <input 
                    type="checkbox" 
                    checked={selected.includes(item._id)} 
                    onChange={() => toggleSelect(item._id)}
                    className="w-5 h-5 accent-black rounded-lg"
                  />
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-4">
                    <FileText size={18} className="text-slate-400" />
                    <span className="text-[11px] font-black uppercase tracking-tight truncate max-w-[200px]">{item.resumeId?.originalName || 'Anonymous'}</span>
                  </div>
                </td>
                <td className="p-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase">{item.userId?.name}</span>
                    <span className="text-[8px] font-medium text-slate-400">{item.userId?.email}</span>
                  </div>
                </td>
                <td className="p-8">
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border
                    ${item.status === 'in-progress' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      'bg-zinc-100 text-black border-black'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-8 text-right">
                   <Link 
                    href={`/admin/user/${item.userId?._id}`}
                    className="p-3 inline-flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl hover:bg-black hover:text-white transition-all"
                   >
                     <ExternalLink size={14} />
                   </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}