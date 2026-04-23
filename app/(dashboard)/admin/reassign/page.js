"use client";
import { useState, useEffect, useMemo } from "react";
import { getAllUsers, getReassignableResumes, executeBulkReassign } from "@/app/actions/admin";
import { passero, robotoSlab } from "@/lib/fonts";
import { toast } from "sonner";
import { 
  Users, FileText, Lock, CheckCircle, 
  Loader2, Zap, Search, Square, CheckSquare,
  ShieldAlert, MousePointer2, ArrowRight, ShieldCheck
} from "lucide-react";

export default function AdminReassignPage() {
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedResumes, setSelectedResumes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Load Workforce on Mount
  useEffect(() => {
    async function init() {
      try {
        const res = await getAllUsers();
        if (res.success) setUsers(res.data);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Load Resumes when User is selected
  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setSelectedResumes([]); 
    setResumesLoading(true);
    try {
      const res = await getReassignableResumes(user._id);
      if (res.success) {
        setResumes(res.data);
      } else {
        toast.error("Failed to sync resume pool.");
      }
    } finally {
      setResumesLoading(false);
    }
  };

  // 3. Selection Toggle
  const toggleResume = (resume) => {
    if (resume.isLocked) return;
    setSelectedResumes(prev => {
      const exists = prev.find(r => r._id === resume._id);
      return exists ? prev.filter(r => r._id !== resume._id) : [...prev, resume];
    });
  };

  // 4. Execution Logic
  const handleFinalReassign = async () => {
    if (!selectedUser || selectedResumes.length === 0) return;
    
    setActionLoading(true);
    try {
      const res = await executeBulkReassign(selectedUser._id, selectedResumes);
      if (res.success) {
        toast.success(`Allocated ${selectedResumes.length} nodes to ${selectedUser.name}`);
        setSelectedResumes([]);
        handleUserSelect(selectedUser); // Refresh to lock assigned items
      } else {
        toast.error(res.error || "Execution failed.");
      }
    } catch (err) {
      toast.error("Critical System Error during reassign.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredResumes = useMemo(() => {
    return resumes.filter(r => 
      r.resumeId?.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resumes, searchTerm]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-200 gap-4">
      <Loader2 className="animate-spin text-black" size={40} />
      <span className={`${passero.className} text-xl tracking-widest`}>Syncing Workforce...</span>
    </div>
  );

  return (
    <div className={`p-6 lg:p-10 min-h-screen bg-gray-200 ${robotoSlab.className} text-black selection:bg-black selection:text-white`}>
      
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Operations Node</p>
          </div>
          <h1 className={`${passero.className} text-6xl uppercase italic tracking-tighter leading-none`}>
            Smart <span className="opacity-20 italic">Re-assign</span>
          </h1>
        </div>

        {selectedResumes.length > 0 && (
          <button 
            onClick={handleFinalReassign}
            disabled={actionLoading}
            className="flex items-center gap-4 bg-black text-white px-10 py-5 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
          >
            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
            Execute Forge ({selectedResumes.length})
          </button>
        )}
      </header>

      <div className="grid grid-cols-12 gap-8">
        
        {/* --- STEP 1: USER POOL (Left) --- */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <h3 className={`${passero.className} text-lg uppercase opacity-40 tracking-widest px-2`}>01 / Identity Pool</h3>

          <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 no-scrollbar">
            {users.map((u) => (
              <button 
                key={u._id}
                onClick={() => handleUserSelect(u)}
                className={`w-full p-6 rounded-3xl border transition-all duration-500 text-left flex items-center justify-between group ${
                  selectedUser?._id === u._id 
                  ? 'bg-black text-white border-black shadow-2xl translate-x-2' 
                  : 'bg-white border-white hover:border-black/10 text-black shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                   <div className={`${passero.className} w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                     selectedUser?._id === u._id ? 'bg-white text-black' : 'bg-gray-100 text-black'
                   }`}>
                      {u.name?.charAt(0)}
                   </div>
                   <div>
                      <p className="font-black uppercase text-xs tracking-tight">{u.name}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-tighter mt-0.5 ${selectedUser?._id === u._id ? 'opacity-40' : 'text-black/30'}`}>{u.email}</p>
                   </div>
                </div>
                <ArrowRight size={14} className={`transition-all ${selectedUser?._id === u._id ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* --- STEP 2: DATA ALLOCATION (Right) --- */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className={`${passero.className} text-lg uppercase opacity-40 tracking-widest`}>02 / Data Forge</h3>
            {selectedUser && (
               <span className="text-[10px] font-black uppercase text-black bg-white px-4 py-1.5 rounded-full shadow-sm">
                 Destined for: {selectedUser.name}
               </span>
            )}
          </div>

          {!selectedUser ? (
            <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-white shadow-sm italic text-black/10">
              <MousePointer2 size={40} className="mb-4 opacity-5 animate-bounce" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Select Node Identity to sync Forge</p>
            </div>
          ) : resumesLoading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-sm">
               <Loader2 className="animate-spin text-black mb-4" size={32} />
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-20">Refreshing Instance Pool...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter Instance by Name..." 
                  className="w-full bg-white rounded-2xl py-5 pl-16 pr-8 text-xs font-bold shadow-sm focus:ring-4 focus:ring-black/5 transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[60vh] pr-2 no-scrollbar pb-10">
                {filteredResumes.map((r) => {
                  const isSelected = !!selectedResumes.find(sr => sr._id === r._id);
                  return (
                    <div 
                      key={r._id}
                      onClick={() => !r.isLocked && toggleResume(r)}
                      className={`relative p-8 rounded-[2.5rem] border transition-all duration-500 group ${
                        r.isLocked 
                        ? 'bg-gray-100 border-gray-100 opacity-40 cursor-not-allowed scale-95' 
                        : isSelected 
                          ? 'bg-black text-white border-black shadow-2xl scale-[1.02]' 
                          : 'bg-white border-white hover:border-black/10 shadow-sm cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        {r.isLocked ? (
                          <Lock size={16} className="text-black/20" />
                        ) : (
                          <div className={`transition-colors ${isSelected ? 'text-white' : 'text-black/10'}`}>
                             {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </div>
                        )}
                        <span className="text-[8px] font-black uppercase opacity-20 tracking-widest italic">Node Logic</span>
                      </div>
                      
                      <h4 className={`font-black uppercase text-[11px] leading-tight mb-2 truncate ${isSelected ? 'text-white' : 'text-black'}`}>
                        {r.resumeId?.originalName || "UNNAMED_INSTANCE"}
                      </h4>
                      
                      <div className="flex items-center gap-1.5">
                        {r.isLocked ? (
                          <ShieldCheck size={10} className="text-black/20" />
                        ) : (
                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-black/20'}`} />
                        )}
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/60' : 'opacity-30'}`}>
                          {r.isLocked ? "User History Conflict" : isSelected ? "Staged for Forge" : "Available"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}