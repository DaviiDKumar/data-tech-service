"use client";

import { useState, useEffect, useTransition } from "react";
import { getAllKycRequests, updateComplianceStatus } from "@/app/actions/admin";
import { 
  CheckCircle2, X, ExternalLink, Loader2, Clock,
  ShieldCheck, Landmark, FileSearch, UserCheck, 
  AlertCircle, History, Search, Eye, MoreHorizontal
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function KycReviewPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [viewTab, setViewTab] = useState("pending"); // "pending" | "verified"
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [confirmModal, setConfirmModal] = useState({ show: false, data: null });

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const res = await getAllKycRequests();
    if (res.success) setRequests(res.data);
    setLoading(false);
  }

  // --- Logic: Filter Data based on Tab & Search ---
  const filteredData = requests.filter(req => {
    const matchesSearch = req.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isPending = req.documents?.status === 'pending' || req.bankDetails?.status === 'pending';
    const isVerified = req.documents?.status === 'verified' && req.bankDetails?.status === 'verified';

    if (viewTab === "pending") return matchesSearch && isPending;
    return matchesSearch && isVerified;
  });

  // --- Action Execution ---
  const executeAction = () => {
    const { id, type, status } = confirmModal.data;
    startTransition(async () => {
      const res = await updateComplianceStatus(id, type, status);
      if (res.success) {
        toast.success(`Record updated: ${type.toUpperCase()} is now ${status}`);
        await loadRequests(); // Refresh data
      } else {
        toast.error(`Error: ${res.error}`);
      }
      setConfirmModal({ show: false, data: null });
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={45} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Booting Compliance System...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 p-6 relative animate-in fade-in duration-700">
      <Toaster position="top-right" richColors closeButton />

      {/* --- SAAS MODAL --- */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-white/20 scale-in-center">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-lg ${confirmModal.data.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic text-center tracking-tighter">Are you sure?</h3>
            <p className="text-xs font-bold text-slate-500 mt-3 mb-10 text-center uppercase leading-relaxed tracking-tight">
              You are moving this <span className="text-slate-900">{confirmModal.data.type}</span> to <span className="underline decoration-2 underline-offset-4">{confirmModal.data.status}</span>.
              <br/>This will reflect on the user's dashboard instantly.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmModal({ show: false, data: null })} className="flex-1 py-5 rounded-2xl text-[11px] font-black uppercase border-2 border-slate-100 text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={executeAction} className="flex-1 py-5 rounded-2xl text-[11px] font-black uppercase bg-slate-900 text-white shadow-xl hover:shadow-blue-200 hover:bg-blue-600 transition-all">Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER & CONTROL BAR --- */}
      <div className="bg-slate-900 rounded-[3.5rem] p-12 flex flex-col xl:flex-row justify-between items-center shadow-2xl border-b-[8px] border-blue-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 space-y-2 text-center xl:text-left">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
            KYC <span className="text-blue-500">Vault</span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Enterprise Identity Review System</p>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 mt-8 xl:mt-0 w-full xl:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="SEARCH USER..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-14 pr-6 py-4 text-xs font-black uppercase text-white tracking-[0.2em] outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
            {["pending", "verified"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setViewTab(tab)}
                className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewTab === tab ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-500 hover:text-white'}`}
              >
                {tab === "pending" ? <History size={14}/> : <CheckCircle2 size={14}/>}
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- DATA CARDS --- */}
      <div className="grid grid-cols-1 gap-8">
        {filteredData.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[4rem] py-40 text-center">
             <FileSearch size={100} className="mx-auto mb-6 text-slate-100" />
             <p className="font-black uppercase italic text-sm tracking-[0.3em] text-slate-300">Vault Section Empty</p>
          </div>
        ) : (
          filteredData.map((req) => (
            <div key={req._id} className="bg-white border-2 border-slate-50 rounded-[4rem] p-10 flex flex-col xl:flex-row gap-12 hover:shadow-2xl transition-all group relative overflow-hidden">
              
              {/* Profile Sidebar */}
              <div className="flex flex-row xl:flex-col items-center xl:items-start gap-6 min-w-[260px] xl:border-r border-slate-100 pr-0 xl:pr-12">
                <div className="w-20 h-20 bg-slate-900 rounded-[2.2rem] flex items-center justify-center text-3xl font-black italic text-white shadow-2xl group-hover:rotate-6 transition-all duration-500">
                  {req.userId?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{req.userId?.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{req.userId?.email}</p>
                  <span className="inline-block mt-3 px-3 py-1 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">ID: {req._id.slice(-6)}</span>
                </div>
              </div>

              {/* KYC REVIEW BLOCK */}
              <div className={`flex-1 space-y-6 p-8 rounded-[3rem] border transition-all ${req.documents?.status === 'verified' ? 'bg-emerald-50/20 border-emerald-100' : 'bg-blue-50/20 border-blue-100'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className={req.documents?.status === 'verified' ? 'text-emerald-500' : 'text-blue-600'} />
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Identity Documents</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${req.documents?.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {req.documents?.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ID Proof Button */}
                  <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm flex items-center justify-between group/btn">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">{req.documents.idProof?.idType || "ID PROOF"}</p>
                        <p className="text-[11px] font-bold text-slate-800">{req.documents.idProof?.idNumber}</p>
                    </div>
                    <a href={req.documents.idProof?.fileUrl} target="_blank" className="p-3 bg-slate-50 rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <Eye size={18}/>
                    </a>
                  </div>
                  {/* Address Proof Button */}
                  <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm flex items-center justify-between group/btn">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Address Proof</p>
                        <p className="text-[11px] font-bold text-slate-800">{req.documents.addressProof?.idNumber || "Not Provided"}</p>
                    </div>
                    <a href={req.documents.addressProof?.fileUrl} target="_blank" className="p-3 bg-slate-50 rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <Eye size={18}/>
                    </a>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={req.documents?.status === 'verified' || isPending}
                    onClick={() => setConfirmModal({ show: true, data: { id: req._id, type: 'kyc', status: 'verified' } })}
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-xl transition-all disabled:opacity-20 disabled:grayscale"
                  >
                    {req.documents?.status === 'verified' ? "Identity Approved" : "Approve Identity"}
                  </button>
                  <button 
                    onClick={() => setConfirmModal({ show: true, data: { id: req._id, type: 'kyc', status: 'rejected' } })}
                    className="bg-rose-500 text-white px-6 rounded-[1.5rem] hover:bg-rose-600 transition-all flex items-center justify-center"
                  >
                    <X size={20}/>
                  </button>
                </div>
              </div>

              {/* BANK REVIEW BLOCK */}
              <div className={`flex-1 space-y-6 p-8 rounded-[3rem] border transition-all ${req.bankDetails?.status === 'verified' ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 text-slate-900">
                    <Landmark size={20} className={req.bankDetails?.status === 'verified' ? 'text-emerald-500' : 'text-slate-400'} />
                    <p className="text-[11px] font-black uppercase tracking-widest">Payout Credentials</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${req.bankDetails?.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {req.bankDetails?.status}
                  </span>
                </div>
                
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 text-[11px] font-bold text-slate-800 space-y-2 shadow-inner font-mono">
                  <p className="flex justify-between opacity-80 uppercase text-[9px]"><span>Holder:</span> {req.bankDetails.data?.accountHolderName}</p>
                  <p className="flex justify-between"><span>A/C:</span> {req.bankDetails.data?.accountNumber}</p>
                  <p className="flex justify-between border-t pt-2 mt-2 opacity-60"><span>Bank:</span> {req.bankDetails.data?.bankName} ({req.bankDetails.data?.ifscCode})</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={req.bankDetails?.status === 'verified' || isPending}
                    onClick={() => setConfirmModal({ show: true, data: { id: req._id, type: 'bank', status: 'verified' } })}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-xl transition-all disabled:opacity-20 disabled:grayscale"
                  >
                    {req.bankDetails?.status === 'verified' ? "Payout Verified" : "Verify Bank Info"}
                  </button>
                  <button 
                    onClick={() => setConfirmModal({ show: true, data: { id: req._id, type: 'bank', status: 'rejected' } })}
                    className="bg-rose-500 text-white px-6 rounded-[1.5rem] hover:bg-rose-600 transition-all flex items-center justify-center"
                  >
                    <X size={20}/>
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}