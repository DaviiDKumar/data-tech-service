"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from "react";
// Humne tumhare bataye hue functions import kiye hain
import { getAllUsers, getReassignableResumes, executeBulkReassign } from "@/app/actions/admin";
import { 
  Users, FileText, Lock, CheckCircle, 
  Loader2, Zap, Search, Square, CheckSquare,
  ShieldAlert, MousePointer2, ArrowRight
} from "lucide-react";

function AdminReassignContent() {
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedResumes, setSelectedResumes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Load All Users on Mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await getAllUsers();
        if (!cancelled && res.success) {
          setUsers(res.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // 2. Load Resumes when a User is selected
  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setSelectedResumes([]); // Clear previous selection
    setResumesLoading(true);
    try {
      const res = await getReassignableResumes(user._id);
      if (res.success) setResumes(res.data);
    } finally {
      setResumesLoading(false);
    }
  };

  // 3. Selection Toggle Logic
  const toggleResume = (resume) => {
    if (resume.isLocked) return; // Cant select locked ones
    setSelectedResumes(prev => {
      const isAlreadySelected = prev.find(r => r._id === resume._id);
      if (isAlreadySelected) {
        return prev.filter(r => r._id !== resume._id);
      } else {
        return [...prev, resume];
      }
    });
  };

  // 4. Execute Re-assign
  const handleFinalReassign = async () => {
    if (!selectedUser || selectedResumes.length === 0) return;
    
    const confirm = window.confirm(
      `Confirm: Re-assigning ${selectedResumes.length} approved resumes to ${selectedUser.name}. 
      The user will get pre-filled data in their workspace.`
    );
    
    if (!confirm) return;

    setActionLoading(true);
    try {
      const res = await executeBulkReassign(selectedUser._id, selectedResumes);
      if (res.success) {
        alert("Success! Resumes allocated to " + selectedUser.name);
        setSelectedResumes([]);
        handleUserSelect(selectedUser); // Refresh the list to lock the newly assigned ones
      }
    } catch (err) {
      alert("Error executing re-assign");
    } finally {
      setActionLoading(false);
    }
  };

  // Search filter
  const filteredResumes = useMemo(() => {
    return resumes.filter(r => 
      r.resumeId?.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resumes, searchTerm]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching User Directory...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-400 mx-auto min-h-screen bg-slate-50/20 font-sans">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg">
              <Zap size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Operations Suite</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
            Smart <span className="text-blue-600">Re-assign</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
            <span className="w-12 h-px bg-slate-200"></span> Distribute approved data to active agents
          </p>
        </div>

        {selectedResumes.length > 0 && (
          <button 
            onClick={handleFinalReassign}
            disabled={actionLoading}
            className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200 animate-in zoom-in"
          >
            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
            Execute Assignment ({selectedResumes.length})
          </button>
        )}
      </header>

      <div className="grid grid-cols-12 gap-10">
        
        {/* --- STEP 1: USER SELECTION (Left Panel) --- */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="flex items-center gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black">01</div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 italic">Target Workforce</h3>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-2 custom-scrollbar">
            {users.map((u) => (
              <button 
                key={u._id}
                onClick={() => handleUserSelect(u)}
                className={`w-full p-6 rounded-[2.5rem] border-2 text-left transition-all duration-300 ${
                  selectedUser?._id === u._id 
                  ? 'border-blue-600 bg-white shadow-xl shadow-blue-50 scale-[1.02]' 
                  : 'border-white bg-white hover:border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${
                     selectedUser?._id === u._id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'
                   }`}>
                      {u.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{u.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{u.email}</p>
                   </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* --- STEP 2: RESUME SELECTION (Right Panel) --- */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black">02</div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 italic">Select Data for Forge</h3>
            </div>
            {selectedUser && (
               <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-lg animate-pulse">
                 Destined for: {selectedUser.name}
               </span>
            )}
          </div>

          {!selectedUser ? (
            <div className="h-[60vh] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-100 rounded-[4rem]">
              <MousePointer2 size={48} className="text-slate-100 mb-6 animate-bounce" />
              <h3 className="text-slate-400 font-black uppercase text-xs tracking-widest">Awaiting User Selection</h3>
              <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 italic">Select a user from the left panel to load data</p>
            </div>
          ) : resumesLoading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[4rem] border border-slate-100">
               <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Filtering Available Records...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Internal Search */}
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Filter Approved Resumes by Name..." 
                  className="w-full bg-white border-none rounded-[2rem] py-5 pl-16 pr-8 text-sm font-bold shadow-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Resumes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[55vh] pr-2 custom-scrollbar">
                {filteredResumes.map((r) => {
                  const isSelected = selectedResumes.find(sr => sr._id === r._id);
                  return (
                    <div 
                      key={r._id}
                      onClick={() => toggleResume(r)}
                      className={`relative p-8 rounded-[3rem] border-2 transition-all duration-300 ${
                        r.isLocked 
                        ? 'bg-slate-50 border-slate-50 opacity-60 cursor-not-allowed' 
                        : isSelected 
                          ? 'border-blue-600 bg-white shadow-2xl shadow-blue-100/50' 
                          : 'border-white bg-white hover:border-slate-100 shadow-sm'
                      } ${!r.isLocked && 'cursor-pointer hover:scale-[1.02]'}`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        {r.isLocked ? (
                          <div className="p-2 bg-red-50 text-red-500 rounded-lg"><Lock size={16} /></div>
                        ) : (
                          <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-200'}`}>
                             {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </div>
                        )}
                        <span className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em] italic">Data Match v1.2</span>
                      </div>
                      
                      <h4 className="font-black text-slate-900 uppercase text-xs leading-tight mb-2 truncate">
                        {r.resumeId?.originalName || "Unnamed_System_File"}
                      </h4>
                      
                      {r.isLocked ? (
                        <p className="text-[8px] font-black text-red-400 uppercase flex items-center gap-1 italic">
                          <ShieldAlert size={10} /> Already Assigned to this User
                        </p>
                      ) : (
                        <p className="text-[8px] font-black text-emerald-500 uppercase flex items-center gap-1 italic">
                          <CheckCircle size={10} /> Available for Allocation
                        </p>
                      )}
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

export default dynamic(() => Promise.resolve(AdminReassignContent), { ssr: false });