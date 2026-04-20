"use client";
import { useState, useEffect, useMemo } from "react";
import { getAllUsers } from "@/app/actions/admin";
import { exportToCSV } from "@/lib/exportCSV";
import { 
  Users, Mail, Fingerprint, ShieldCheck, Landmark, 
  Loader2, Download, CheckSquare, Square, Zap, 
  Search, Calendar, ChevronRight, Phone
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const result = await getAllUsers();
        if (!cancelled && result.success) setUsers(result.data);
      } catch (error) { console.error(error); }
      finally { if (!cancelled) setTimeout(() => setLoading(false), 0); }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.loginId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) setSelectedIds([]);
    else setSelectedIds(filteredUsers.map(u => u._id));
  };

  // --- 🚀 FIX: PROPER COLUMN EXPORT ---
  const handleExportCSV = () => {
    if (selectedIds.length === 0) return;
    const selectedData = users.filter(u => selectedIds.includes(u._id));
    
    // Headers ko alag-alag rakha hai
    const headers = [
      "Login_ID", "Full_Name", "Email", "Phone_Number", 
      "KYC_Status", "Bank_Status", "Account_Status",
      "Plan_Start_Date", "Plan_End_Date", "Joining_Date",
      "Approved_Count", "Rejected_Count", "Submitted_Count"
    ];

    const formatted = selectedData.map(u => ({
      Login_ID: u.loginId,
      Full_Name: u.name,
      Email: u.email,
      Phone_Number: u.phone,
      KYC_Status: u.kycStatus || "pending",
      Bank_Status: u.bankDetailsStatus || "pending",
      Account_Status: u.isActive ? "Active" : "Disabled",
      // Date formatting for Excel
      Plan_Start_Date: u.startDate ? new Date(u.startDate).toLocaleDateString('en-GB') : "N/A",
      Plan_End_Date: u.endDate ? new Date(u.endDate).toLocaleDateString('en-GB') : "N/A",
      Joining_Date: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : "N/A",
      Approved_Count: u.stats?.approvedCount || 0,
      Rejected_Count: u.stats?.rejectedCount || 0,
      Submitted_Count: u.stats?.submittedCount || 0
    }));

    exportToCSV(formatted, "Detailed_Workforce_Report", headers);
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
    <Loader2 className="animate-spin text-blue-600" size={40} />
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Database...</span>
  </div>;

  return (
    <div className="p-4 md:p-10 max-w-425 mx-auto min-h-screen bg-[#F8FAFC]">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-600"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Admin Control Panel</span>
          </div>
          <h1 className="text-6xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            User <span className="text-blue-600">Roster</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Filter by name or ID..." 
              className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold shadow-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportCSV}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
              selectedIds.length > 0 ? 'bg-slate-900 text-white shadow-2xl hover:bg-blue-600 scale-105 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download size={16} /> Export Selected ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Modern Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900">
                <th className="p-6 text-left">
                  <button onClick={toggleSelectAll} className="text-white hover:text-blue-400 transition-colors">
                    {selectedIds.length === filteredUsers.length ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Basic Info</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Compliance</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Plan Start</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Plan End</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Metrics (A/R/S)</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => {
                const isSelected = selectedIds.includes(user._id);
                return (
                  <tr key={user._id} className={`group transition-all duration-300 ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'}`}>
                    
                    {/* Checkbox */}
                    <td className="p-6">
                      <button onClick={() => toggleSelect(user._id)} className={`${isSelected ? 'text-blue-600' : 'text-slate-200 group-hover:text-slate-300'}`}>
                        {isSelected ? <CheckSquare size={22} fill="currentColor" /> : <Square size={22} />}
                      </button>
                    </td>

                    {/* Name & Contact */}
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-lg shadow-sm ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                          {user.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{user.name}</p>
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-blue-600 uppercase tracking-tighter">
                              <Fingerprint size={10} /> {user.loginId}
                            </span>
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 lowercase">
                              <Mail size={10} /> {user.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* KYC & Bank */}
                    <td className="p-6">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border w-24 text-center ${user.kycStatus === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          KYC: {user.kycStatus || 'pending'}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border w-24 text-center ${user.bankDetailsStatus === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                          BNK: {user.bankDetailsStatus || 'pending'}
                        </span>
                      </div>
                    </td>

                    {/* Plan Start */}
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-inner">
                        <Calendar size={12} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-700 uppercase">
                          {user.startDate ? new Date(user.startDate).toLocaleDateString('en-GB') : '---'}
                        </span>
                      </div>
                    </td>

                    {/* Plan End */}
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                        <Calendar size={12} className="text-red-500" />
                        <span className="text-[10px] font-black text-red-700 uppercase">
                          {user.endDate ? new Date(user.endDate).toLocaleDateString('en-GB') : '---'}
                        </span>
                      </div>
                    </td>

                    {/* Metrics */}
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div title="Approved" className="bg-emerald-500 text-white text-[10px] font-black w-8 py-1.5 rounded-lg shadow-lg shadow-emerald-100">{user.stats?.approvedCount || 0}</div>
                        <div title="Rejected" className="bg-rose-500 text-white text-[10px] font-black w-8 py-1.5 rounded-lg shadow-lg shadow-rose-100">{user.stats?.rejectedCount || 0}</div>
                        <div title="Submitted" className="bg-blue-500 text-white text-[10px] font-black w-8 py-1.5 rounded-lg shadow-lg shadow-blue-100">{user.stats?.submittedCount || 0}</div>
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${user.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {user.isActive ? 'System Active' : 'Access Denied'}
                        </span>
                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${user.isActive ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 flex justify-between items-center px-4">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Directory Last Sync: {new Date().toLocaleTimeString()}</p>
        <div className="flex items-center gap-2 text-slate-300">
          <Zap size={14} fill="currentColor" />
          <span className="text-[10px] font-black uppercase tracking-widest">GrowthForge DTS Engine</span>
        </div>
      </div>
    </div>
  );
}