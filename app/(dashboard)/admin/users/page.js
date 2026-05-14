"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllUsers, manageUserAccess } from "@/app/actions/admin";
import { exportToCSV } from "@/lib/exportCSV";
import { passero, robotoSlab } from "@/lib/fonts";
import {
  Mail, Fingerprint, Loader2, Download, CheckSquare,
  Square, Search, Calendar, Activity, Power, Save, Plus,
  Filter, X, ChevronDown, Users, ShieldCheck, ShieldX,
  SlidersHorizontal, ArrowUpDown, RotateCcw
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
    status: "all",
    kyc: "all",
    bank: "all",
    endDateFrom: "",
    endDateTo: "",
    sortBy: "name",
    sortDir: "asc",
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

  useEffect(() => {
    let isMounted = true;
    fetchData(true);
    const interval = setInterval(() => {
      if (isMounted) setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    let result = users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.loginId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filters.status !== "all")
      result = result.filter(u => filters.status === "active" ? u.isActive : !u.isActive);
    if (filters.kyc !== "all")
      result = result.filter(u => (u.kycStatus || "pending") === filters.kyc);
    if (filters.bank !== "all")
      result = result.filter(u => (u.bankDetailsStatus || "pending") === filters.bank);
    if (filters.endDateFrom)
      result = result.filter(u => u.endDate && new Date(u.endDate) >= new Date(filters.endDateFrom));
    if (filters.endDateTo)
      result = result.filter(u => u.endDate && new Date(u.endDate) <= new Date(filters.endDateTo));

    result.sort((a, b) => {
      let valA, valB;
      if (filters.sortBy === "name") { valA = a.name || ""; valB = b.name || ""; }
      else if (filters.sortBy === "endDate") { valA = new Date(a.endDate || 0); valB = new Date(b.endDate || 0); }
      else if (filters.sortBy === "approved") { valA = a.stats?.approvedCount || 0; valB = b.stats?.approvedCount || 0; }
      else if (filters.sortBy === "joinDate") { valA = new Date(a.startDate || 0); valB = new Date(b.startDate || 0); }

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

  const handleDateChange = (userId, newDate) => {
    setManualDates(prev => ({ ...prev, [userId]: newDate }));
  };

  const handleAccessUpdate = async (userId, updates) => {
    setIsActionLoading(userId);
    const res = await manageUserAccess(userId, updates);
    if (res.success) {
      setManualDates(prev => { const next = { ...prev }; delete next[userId]; return next; });
      await fetchData(false);
    } else {
      alert(res.error || "Update failed");
    }
    setIsActionLoading(null);
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
      Plan_Start: u.startDate ? new Date(u.startDate).toLocaleDateString('en-GB') : "N/A",
      Plan_End: u.endDate ? new Date(u.endDate).toLocaleDateString('en-GB') : "N/A",
      Approved: u.stats?.approvedCount || 0, Rejected: u.stats?.rejectedCount || 0
    }));
    exportToCSV(formatted, "User_Audit_Report", Object.keys(formatted[0]));
  };

  const applyFilters = () => { setFilters({ ...pendingFilters }); setFilterOpen(false); };
  const resetFilters = () => {
    const def = { status: "all", kyc: "all", bank: "all", endDateFrom: "", endDateTo: "", sortBy: "name", sortDir: "asc" };
    setFilters(def); setPendingFilters(def); setFilterOpen(false);
  };

  if (loading && users.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-violet-600" size={36} />
      <span className={`${robotoSlab.className} text-sm tracking-widest text-slate-400 uppercase`}>Syncing Users...</span>
    </div>
  );

  return (
    <div className={`p-6 lg:p-10 min-h-screen bg-white ${robotoSlab.className} text-black`}>

      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 shadow-2xl border-2 border-slate-200 px-6 py-8 rounded-2xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
            <p className="text-[12px]  text-black">Manage All Users</p>
          </div>
          <h1 className={`text-5xl lg:text-6xl uppercase font-bold ${robotoSlab.className}`}>
            Manage<span className="text-black/80 text-5xl"> Users</span>
          </h1>
        
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input
              type="text" placeholder="Search name, ID, email..."
              className="w-72 bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-medium outline-none focus:border-violet-400 transition-colors"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => { setPendingFilters({ ...filters }); setFilterOpen(true); }}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all
              ${activeFilterCount > 0 ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-400'}`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-violet-600 text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export */}
          <button
            onClick={handleExportCSV}
            disabled={!selectedIds.length}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
              ${selectedIds.length ? 'bg-black text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
          >
            <Download size={15} />
            Export ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="grid  lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Users", value: users.length, icon: <Users size={24} />, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
          { label: "Active", value: users.filter(u => u.isActive).length, icon: <ShieldCheck size={24} />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Blocked", value: users.filter(u => !u.isActive).length, icon: <ShieldX size={24} />, color: "text-red-500", bg: "bg-red-50 border-red-100" },
          
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-4 p-4 rounded-xl border ${s.bg}`}>
            <div className={`${s.color}`}>{s.icon}</div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-black uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-5 py-4 w-12">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.length === filteredUsers.length && filteredUsers.length > 0
                      ? <CheckSquare size={16} className="text-violet-400" />
                      : <Square size={16} className="text-white" />}
                  </button>
                </th>
                {["User", "Credentials", "Contact", "Verification", "Plan Dates", "Approved", "Rejected", "Access"].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-20 text-slate-700 text-sm">
                    No users match current filters.
                  </td>
                </tr>
              ) : filteredUsers.map((user, idx) => {
                const isSelected = selectedIds.includes(user._id);
                const isUserActionLoading = isActionLoading === user._id;
                const displayEndDate = manualDates[user._id] || (user.endDate ? new Date(user.endDate).toISOString().split('T')[0] : "");
                const isExpired = user.endDate && new Date(user.endDate) < new Date();

                return (
                  <tr
                    key={user._id}
                    className={`border-b border-slate-50 transition-colors
                      ${isSelected ? 'bg-violet-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                      hover:bg-violet-50/40`}
                  >
                    {/* Checkbox */}
                    <td className="px-5 py-4">
                      <button onClick={() => toggleSelect(user._id)}>
                        {isSelected
                          ? <CheckSquare size={16} className="text-violet-600" fill="currentColor" />
                          : <Square size={16} className="text-slate-300" />}
                      </button>
                    </td>

                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0
                          ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-black leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5">{user.loginId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Credentials */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="font-mono text-md font-semibold text-black px-2 py-0.5 rounded">{user.password}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Activity size={11} className="text-black shrink-0" />
                          <span className="text-xs text-black">+91 {user.phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={11} className="text-black shrink-0" />
                          <span className="text-[11px] text-black truncate max-w-40">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Verification */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <StatusPill label="KYC" active={user.kycStatus === 'verified' || user.kycStatus === 'approved'} />
                        <StatusPill label="Bank" active={user.bankDetailsStatus === 'verified' || user.bankDetailsStatus === 'approved'} />
                      </div>
                    </td>

                    {/* Plan Dates */}
                    <td className="px-5 py-4">
                      <div className="space-y-1 mb-2">
                        <p className="text-[10px] text-black">
                          Start: <span className="text-black font-medium">
                            {user.startDate ? new Date(user.startDate).toLocaleDateString('en-GB') : '—'}
                          </span>
                        </p>
                        <p className="text-[10px] text-black">
                          End: <span className={`font-bold ${isExpired ? 'text-red-500' : 'text-black'}`}>
                            {user.endDate ? new Date(user.endDate).toLocaleDateString('en-GB') : '—'}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg p-1">
                        <Calendar size={10} className="text-slate-400 ml-0.5 flex-shrink-0" />
                        <input
                          type="date" value={displayEndDate}
                          onChange={e => handleDateChange(user._id, e.target.value)}
                          className="bg-transparent text-[9px] font-bold outline-none cursor-pointer w-20 text-black"
                        />
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-1">
                          {manualDates[user._id] && (
                            <button
                              onClick={() => handleAccessUpdate(user._id, { fixedEndDate: manualDates[user._id] })}
                              disabled={isUserActionLoading}
                              className="p-1 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
                            >
                              {isUserActionLoading ? <Loader2 size={9} className="animate-spin" /> : <Save size={9} />}
                            </button>
                          )}
                          <button
                            onClick={() => handleAccessUpdate(user._id, { daysToAdd: 7 })}
                            disabled={isUserActionLoading}
                            className="p-1 bg-white border border-slate-200 rounded hover:bg-black hover:text-white hover:border-black transition-all"
                            title="+7 days"
                          >
                            <Plus size={9} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Approved */}
                    <td className="px-5 py-4 text-center">
                      <span className="text-2xl font-bold text-emerald-600">{user.stats?.approvedCount || 0}</span>
                    </td>

                    {/* Rejected */}
                    <td className="px-5 py-4 text-center">
                      <span className="text-2xl font-bold text-red-400">{user.stats?.rejectedCount || 0}</span>
                    </td>

                    {/* Access */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded
                          ${user.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                          {user.isActive ? 'Active' : 'Blocked'}
                        </span>
                        <button
                          disabled={isUserActionLoading}
                          onClick={() => handleAccessUpdate(user._id, { isActive: !user.isActive })}
                          className={`p-2 rounded-lg border transition-all
                            ${user.isActive
                              ? 'border-slate-200 text-black hover:bg-red-500 hover:text-white hover:border-red-500'
                              : 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'}`}
                          title={user.isActive ? 'Block user' : 'Activate user'}
                        >
                          {isUserActionLoading ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-[11px] text-slate-400">
            Showing <span className="font-bold text-slate-600">{filteredUsers.length}</span> users
            {selectedIds.length > 0 && <> · <span className="font-bold text-violet-600">{selectedIds.length} selected</span></>}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">{currentTime}</p>
        </div>
      </div>

      {/* ── FILTER MODAL ── */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md mx-4">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center border border-violet-100">
                  <Filter size={15} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Filter & Sort</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Refine user list</p>
                </div>
              </div>
              <button onClick={() => setFilterOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">

              {/* Account Status */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Account Status</label>
                <div className="flex gap-2">
                  {["all", "active", "blocked"].map(opt => (
                    <button key={opt}
                      onClick={() => setPendingFilters(p => ({ ...p, status: opt }))}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all
                        ${pendingFilters.status === opt
                          ? opt === 'active' ? 'bg-emerald-500 text-white border-emerald-500'
                            : opt === 'blocked' ? 'bg-red-500 text-white border-red-500'
                            : 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* KYC Status */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">KYC Status</label>
                <div className="flex gap-2">
                  {["all", "verified", "pending"].map(opt => (
                    <button key={opt}
                      onClick={() => setPendingFilters(p => ({ ...p, kyc: opt }))}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all
                        ${pendingFilters.kyc === opt ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Status */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Bank Status</label>
                <div className="flex gap-2">
                  {["all", "verified", "pending"].map(opt => (
                    <button key={opt}
                      onClick={() => setPendingFilters(p => ({ ...p, bank: opt }))}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all
                        ${pendingFilters.bank === opt ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* End Date Range */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Plan End Date Range</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-widest">From</p>
                    <input type="date" value={pendingFilters.endDateFrom}
                      onChange={e => setPendingFilters(p => ({ ...p, endDateFrom: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-violet-400 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-widest">To</p>
                    <input type="date" value={pendingFilters.endDateTo}
                      onChange={e => setPendingFilters(p => ({ ...p, endDateTo: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-violet-400 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sort By</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <select
                      value={pendingFilters.sortBy}
                      onChange={e => setPendingFilters(p => ({ ...p, sortBy: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none appearance-none focus:border-violet-400 transition-colors bg-white"
                    >
                      <option value="name">Name</option>
                      <option value="endDate">End Date</option>
                      <option value="joinDate">Join Date</option>
                      <option value="approved">Approved Count</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => setPendingFilters(p => ({ ...p, sortDir: p.sortDir === "asc" ? "desc" : "asc" }))}
                    className="px-4 border border-slate-200 rounded-lg hover:border-violet-400 transition-colors flex items-center gap-1.5 text-[11px] font-bold text-slate-600"
                  >
                    <ArrowUpDown size={13} />
                    {pendingFilters.sortDir === "asc" ? "ASC" : "DESC"}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                <RotateCcw size={13} /> Reset
              </button>
              <button onClick={applyFilters}
                className="flex-1 py-2.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ label, active }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border
      ${active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-200'}`} />
      {label}
    </span>
  );
}