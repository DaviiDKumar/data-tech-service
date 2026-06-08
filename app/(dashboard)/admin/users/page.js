"use client";

import { useState, useEffect, useMemo, useCallback } from "react"; // ✅ FIXED: Added missing useMemo import
import { getAllUsers, manageUserAccess } from "@/app/actions/admin";
import { exportToCSV } from "@/lib/exportCSV";
import { robotoSlab, ubuntu, passero } from "@/lib/fonts";
import {
  Mail, Loader2, Download, CheckSquare,
  Square, Search, Calendar, Activity, Power, Save, Plus,
  SlidersHorizontal, ArrowUpDown, RotateCcw, X, ChevronDown, Users, ShieldCheck, ShieldX
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [manualDates, setManualDates] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    status: "all", kyc: "all", bank: "all",
    endDateFrom: "", endDateTo: "", sortBy: "name", sortDir: "asc",
  });
  const [pendingFilters, setPendingFilters] = useState({ ...filters });

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) setUsers(result.data);
    } catch (error) {
      console.error("Audit Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Isolated Initialization Loop: Fires exactly once on mount
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Isolated Clock Timer Loop: Prevents redundant one-second data sweeps
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour12: true }));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();

    let result = users.filter(u => {
      const nameMatch = (u.name || "").toLowerCase().includes(cleanSearch);
      const idMatch = (u.loginId || "").toLowerCase().includes(cleanSearch);
      const emailMatch = (u.email || "").toLowerCase().includes(cleanSearch);
      return nameMatch || idMatch || emailMatch;
    });

    if (filters.status !== "all") {
      result = result.filter(u => filters.status === "active" ? u.isActive : !u.isActive);
    }
    if (filters.kyc !== "all") {
      result = result.filter(u => (u.kycStatus || "pending") === filters.kyc);
    }
    if (filters.bank !== "all") {
      result = result.filter(u => (u.bankDetailsStatus || "pending") === filters.bank);
    }
    if (filters.endDateFrom) {
      result = result.filter(u => u.endDate && new Date(u.endDate) >= new Date(filters.endDateFrom));
    }
    if (filters.endDateTo) {
      result = result.filter(u => u.endDate && new Date(u.endDate) <= new Date(filters.endDateTo));
    }

    result.sort((a, b) => {
      let valA, valB;
      if (filters.sortBy === "name") {
        valA = a.name || ""; valB = b.name || "";
      } else if (filters.sortBy === "endDate") {
        valA = a.endDate ? new Date(a.endDate).getTime() : 0;
        valB = b.endDate ? new Date(b.endDate).getTime() : 0;
      } else if (filters.sortBy === "approved") {
        valA = a.stats?.approvedCount || 0; valB = b.stats?.approvedCount || 0;
      } else if (filters.sortBy === "joinDate") {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      }

      if (valA < valB) return filters.sortDir === "asc" ? -1 : 1;
      if (valA > valB) return filters.sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [users, searchTerm, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.kyc !== "all") count++;
    if (filters.bank !== "all") count++;
    if (filters.endDateFrom || filters.endDateTo) count++;
    if (filters.sortBy !== "name" || filters.sortDir !== "asc") count++;
    return count;
  }, [filters]);

  const handleDateChange = (userId, newDate) =>
    setManualDates(prev => ({ ...prev, [userId]: newDate }));

  const handleAccessUpdate = async (userId, updates) => {
    setIsActionLoading(userId);
    try {
      const res = await manageUserAccess(userId, updates);
      if (res.success) {
        setUsers(prevUsers => prevUsers.map(u => {
          if (u._id === userId) {
            const finalNode = { ...u, ...updates };
            if (updates.daysToAdd) {
              const base = new Date(u.endDate || new Date());
              base.setDate(base.getDate() + updates.daysToAdd);
              finalNode.endDate = base.toISOString();
            }
            if (updates.fixedEndDate) {
              finalNode.endDate = new Date(updates.fixedEndDate).toISOString();
            }
            return finalNode;
          }
          return u;
        }));

        setManualDates(prev => { const next = { ...prev }; delete next[userId]; return next; });
      } else {
        alert(res.message || "Access validation update rejected.");
      }
    } catch {
      alert("A system execution failure occurred.");
    } finally {
      setIsActionLoading(null);
    }
  };

  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === filteredUsers.length ? [] : filteredUsers.map(u => u._id));

  const handleExportCSV = () => {
    if (!selectedIds.length) return;
    const selectedData = users.filter(u => selectedIds.includes(u._id));
    const formatted = selectedData.map(u => ({
      Login_ID: u.loginId, Password: u.password, Full_Name: u.name,
      Email: u.email, Phone_Number: u.phone,
      KYC_Status: u.kycStatus || "pending", Bank_Status: u.bankDetailsStatus || "pending",
      Account_Status: u.isActive ? "Active" : "Disabled",
      Plan_Start: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : "N/A",
      Plan_End: u.endDate ? new Date(u.endDate).toLocaleDateString('en-GB') : "N/A",
      Submitted: u.stats?.submittedCount || 0,
      Approved: u.stats?.approvedCount || 0,
      Rejected: u.stats?.rejectedCount || 0,
      Saved: (u.stats?.inProgressCount || 0) + (u.stats?.assignedCount || 0) + (u.stats?.reviewCount || 0),
    }));
    exportToCSV(formatted, "User_Audit_Report", Object.keys(formatted[0]));
  };

  const applyFilters = () => { setFilters({ ...pendingFilters }); setFilterOpen(false); };
  const resetFilters = () => {
    const def = { status: "all", kyc: "all", bank: "all", endDateFrom: "", endDateTo: "", sortBy: "name", sortDir: "asc" };
    setFilters(def); setPendingFilters(def); setFilterOpen(false);
  };

  if (loading && users.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-3">
      <Loader2 className="animate-spin text-black" size={32} />
      <span className={`${passero.className} text-xs tracking-widest text-zinc-400 uppercase`}>Syncing Users Matrix...</span>
    </div>
  );

  
  return (
    <div className={`p-6 lg:p-10 min-h-screen bg-white ${ubuntu.className} text-black`}>

      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 border-b border-zinc-200 pb-6 bg-white shrink-0">
        <div>
          <h1 className={`${robotoSlab.className} text-4xl font-black uppercase tracking-tight`}>
            User <span className="text-zinc-400 font-light">Directory</span>
          </h1>
          <p className="text-[9px] font-mono tracking-widest text-zinc-400 mt-1 uppercase">Staged Agent Profiles & Access Regulators</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text" placeholder="Search entries..."
              className="w-full sm:w-64 bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-wider outline-none focus:border-black transition-all"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setPendingFilters({ ...filters }); setFilterOpen(true); }}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer
              ${activeFilterCount > 0 ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'}`}
          >
            <SlidersHorizontal size={12} /> Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-md bg-zinc-200 text-black text-[9px] font-mono font-black flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!selectedIds.length}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer
              ${selectedIds.length ? 'bg-black border-black text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-300 cursor-not-allowed'}`}
          >
            <Download size={12} /> Export ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* --- STATS COUNTERS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Registries", value: users.length, icon: <Users size={16} />, color: "text-black", bg: "bg-zinc-50 border-zinc-200" },
          { label: "Active Connections", value: users.filter(u => u.isActive).length, icon: <ShieldCheck size={16} />, color: "text-emerald-600", bg: "bg-emerald-50/40 border-emerald-100" },
          { label: "Blocked Workstations", value: users.filter(u => !u.isActive).length, icon: <ShieldX size={16} />, color: "text-rose-600", bg: "bg-rose-50/40 border-rose-100" },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-4 p-5 rounded-xl border-2 ${s.bg} select-none`}>
            <div className={s.color}>{s.icon}</div>
            <div>
              <p className={`text-xl font-mono font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- SYSTEM MATRIX TABLE --- */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-black uppercase tracking-widest text-[9px] text-slate-400 select-none">
                <th className="px-5 py-4 w-12 text-center">
                  <button onClick={toggleSelectAll} className="cursor-pointer">
                    {selectedIds.length === filteredUsers.length && filteredUsers.length > 0
                      ? <CheckSquare size={14} className="text-black" />
                      : <Square size={14} className="text-zinc-300" />}
                  </button>
                </th>
                {["Agent Node", "Credentials", "Contact parameters", "Compliance Status", "Plan Deadlines", "Subm", "Appr", "Rejt", "Saved", "Action controls"].map(h => (
                  <th key={h} className="px-4 py-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-20 font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    No profile matches found inside matching tracking vector.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isSelected = selectedIds.includes(user._id);
                  const isUserActionLoading = isActionLoading === user._id;
                  const displayEndDate = manualDates[user._id] || (user.endDate ? new Date(user.endDate).toISOString().split('T')[0] : "");
                  const isExpired = user.endDate && new Date(user.endDate) < new Date();

                  const savedCount =
                    (user.stats?.inProgressCount || 0) +
                    (user.stats?.assignedCount || 0) +
                    (user.stats?.reviewCount || 0);

                  return (
                    <tr
                      key={user._id}
                      className={`border-b border-zinc-50 transition-colors ${isSelected ? 'bg-zinc-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-zinc-50/80`}
                    >
                      <td className="px-5 py-4 text-center">
                        <button onClick={() => toggleSelect(user._id)} className="cursor-pointer">
                          {isSelected
                            ? <CheckSquare size={14} className="text-black" />
                            : <Square size={14} className="text-zinc-300" />}
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-black shrink-0 shadow-xs select-none
                            ${isSelected ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0 max-w-[140px]">
                            <p className="font-black text-xs text-zinc-900 truncate uppercase tracking-tight">{user.name || "UNNAMED_NODE"}</p>
                            <p className="text-[9px] text-zinc-400 font-mono tracking-tighter truncate mt-0.5">{user.loginId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-mono font-bold text-zinc-900 select-all">{user.password || "------"}</td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-zinc-500 font-medium">
                            <span className="text-[10px] text-zinc-900 font-mono">+91 {user.phone || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-400">
                            <span className="text-[10px] truncate max-w-[130px] font-mono">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 select-none">
                        <div className="flex flex-col gap-1">
                          <StatusPill label="KYC" active={user.kycStatus === 'verified' || user.kycStatus === 'approved'} />
                          <StatusPill label="Bank" active={user.bankDetailsStatus === 'verified' || user.bankDetailsStatus === 'approved'} />
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-0.5 text-[10px] font-mono mb-1.5 text-zinc-500">
                          <p>Start: <span className="font-bold text-zinc-700">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : '—'}</span></p>
                          <p>End: <span className={`font-black ${isExpired ? 'text-rose-500 animate-pulse' : 'text-zinc-900'}`}>{user.endDate ? new Date(user.endDate).toLocaleDateString('en-GB') : '—'}</span></p>
                        </div>
                        <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg p-1 w-fit select-none">
                          <Calendar size={11} className="text-zinc-400 ml-0.5 shrink-0" />
                          <input
                            type="date" value={displayEndDate}
                            onChange={e => handleDateChange(user._id, e.target.value)}
                            className="bg-transparent text-[9px] font-mono font-bold outline-none cursor-pointer w-20 text-black border-none"
                          />
                          <div className="flex items-center gap-1 border-l border-zinc-200 pl-1 shrink-0">
                            {manualDates[user._id] && (
                              <button
                                onClick={() => handleAccessUpdate(user._id, { fixedEndDate: manualDates[user._id] })}
                                disabled={isUserActionLoading}
                                className="p-0.5 bg-black text-white rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                {isUserActionLoading ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                              </button>
                            )}
                            <button
                              onClick={() => handleAccessUpdate(user._id, { daysToAdd: 1})}
                              disabled={isUserActionLoading}
                              className="p-0.5 bg-white border border-zinc-200 rounded-md hover:border-black text-black transition-all cursor-pointer font-black"
                              title="+7 Days Extension"
                            >
                              <Plus size={10} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center select-none"><StatBadge value={user.stats?.submittedCount || 0} color="text-zinc-500" bg="bg-zinc-50 border-zinc-100" /></td>
                      <td className="px-4 py-4 text-center select-none"><StatBadge value={user.stats?.approvedCount || 0} color="text-emerald-600" bg="bg-emerald-50/50 border-emerald-100" /></td>
                      <td className="px-4 py-4 text-center select-none"><StatBadge value={user.stats?.rejectedCount || 0} color="text-rose-500" bg="bg-rose-50/50 border-rose-100" /></td>
                      <td className="px-4 py-4 text-center select-none"><StatBadge value={savedCount} color="text-amber-600" bg="bg-amber-50/50 border-amber-100" /></td>

                      <td className="px-4 py-4 select-none">
                        <div className="flex items-center gap-2 justify-end">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border
                            ${user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                            {user.isActive ? 'Active' : 'Blocked'}
                          </span>
                          <button
                            disabled={isUserActionLoading}
                            onClick={() => handleAccessUpdate(user._id, { isActive: !user.isActive })}
                            className={`p-1.5 rounded-lg border-2 transition-all cursor-pointer shrink-0
                              ${user.isActive
                                ? 'border-zinc-200 text-zinc-500 hover:border-rose-500 hover:text-white hover:bg-rose-500'
                                : 'border-black bg-black text-white hover:bg-zinc-800'}`}
                            title={user.isActive ? 'Suspend access loop' : 'Reactivate console'}
                          >
                            {isUserActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER --- */}
        <div className="px-5 py-3 border-t border-zinc-200 flex items-center justify-between bg-slate-50/50 select-none">
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            Registry Index size: <span className="font-bold text-zinc-700">{filteredUsers.length}</span> profiles loaded
            {selectedIds.length > 0 && <> · <span className="font-bold text-black">{selectedIds.length} flagged active</span></>}
          </p>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{currentTime || "--:--:--"}</p>
        </div>
      </div>

      {/* ── FILTER MATRIX OVERLAY PANEL ── */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-200"><SlidersHorizontal size={13} /></div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-tight">Filter parameters</h2>
                  <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">Configure system output vectors</p>
                </div>
              </div>
              <button onClick={() => setFilterOpen(false)} className="p-2 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer"><X size={15} /></button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Account Status</label>
                <div className="flex gap-2">
                  {["all", "active", "blocked"].map(opt => (
                    <button key={opt} onClick={() => setPendingFilters(p => ({ ...p, status: opt }))}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer
                        ${pendingFilters.status === opt ? 'bg-black border-black text-white' : 'bg-white text-zinc-400 border-zinc-200 hover:border-black'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">KYC Compliance Check</label>
                <div className="flex gap-2">
                  {["all", "verified", "pending"].map(opt => (
                    <button key={opt} onClick={() => setPendingFilters(p => ({ ...p, kyc: opt }))}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer
                        ${pendingFilters.kyc === opt ? 'bg-black border-black text-white' : 'bg-white text-zinc-400 border-zinc-200 hover:border-black'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Banking Channel Route</label>
                <div className="flex gap-2">
                  {["all", "verified", "pending"].map(opt => (
                    <button key={opt} onClick={() => setPendingFilters(p => ({ ...p, bank: opt }))}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer
                        ${pendingFilters.bank === opt ? 'bg-black border-black text-white' : 'bg-white text-zinc-400 border-zinc-200 hover:border-black'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Plan Duration Date Boundaries</label>
                <div className="flex gap-3 font-mono text-[11px]">
                  <div className="flex-1">
                    <span className="text-[8px] font-sans font-black text-zinc-400 block mb-1 uppercase">Lower Bound</span>
                    <input type="date" value={pendingFilters.endDateFrom}
                      onChange={e => setPendingFilters(p => ({ ...p, endDateFrom: e.target.value }))}
                      className="w-full border-2 border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-black bg-white" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[8px] font-sans font-black text-zinc-400 block mb-1 uppercase">Upper Bound</span>
                    <input type="date" value={pendingFilters.endDateTo}
                      onChange={e => setPendingFilters(p => ({ ...p, endDateTo: e.target.value }))}
                      className="w-full border-2 border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-black bg-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Sort Sequence Mapping</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <select value={pendingFilters.sortBy}
                      onChange={e => setPendingFilters(p => ({ ...p, sortBy: e.target.value }))}
                      className="w-full border-2 border-zinc-200 rounded-lg px-3 py-2 text-[11px] font-black uppercase outline-none appearance-none bg-white cursor-pointer focus:border-black">
                      <option value="name">Name parameter</option>
                      <option value="endDate">Expiry deadline</option>
                      <option value="joinDate">Join registration</option>
                      <option value="approved">Approved metrics</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => setPendingFilters(p => ({ ...p, sortDir: p.sortDir === "asc" ? "desc" : "asc" }))}
                    className="px-3 border-2 border-zinc-200 text-zinc-600 rounded-lg font-mono font-black text-[10px] uppercase tracking-wide hover:border-black hover:text-black transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ArrowUpDown size={11} /> {pendingFilters.sortDir}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 flex gap-3 shrink-0 bg-white">
              <button onClick={resetFilters}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-zinc-200 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:border-black hover:text-black transition-all cursor-pointer">
                <RotateCcw size={12} /> Wipe Parameters
              </button>
              <button onClick={applyFilters}
                className="flex-1 py-3 rounded-xl bg-black border-2 border-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-zinc-800 hover:border-zinc-800 transition-all cursor-pointer shadow-sm">
                Commit Filter Vectors
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ value, color, bg }) {
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-mono text-xs font-black border ${color} ${bg}`}>
      {value}
    </span>
  );
}

function StatusPill({ label, active }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider
      ${active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-zinc-50 text-zinc-300 border-zinc-100'}`}>
      <span className={`w-1 h-1 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
      {label}
    </span>
  );
}