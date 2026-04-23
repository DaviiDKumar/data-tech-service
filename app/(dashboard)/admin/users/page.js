"use client";
import { useState, useEffect, useMemo } from "react";
import { getAllUsers } from "@/app/actions/admin";
import { exportToCSV } from "@/lib/exportCSV";
import { passero, robotoSlab } from "@/lib/fonts";
import { 
  Mail, Fingerprint, ShieldCheck, Landmark, 
  Loader2, Download, CheckSquare, Square, Zap, 
  Search, Calendar, User, Activity, Filter
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Fix: Hydration-safe clock
    const frame = requestAnimationFrame(() => setCurrentTime(new Date().toLocaleTimeString()));
    
    let cancelled = false;
    async function fetchData() {
      try {
        const result = await getAllUsers();
        if (!cancelled && result.success) setUsers(result.data);
      } catch (error) { console.error(error); }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchData();
    return () => { 
      cancelled = true; 
      cancelAnimationFrame(frame);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.loginId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

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

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-200 gap-4">
      <Loader2 className="animate-spin text-black" size={40} />
      <span className={`${passero.className} text-xl tracking-widest text-black`}>Syncing Database...</span>
    </div>
  );

  return (
    <div className={`p-6 lg:p-10 min-h-screen bg-gray-200 ${robotoSlab.className} text-black`}>
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Personnel Directory</p>
          </div>
          <h1 className={`${passero.className} text-6xl uppercase italic tracking-tighter leading-none`}>
            User <span className="opacity-20 italic">Roster</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input 
              type="text" placeholder="Filter node by name or ID..." 
              className="w-full lg:w-80 bg-white rounded-2xl pl-12 pr-4 py-4 text-xs font-bold shadow-sm focus:ring-4 focus:ring-black/5 outline-none transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportCSV}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-500 shadow-sm ${
              selectedIds.length > 0 ? 'bg-black text-white hover:scale-105 active:scale-95' : 'bg-white/50 text-black/20 cursor-not-allowed'
            }`}
          >
            <Download size={16} /> Audit Export ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white/40">
                <th className="p-6 text-left w-20">
                  <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                    {selectedIds.length === filteredUsers.length ? <CheckSquare size={20} className="text-white" /> : <Square size={20} />}
                  </button>
                </th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-left">Identity Node</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Compliance</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Plan Period</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Accuracy (A/R)</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Access Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const isSelected = selectedIds.includes(user._id);
                return (
                  <tr key={user._id} className={`group transition-all duration-500 ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}>
                    
                    <td className="p-6">
                      <button onClick={() => toggleSelect(user._id)} className={`${isSelected ? 'text-black' : 'text-black/10 group-hover:text-black/30'}`}>
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
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-black/40 uppercase tracking-tighter">
                              <Fingerprint size={10} /> {user.loginId}
                            </span>
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-black/20 lowercase">
                              <Mail size={10} /> {user.email}
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

                    <td className="p-6 text-center">
                      <div className="inline-flex flex-col gap-1 text-[10px] font-black uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5 opacity-40"><Calendar size={10}/> {user.startDate ? new Date(user.startDate).toLocaleDateString('en-GB') : '---'}</span>
                        <span className="flex items-center gap-1.5 text-red-500"><Activity size={10}/> {user.endDate ? new Date(user.endDate).toLocaleDateString('en-GB') : '---'}</span>
                      </div>
                    </td>

                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div title="Approved" className={`${passero.className} text-xl text-black`}>{user.stats?.approvedCount || 0}</div>
                        <div className="w-px h-6 bg-gray-100"></div>
                        <div title="Rejected" className={`${passero.className} text-xl text-black/20`}>{user.stats?.rejectedCount || 0}</div>
                      </div>
                    </td>

                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${user.isActive ? 'text-black' : 'text-red-500'}`}>
                          {user.isActive ? 'Active Node' : 'Access Revoked'}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-black animate-pulse' : 'bg-red-500'}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- FOOTER --- */}
      <div className="mt-8 flex justify-between items-center px-4">
        <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">Directory Sync: {currentTime || "--:--:--"}</p>
        <div className="flex items-center gap-2 text-black/20">
          <Zap size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">GrowthForge DTS</span>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, active }) {
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border w-24 text-center transition-colors ${
      active ? 'bg-black text-white border-black' : 'bg-white text-black/30 border-gray-100'
    }`}>
      {label}
    </span>
  );
}