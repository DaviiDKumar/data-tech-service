"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllUsers, manageUserAccess } from "@/app/actions/admin";
import { exportToCSV } from "@/lib/exportCSV";
import { passero, robotoSlab } from "@/lib/fonts";
import {
  Mail, Fingerprint, Loader2, Download, CheckSquare,
  Square, Zap, Search, Calendar, Activity, Power, Save, Plus
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [manualDates, setManualDates] = useState({});

  // 1. Memoized fetchData to prevent cascading render warnings
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Audit Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);


  // 2. React 19 Compliant Effect
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      await fetchData();
    };
    init();

    const interval = setInterval(() => {
      if (isMounted) setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.loginId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleDateChange = (userId, newDate) => {
    setManualDates(prev => ({ ...prev, [userId]: newDate }));
  };

  const handleAccessUpdate = async (userId, updates) => {
    setIsActionLoading(userId);
    const res = await manageUserAccess(userId, updates);
    if (res.success) {
      setManualDates(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      await fetchData(false);
    } else {
      alert(res.error || "Update failed");
    }
    setIsActionLoading(null);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) setSelectedIds([]);
    else setSelectedIds(filteredUsers.map(u => u._id));
  };

  const handleExportCSV = () => {
    if (selectedIds.length === 0) return;
    const selectedData = users.filter(u => selectedIds.includes(u._id));
    const headers = ["Login_ID", "Full_Name", "Email", "Phone_Number", "KYC_Status", "Bank_Status", "Account_Status", "Plan_Start", "Plan_End", "Approved", "Rejected"];
    const formatted = selectedData.map(u => ({
      Login_ID: u.loginId,
      Password: u.password,
      Full_Name: u.name,
      Email: u.email,
      Phone_Number: u.phone,
      KYC_Status: u.kycStatus || "pending",
      Bank_Status: u.bankDetailsStatus || "pending",
      Account_Status: u.isActive ? "Active" : "Disabled",
      Plan_Start: u.startDate ? new Date(u.startDate).toLocaleDateString('en-GB') : "N/A",
      Plan_End: u.endDate ? new Date(u.endDate).toLocaleDateString('en-GB') : "N/A",
      Approved: u.stats?.approvedCount || 0,
      Rejected: u.stats?.rejectedCount || 0
    }));
    exportToCSV(formatted, "User_Audit_Report", headers);
  };

  if (loading && users.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-200 gap-4 text-black">
      <Loader2 className="animate-spin" size={40} />
      <span className={`${passero.className} text-xl tracking-widest`}>Syncing Database...</span>
    </div>
  );

  return (
    <div className={`p-6 lg:p-10 min-h-screen bg-gray-200 ${robotoSlab.className} text-black`}>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Administration</p>
          </div>
          <h1 className={`${passero.className} text-6xl uppercase italic tracking-tighter leading-none`}>
            User <span className="opacity-20 italic">Roster</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input
              type="text" placeholder="Filter node..."
              className="w-full lg:w-80 bg-white rounded-2xl pl-12 pr-4 py-4 text-xs font-bold outline-none shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleExportCSV} disabled={selectedIds.length === 0} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${selectedIds.length > 0 ? 'bg-black text-white hover:scale-105' : 'bg-white/50 text-black/20 cursor-not-allowed'}`}>
            <Download size={16} /> Audit Export ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Table Interface */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white/40">
                <th className="p-6 text-left w-20">
                  <button onClick={toggleSelectAll}>{selectedIds.length === filteredUsers.length ? <CheckSquare size={20} className="text-white" /> : <Square size={20} />}</button>
                </th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-left">Identity </th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-left">Passwords</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-left">Contact Info</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">KYC?</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center italic">User Date</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center italic">Approved</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center italic">Rejected</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const isSelected = selectedIds.includes(user._id);
                const isUserActionLoading = isActionLoading === user._id;
                const displayEndDate = manualDates[user._id] || (user.endDate ? new Date(user.endDate).toISOString().split('T')[0] : "");

                return (
                  <tr key={user._id} className={`transition-all duration-300 ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}>
                    <td className="p-6">
                      <button onClick={() => toggleSelect(user._id)} className={isSelected ? 'text-black' : 'text-black/10 group-hover:text-black/30'}>
                        {isSelected ? <CheckSquare size={22} fill="currentColor" /> : <Square size={22} />}
                      </button>
                    </td>

                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`${passero.className} w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
                          {user.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight leading-none mb-1.5">{user.name}</p>
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-black/40 uppercase tracking-tighter"><Fingerprint size={10} /> {user.loginId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-6 border-l border-gray-50">
                      <div className="flex flex-col gap-2">
                        {/* Login ID Row */}


                        {/* Password Row */}
                        <div className="flex items-center gap-3">
                         
                          <div className="flex flex-col">
                           
                            <span className="text-[14px] font-bold text-black tracking-tight">
                              {user.password}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-6 border-l border-gray-50">
                      <div className="flex flex-col gap-2">
                        {/* Phone Row */}
                        <div className="flex items-center gap-3 group/phone">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-black/40 group-hover/phone:bg-black group-hover/phone:text-white transition-all duration-300 shadow-sm">
                            <Activity size={12} /> {/* Using Activity as a signal/comm icon */}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase tracking-widest text-black/20">Mobile Link</span>
                            <span className="text-[10px] font-bold text-black tracking-tight">
                              +91 {user.phone || '00000-00000'}
                            </span>
                          </div>
                        </div>

                        {/* Email Row */}
                        <div className="flex items-center gap-3 group/email">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-black/40 group-hover/email:bg-black group-hover/email:text-white transition-all duration-300 shadow-sm">
                            <Mail size={12} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase tracking-widest text-black/20">Auth Email</span>
                            <span className="text-[9px] font-medium text-black/60 lowercase tracking-tighter truncate max-w-[150px]">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>



                    <td className="p-6">
                      <div className="flex flex-col items-center gap-1.5">
                        <Badge label={`KYC: ${user.kycStatus || 'pending'}`} active={user.kycStatus === 'approved'} />
                        <Badge label={`BNK: ${user.bankDetailsStatus || 'pending'}`} active={user.bankDetailsStatus === 'approved'} />
                      </div>
                    </td>

                    {/* --- PLAN MANAGEMENT --- */}
                    <td className="p-6">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex flex-col gap-1 text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <span className="text-[7px] font-black uppercase tracking-tighter opacity-30">Joined:</span>
                            <span className="text-[9px] font-bold text-black/40">
                              {user.startDate ? new Date(user.startDate).toLocaleDateString('en-GB') : '---'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-center">
                            <span className="text-[7px] font-black uppercase tracking-tighter opacity-30">Expires:</span>
                            <span className={`text-[9px] font-black ${user.isActive ? 'text-black' : 'text-red-500'}`}>
                              {user.endDate ? new Date(user.endDate).toLocaleDateString('en-GB') : '---'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-inner">
                          <Calendar size={11} className="text-black/40 ml-1" />
                          <input
                            type="date"
                            value={displayEndDate}
                            onChange={(e) => handleDateChange(user._id, e.target.value)}
                            className="bg-transparent text-[9px] font-bold uppercase outline-none cursor-pointer w-24"
                          />
                          <div className="flex items-center gap-1 border-l border-gray-200 pl-1">
                            {manualDates[user._id] && (
                              <button
                                onClick={() => handleAccessUpdate(user._id, { fixedEndDate: manualDates[user._id] })}
                                disabled={isUserActionLoading}
                                className="p-1.5 bg-black text-white rounded-lg hover:scale-110 transition-all flex items-center justify-center"
                              >
                                {isUserActionLoading ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                              </button>
                            )}
                            <button
                              onClick={() => handleAccessUpdate(user._id, { daysToAdd: 7 })}
                              disabled={isUserActionLoading}
                              className="p-1.5 bg-white border border-black/10 rounded-lg hover:bg-black hover:text-white transition-all group"
                            >
                              <Plus size={10} strokeWidth={3} className="group-hover:scale-125 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* --- APPROVED COLUMN --- */}
                    <td className="p-6 border-x border-gray-50">
                      <div className="flex flex-col items-center group">

                        <div className="flex items-center gap-2">

                          <div className={`${passero.className} text-3xl text-black leading-none`}>
                            {user.stats?.approvedCount || 0}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* --- REJECTED COLUMN --- */}
                    <td className="p-6">
                      <div className="flex flex-col items-center group">

                        <div className="flex items-center gap-2">

                          <div className={`${passero.className} text-3xl text-black/20 group-hover:text-red-500/40 transition-colors leading-none`}>
                            {user.stats?.rejectedCount || 0}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${user.isActive ? 'text-black' : 'text-red-500'}`}>
                          {user.isActive ? 'Authorized' : 'Blocked'}
                        </span>
                        <button
                          disabled={isUserActionLoading}
                          onClick={() => handleAccessUpdate(user._id, { isActive: !user.isActive })}
                          className={`p-2.5 rounded-xl border ${user.isActive ? 'border-zinc-200 text-zinc-400 hover:bg-black hover:text-white' : 'border-black bg-black text-white'}`}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, active }) {
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border w-24 text-center transition-colors ${active ? 'bg-black text-white border-black' : 'bg-white text-black/30 border-gray-100'
      }`}>
      {label}
    </span>
  );
}