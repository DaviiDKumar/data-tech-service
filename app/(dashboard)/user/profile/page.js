"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { useUserStore } from "@/store/useUserStore";
import { submitKycWithFiles, submitBankDetails, getKycRecord } from "@/app/actions/kyc";
import { 
  User, ShieldCheck, Landmark, CheckCircle2, 
  Clock, Upload, Loader2, FileText, Mail, ArrowRight, FileCheck, ShieldAlert, Zap
} from "lucide-react";

export default function UserProfilePage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState("kyc");
  const [isPending, startTransition] = useTransition();
  const [kycRecord, setKycRecord] = useState(null);

  // File names for UI preview and refs for hidden inputs
  const [idFile, setIdFile] = useState(null);
  const [addrFile, setAddrFile] = useState(null);
  const idFileRef = useRef(null);
  const addrFileRef = useRef(null);

  // Load existing KYC & Bank data from Database
  useEffect(() => {
    async function loadData() {
      if (user?.id) {
        const res = await getKycRecord(user.id);
        if (res.success) setKycRecord(res.data);
      }
    }
    loadData();
  }, [user?.id]);

  // --- 🆔 KYC SUBMIT (Local PDF Upload) ---
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Fallback logic: Agar naya file select nahi kiya, toh purana URL bhej do
    formData.append("existingIdUrl", kycRecord?.documents?.idProof?.fileUrl || "");
    formData.append("existingAddrUrl", kycRecord?.documents?.addressProof?.fileUrl || "");

    startTransition(async () => {
      const res = await submitKycWithFiles(user.id, formData);
      if (res.success) {
        alert("✅ KYC Documents & Files Saved to /public/kyc!");
        // State refresh taaki UI update ho jaye
        const updated = await getKycRecord(user.id);
        if (updated.success) setKycRecord(updated.data);
      } else {
        alert("❌ Error: " + res.error);
      }
    });
  };

  // --- 🏦 BANK SUBMIT ---
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      accountHolderName: formData.get("accName"),
      accountNumber: formData.get("accNo"),
      ifscCode: formData.get("ifsc"),
      bankName: formData.get("bankName"),
    };

    startTransition(async () => {
      const res = await submitBankDetails(user.id, payload);
      if (res.success) alert("✅ Bank Credentials Locked!");
      else alert("❌ Error: " + res.error);
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* --- 1. HERO HEADER SECTION --- */}
      <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col md:flex-row justify-between items-center shadow-2xl border-b-[6px] border-blue-600 relative overflow-hidden">
        {/* Abstract Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -z-10" />
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.2rem] flex items-center justify-center text-5xl font-black italic text-white shadow-2xl rotate-3 border-4 border-white/10">
            {user?.name?.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
              DTS <span className="text-blue-500 underline decoration-white decoration-4">IDENTITY</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
              <Zap size={12} className="text-blue-500" /> Professional Compliance Dashboard
            </p>
          </div>
        </div>
        
        <div className="mt-8 md:mt-0 flex gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-inner">
            <div className="text-center border-r border-white/10 pr-6">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Identity Status</p>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${kycRecord?.documents?.status === 'verified' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-orange-500'}`} />
                    <p className="text-sm font-black text-white uppercase italic">{kycRecord?.documents?.status || "NOT_FOUND"}</p>
                </div>
            </div>
            <div className="text-center">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Payout Hub</p>
                <p className="text-sm font-black text-white uppercase italic">{kycRecord?.bankDetails?.status || "OFFLINE"}</p>
            </div>
        </div>
      </div>

      {/* --- 2. MAIN WORKSPACE --- */}
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 space-y-3">
          {[
            { id: 'profile', label: 'User Overview', icon: <User size={18}/> },
            { id: 'kyc', label: 'Compliance (KYC)', icon: <ShieldCheck size={18}/> },
            { id: 'bank', label: 'Bank Payouts', icon: <Landmark size={18}/> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-8 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] translate-x-2' 
                : 'bg-white border-2 border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4"> {tab.icon} {tab.label} </div>
              <ArrowRight size={14} className={activeTab === tab.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"} />
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="flex-1 bg-white border-2 border-slate-100 rounded-[3.5rem] p-10 shadow-sm min-h-[600px] relative">
          
          {/* TAB: KYC VAULT */}
          {activeTab === 'kyc' && (
            <form onSubmit={handleKycSubmit} className="space-y-12 animate-in fade-in slide-in-from-right-5 duration-500">
              <div className="flex items-center gap-5 border-b-2 border-slate-50 pb-8">
                <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl rotate-3"><ShieldCheck size={32}/></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Document Verification</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Files are securely stored in local server storage</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* ID Proof Inputs */}
                <div className="space-y-5">
                  <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 px-1 underline underline-offset-4 decoration-blue-200">
                    <FileText size={16} className="text-blue-600" /> Identity Info
                  </label>
                  <select name="idType" defaultValue={kycRecord?.documents?.idProof?.idType} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-blue-600 transition-all outline-none">
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="pan">PAN Card</option>
                  </select>
                  <input name="idNumber" defaultValue={kycRecord?.documents?.idProof?.idNumber} required placeholder="ID NUMBER (Aadhar/PAN)" className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-600 transition-all outline-none shadow-inner" />
                  
                  <div 
                    onClick={() => idFileRef.current.click()} 
                    className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${idFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/30 hover:border-blue-400 hover:bg-white'}`}
                  >
                    {idFile ? <FileCheck className="text-emerald-500" size={40} /> : <Upload className="text-slate-300" size={40} />}
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{idFile ? idFile.name : "Select Identity PDF"}</span>
                    <input ref={idFileRef} type="file" name="idFile" className="hidden" accept=".pdf" onChange={(e) => setIdFile(e.target.files[0])} />
                    {kycRecord?.documents?.idProof?.fileUrl && !idFile && <p className="text-[10px] font-black text-blue-600 underline italic mt-2">View Saved: {kycRecord.documents.idProof.fileUrl.split('/').pop()}</p>}
                  </div>
                </div>

                {/* Address Proof Inputs */}
                <div className="space-y-5">
                  <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 px-1 underline underline-offset-4 decoration-blue-200">
                    <ShieldAlert size={16} className="text-blue-600" /> Location Info
                  </label>
                  <select name="addressType" defaultValue={kycRecord?.documents?.addressProof?.idType} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-blue-600 outline-none transition-all">
                    <option value="utility_bill">Utility Bill</option>
                    <option value="rent_agreement">Rent Agreement</option>
                    <option value="aadhaar">Aadhaar Card</option>
                  </select>
                  <input name="addressNumber" defaultValue={kycRecord?.documents?.addressProof?.idNumber} placeholder="OPTIONAL REF NUMBER" className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-600 transition-all outline-none shadow-inner" />
                  
                  <div 
                    onClick={() => addrFileRef.current.click()} 
                    className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${addrFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/30 hover:border-blue-400 hover:bg-white'}`}
                  >
                    {addrFile ? <FileCheck className="text-emerald-500" size={40} /> : <Upload className="text-slate-300" size={40} />}
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{addrFile ? addrFile.name : "Select Address PDF"}</span>
                    <input ref={addrFileRef} type="file" name="addrFile" className="hidden" accept=".pdf" onChange={(e) => setAddrFile(e.target.files[0])} />
                    {kycRecord?.documents?.addressProof?.fileUrl && !addrFile && <p className="text-[10px] font-black text-blue-600 underline italic mt-2">View Saved: {kycRecord.documents.addressProof.fileUrl.split('/').pop()}</p>}
                  </div>
                </div>
              </div>

              <button disabled={isPending} className="w-full bg-slate-900 text-white py-6 rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                {isPending ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20}/> LOCK COMPLIANCE RECORD</>}
              </button>
            </form>
          )}

          {/* TAB: BANK HUB */}
          {activeTab === 'bank' && (
            <form onSubmit={handleBankSubmit} className="space-y-12 animate-in fade-in slide-in-from-right-5 duration-500">
              <div className="flex items-center gap-5 border-b-2 border-slate-50 pb-8">
                <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl -rotate-2"><Landmark size={32}/></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Settlement Hub</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure your bank account for secure payouts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3 md:col-span-2">
                   <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest px-2">Official Holder Name</label>
                   <input name="accName" defaultValue={kycRecord?.bankDetails?.data?.accountHolderName} required className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 outline-none transition-all shadow-inner" placeholder="AS PER BANK PASSBOOK" />
                </div>
                <div className="space-y-3">
                   <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest px-2">Bank Entity</label>
                   <input name="bankName" defaultValue={kycRecord?.bankDetails?.data?.bankName} required className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 outline-none shadow-inner" placeholder="E.G. ICICI BANK" />
                </div>
                <div className="space-y-3">
                   <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest px-2">Branch IFSC Code</label>
                   <input name="ifsc" defaultValue={kycRecord?.bankDetails?.data?.ifscCode} required className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 outline-none shadow-inner" placeholder="ICIC0001234" />
                </div>
                <div className="space-y-3 md:col-span-2">
                   <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest px-2">Confidential A/C Number</label>
                   <input name="accNo" defaultValue={kycRecord?.bankDetails?.data?.accountNumber} required type="password" className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 outline-none shadow-inner" placeholder="•••• •••• •••• ••••" />
                </div>
              </div>

              <button disabled={isPending} className="w-full bg-slate-900 text-white py-6 rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4">
                {isPending ? <Loader2 className="animate-spin" /> : <><Landmark size={20}/> SECURE BANK CREDENTIALS</>}
              </button>
            </form>
          )}

          {/* TAB: PROFILE OVERVIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-5 duration-500">
               <div className="bg-slate-50 p-14 rounded-[4rem] border-2 border-slate-100 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="w-36 h-36 bg-slate-900 rounded-[3rem] flex items-center justify-center text-6xl font-black text-white shadow-2xl rotate-6 group-hover:rotate-0 transition-all duration-500">
                    {user?.name?.charAt(0)}
                  </div>
                  
                  <div className="space-y-4 text-center md:text-left relative z-10">
                    <p className="text-[12px] font-black text-blue-600 uppercase tracking-[0.6em]">Full-Stack Contributor</p>
                    <h3 className="text-6xl font-black text-slate-900 italic tracking-tighter leading-none">{user?.name}</h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-5 mt-6">
                        <span className="bg-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase border-2 border-slate-200 flex items-center gap-3 shadow-sm hover:border-blue-400 transition-all"><Mail size={14} className="text-blue-600"/> {user?.email}</span>
                        <span className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase flex items-center gap-3 italic tracking-widest shadow-xl">Role: {user?.role}</span>
                    </div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}