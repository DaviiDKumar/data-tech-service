"use client";

import { useState, useEffect, useMemo } from "react";
import { getAllUsers, getReassignableResumes, executeBulkReassign } from "@/app/actions/admin";
import { passero, robotoSlab } from "@/lib/fonts";
import { toast } from "sonner";
import {
  Loader2, Zap, Search, Square, CheckSquare,
  MousePointer2, ArrowRight, ShieldCheck, Lock,
  ChevronLeft, ChevronRight, CheckCheck, X, Users, Database
} from "lucide-react";

const RESUME_PAGE_SIZE = 20;
const USER_PAGE_SIZE = 8; // Restricts viewport list bloat on the sidebar node container

export default function AdminReassignPage() {
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedResumes, setSelectedResumes] = useState([]); 

  const [loading, setLoading] = useState(true);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Isolated multi-search states
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [resumeSearchTerm, setResumeSearchTerm] = useState("");
  
  // Independent Double-Tier pagination counters
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [resumeCurrentPage, setResumeCurrentPage] = useState(1);

  // ── Load users on mount ───────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const res = await getAllUsers();
        if (res.success) setUsers(res.data);
      } catch (err) {
        toast.error("Failed to connect to authentication server pool.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ── Load resumes when a user is selected ─────────────────────────
  const handleUserSelect = async (user) => {
    if (selectedUser?._id === user._id) return; 
    setSelectedUser(user);
    setSelectedResumes([]);
    setResumeCurrentPage(1);
    setResumeSearchTerm("");
    setResumesLoading(true);
    try {
      const res = await getReassignableResumes(user._id);
      if (res.success) {
        setResumes(res.data);
      } else {
        toast.error("Failed to sync resume pool data streams.");
      }
    } catch (err) {
      toast.error("Error communicating with data cluster.");
    } finally {
      setResumesLoading(false);
    }
  };

  // ── USER DATA MUTATION FILTER & PAGINATION ───────────────────────
  const filteredUsers = useMemo(() => {
    const term = userSearchTerm.toLowerCase().trim();
    if (!term) return users;
    return users.filter(u => 
      u.name?.toLowerCase().includes(term) || 
      u.email?.toLowerCase().includes(term)
    );
  }, [users, userSearchTerm]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));
  const safeUserPage = Math.min(userCurrentPage, totalUserPages);

  const paginatedUsers = useMemo(() => {
    const start = (safeUserPage - 1) * USER_PAGE_SIZE;
    return filteredUsers.slice(start, start + USER_PAGE_SIZE);
  }, [filteredUsers, safeUserPage]);

  // Reset user page tracking when search alters
  useEffect(() => {
    setUserCurrentPage(1);
  }, [userSearchTerm]);


  // ── RESUME DATA MUTATION FILTER & PAGINATION ─────────────────────
  const filteredResumes = useMemo(() => {
    const term = resumeSearchTerm.toLowerCase().trim();
    if (!term) return resumes;
    return resumes.filter(r =>
      r.resumeId?.originalName?.toLowerCase().includes(term)
    );
  }, [resumes, resumeSearchTerm]);

  const totalResumePages = Math.max(1, Math.ceil(filteredResumes.length / RESUME_PAGE_SIZE));
  const safeResumePage = Math.min(resumeCurrentPage, totalResumePages);

  const pageResumes = useMemo(() => {
    const start = (safeResumePage - 1) * RESUME_PAGE_SIZE;
    return filteredResumes.slice(start, start + RESUME_PAGE_SIZE);
  }, [filteredResumes, safeResumePage]);

  // Reset resume page tracking when search alters
  useEffect(() => {
    setResumeCurrentPage(1);
  }, [resumeSearchTerm]);

  // Selection configurations
  const availableOnPage = pageResumes.filter(r => !r.isLocked);
  const allAvailable = filteredResumes.filter(r => !r.isLocked);
  const selectedIds = useMemo(() => new Set(selectedResumes.map(r => r._id)), [selectedResumes]);

  const pageSelectedCount = availableOnPage.filter(r => selectedIds.has(r._id)).length;
  const allPageSelected = availableOnPage.length > 0 && pageSelectedCount === availableOnPage.length;
  const allSelected = allAvailable.length > 0 && selectedResumes.length === allAvailable.length;

  // ── Selection helpers ─────────────────────────────────────────────
  const toggleResume = (resume) => {
    if (resume.isLocked) return;
    setSelectedResumes(prev =>
      selectedIds.has(resume._id)
        ? prev.filter(r => r._id !== resume._id)
        : [...prev, resume]
    );
  };

  const selectPage = () => {
    if (allPageSelected) {
      const pageIds = new Set(availableOnPage.map(r => r._id));
      setSelectedResumes(prev => prev.filter(r => !pageIds.has(r._id)));
    } else {
      const toAdd = availableOnPage.filter(r => !selectedIds.has(r._id));
      setSelectedResumes(prev => [...prev, ...toAdd]);
    }
  };

  const selectAll = () => {
    if (allSelected) {
      setSelectedResumes([]);
    } else {
      setSelectedResumes([...allAvailable]);
    }
  };

  const selectN = (n) => {
    const toSelect = allAvailable.slice(0, n);
    setSelectedResumes(toSelect);
  };

  const clearSelection = () => setSelectedResumes([]);

  // ── Execute reassign ──────────────────────────────────────────────
  const handleFinalReassign = async () => {
    if (!selectedUser || selectedResumes.length === 0) return;
    setActionLoading(true);
    try {
      const normalised = selectedResumes.map(r => ({
        ...r,
        resumeId: {
          _id: r.resumeId?._id ?? r.resumeId,
          originalName: r.resumeId?.originalName ?? "",
          fileUrl: r.resumeId?.fileUrl ?? "",
        }
      }));

      const res = await executeBulkReassign(selectedUser._id, normalised);
      if (res.success) {
        toast.success(`Allocated ${selectedResumes.length} resumes to ${selectedUser.name}`);
        setSelectedResumes([]);
        setResumeCurrentPage(1);
        handleUserSelect(selectedUser); 
      } else {
        toast.error(res.error || "Execution pipeline rejected the payload.");
      }
    } catch (err) {
      toast.error("Critical system error during database forging sequence.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4 text-black">
      <Loader2 className="animate-spin text-black" size={40} />
      <span className={`${passero.className} text-[10px] uppercase tracking-[5px] text-zinc-400`}>Syncing Workforce Registry...</span>
    </div>
  );

  return (
    <div className={`p-6 lg:p-10 min-h-screen bg-neutral-50 ${robotoSlab.className} text-black`}>

      {/* ── HEADER INTERACTIVES ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b-2 border-black pb-6 bg-white shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">Operations Node Console</p>
          </div>
          <h1 className={`${passero.className} text-5xl uppercase italic tracking-tighter leading-none`}>
            Smart <span className="opacity-20 italic">Re-assign</span> Panel
          </h1>
        </div>

        {selectedResumes.length > 0 && (
          <div className="flex items-center gap-3 bg-white border border-zinc-200 p-2 rounded-2xl shadow-sm animate-in zoom-in duration-200">
            <button
              onClick={clearSelection}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-all"
            >
              <X size={14} /> Reset ({selectedResumes.length})
            </button>
            <button
              onClick={handleFinalReassign}
              disabled={actionLoading}
              className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-30"
            >
              {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} className="text-amber-400 fill-amber-400" />}
              Execute Transfer ({selectedResumes.length})
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-12 gap-8">

        {/* ── COLUMN 1: IDENTITY POOL WITH FILTER + PAGINATION ── */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 px-1 text-zinc-400">
            <Users size={14} />
            <h3 className={`${passero.className} text-sm uppercase tracking-wider`}>01 / Operator Node Target</h3>
          </div>

          {/* User Side Filter Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
            <input
              type="text"
              placeholder="SEARCH OPERATOR (300+ NODES)..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-black transition-all"
            />
          </div>

          <div className="space-y-2">
            {paginatedUsers.map((u) => (
              <button
                key={u._id}
                onClick={() => handleUserSelect(u)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left flex items-center justify-between group ${
                  selectedUser?._id === u._id
                    ? 'bg-black text-white border-black shadow-lg'
                    : 'bg-white border-zinc-100 hover:border-zinc-300 text-black shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`${passero.className} w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${
                    selectedUser?._id === u._id ? 'bg-white text-black' : 'bg-zinc-100 text-black'
                  }`}>
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="font-black uppercase text-[11px] tracking-tight truncate">{u.name}</p>
                    <p className={`text-[9px] font-mono truncate ${selectedUser?._id === u._id ? 'opacity-40' : 'text-zinc-400'}`}>{u.email}</p>
                  </div>
                </div>
                <ArrowRight size={14} className={`shrink-0 transition-all ${selectedUser?._id === u._id ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 bg-white border border-dashed border-zinc-200 rounded-xl text-[10px] font-black uppercase text-zinc-300 tracking-widest">
                No Agents Matched
              </div>
            )}
          </div>

          {/* User Side Minimal Pagination Controls */}
          {totalUserPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs">
              <button
                onClick={() => setUserCurrentPage(p => Math.max(p - 1, 1))}
                disabled={safeUserPage === 1}
                className="p-1 text-black hover:bg-zinc-50 disabled:opacity-20 rounded-md transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                Pool Page {safeUserPage} / {totalUserPages}
              </span>
              <button
                onClick={() => setUserCurrentPage(p => Math.min(p + 1, totalUserPages))}
                disabled={safeUserPage === totalUserPages}
                className="p-1 text-black hover:bg-zinc-50 disabled:opacity-20 rounded-md transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* ── COLUMN 2: DATA FORGE SELECTION MODULE ── */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-zinc-400">
              <Database size={14} />
              <h3 className={`${passero.className} text-sm uppercase tracking-wider`}>02 / Data Vault Source</h3>
            </div>
            {selectedUser && (
              <span className="text-[9px] font-black uppercase text-white bg-black px-3 py-1 rounded-md tracking-wider">
                Target Node: {selectedUser.name}
              </span>
            )}
          </div>

          {!selectedUser ? (
            <div className="h-[55vh] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-zinc-100 shadow-sm text-zinc-200">
              <MousePointer2 size={36} className="mb-2 opacity-20 animate-bounce" />
              <p className="text-[10px] font-black uppercase tracking-widest">Select target endpoint from identity pool left side.</p>
            </div>
          ) : resumesLoading ? (
            <div className="h-[55vh] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-zinc-100 shadow-sm">
              <Loader2 className="animate-spin text-black mb-2" size={28} />
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 animate-pulse">Syncing instance arrays...</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* Filter inputs for resumes */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                <input
                  type="text"
                  placeholder="FILTER SOURCE FILE DATA STRINGS BY NAME..."
                  className="w-full bg-white border border-zinc-200 rounded-xl py-3.5 pl-11 pr-4 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-black transition-all"
                  value={resumeSearchTerm}
                  onChange={(e) => setResumeSearchTerm(e.target.value)}
                />
              </div>

              {/* Automated Control Cluster Bars */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl p-3 border border-zinc-200 text-[10px]">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={selectPage}
                    disabled={availableOnPage.length === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all border
                      ${allPageSelected ? 'bg-black text-white border-black' : 'bg-white text-black border-zinc-200 hover:border-black'}`}
                  >
                    {allPageSelected ? <CheckSquare size={12} fill="currentColor" /> : <Square size={12} />}
                    Page ({availableOnPage.length})
                  </button>

                  <button
                    onClick={selectAll}
                    disabled={allAvailable.length === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all border
                      ${allSelected ? 'bg-black text-white border-black' : 'bg-white text-black border-zinc-200 hover:border-black'}`}
                  >
                    <CheckCheck size={12} /> Total Matching ({allAvailable.length})
                  </button>

                  {[50, 100].map(n => (
                    allAvailable.length > n && (
                      <button
                        key={n}
                        onClick={() => selectN(n)}
                        className="px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all border border-zinc-200 hover:border-black bg-white text-black"
                      >
                        Select top {n}
                      </button>
                    )
                  ))}
                </div>

                <div className="font-mono text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                  Vault Balance: {filteredResumes.filter(r => !r.isLocked).length} Available / {filteredResumes.length} Total
                </div>
              </div>

              {/* Data Grid Display Fields */}
              {pageResumes.length === 0 ? (
                <div className="h-40 flex items-center justify-center bg-white border border-dashed border-zinc-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-zinc-300">
                  No Document Segments Located
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pageResumes.map((r) => {
                    const isSelected = selectedIds.has(r._id);
                    return (
                      <div
                        key={r._id}
                        onClick={() => !r.isLocked && toggleResume(r)}
                        className={`p-5 rounded-xl border-2 transition-all duration-200 select-none group ${
                          r.isLocked
                            ? 'bg-zinc-50 border-zinc-100 opacity-40 cursor-not-allowed'
                            : isSelected
                              ? 'bg-black text-white border-black shadow-md scale-[1.01]'
                              : 'bg-white border-zinc-100 hover:border-zinc-300 shadow-sm cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase tracking-wider">
                          {r.isLocked ? (
                            <div className="flex items-center gap-1.5 text-rose-500">
                              <Lock size={12} /> Locked Node
                            </div>
                          ) : (
                            <div className={isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-black'}>
                              {isSelected ? <CheckSquare size={16} fill="currentColor" /> : <Square size={16} />}
                            </div>
                          )}
                          <span className="opacity-20 font-mono">DTS_REF</span>
                        </div>

                        <h4 className="font-black uppercase text-[11px] tracking-tight leading-tight mb-2 truncate">
                          {r.resumeId?.originalName || "ANONYMOUS_STREAM.PDF"}
                        </h4>

                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${r.isLocked ? 'bg-rose-400' : isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-200'}`} />
                          <span className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>
                            {r.isLocked ? "Assigned to alternative worker pool" : isSelected ? "Staged for bulk execution" : "Available"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Data Forge Grid Pagination Footer Strip */}
              {totalResumePages > 1 && (
                <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-sm">
                  <button
                    onClick={() => setResumeCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={safeResumePage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-zinc-200 hover:border-black transition-all disabled:opacity-20"
                  >
                    <ChevronLeft size={14} /> Prev Page
                  </button>

                  <div className="flex items-center gap-1">
                    {renderPageNumbers().map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1.5 text-zinc-300 text-xs font-bold">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setResumeCurrentPage(p)}
                          className={`w-7 h-7 rounded-md text-[10px] font-mono font-black transition-all
                            ${p === safeResumePage ? 'bg-black text-white' : 'text-zinc-400 hover:bg-zinc-100'}`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => setResumeCurrentPage(p => Math.min(p + 1, totalResumePages))}
                    disabled={safeResumePage === totalResumePages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-zinc-200 hover:border-black transition-all disabled:opacity-20"
                  >
                    Next Page <ChevronRight size={14} />
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}