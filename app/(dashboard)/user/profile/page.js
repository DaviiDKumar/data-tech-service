"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { useUserStore } from "@/store/useUserStore";
import { submitKycWithFiles, submitBankDetails, getKycRecord } from "@/app/actions/kyc";
import { passero, robotoSlab } from "@/lib/fonts";
import { toast } from "sonner"; // For premium success/error messages
import {
  User, ShieldCheck, Landmark, Phone,
  Mail, Upload, Loader2, FileText, ArrowRight,
  FileCheck, ShieldAlert, Save, Fingerprint
} from "lucide-react";

export default function UserProfilePage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isPending, startTransition] = useTransition();
  const [kycRecord, setKycRecord] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // File handling
  const [idFile, setIdFile] = useState(null);
  const [addrFile, setAddrFile] = useState(null);
  const idFileRef = useRef(null);
  const addrFileRef = useRef(null);

  useEffect(() => {
    // FIX: Set state using requestAnimationFrame to satisfy ESLint cascading render rule
    const frame = requestAnimationFrame(() => setIsMounted(true));

    async function loadData() {
      if (user?.id) {
        const res = await getKycRecord(user.id);
        if (res.success) setKycRecord(res.data);
      }
    }
    loadData();

    return () => cancelAnimationFrame(frame);
  }, [user?.id]);

  console.log(user);

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append("existingIdUrl", kycRecord?.documents?.idProof?.fileUrl || "");
    formData.append("existingAddrUrl", kycRecord?.documents?.addressProof?.fileUrl || "");

    startTransition(async () => {
      const res = await submitKycWithFiles(user.id, formData);
      if (res.success) {
        toast.success("Identity records synchronized successfully.");
        const updated = await getKycRecord(user.id);
        if (updated.success) setKycRecord(updated.data);
      } else {
        toast.error(res.error || "Compliance submission failed.");
      }
    });
  };

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
      if (res.success) toast.success("Settlement credentials locked.");
      else toast.error("Bank sync failed.");
    });
  };

  if (!isMounted) return null;

  return (
    <div className={`max-w-6xl mx-auto space-y-10 pb-20 ${robotoSlab.className} text-black animate-in fade-in duration-700`}>

      {/* --- PREMIUM HEADER --- */}
      <div className="bg-black text-white rounded-[3rem] p-10 flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-8 relative z-10">
          <div className={`${passero.className} w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl text-black shadow-2xl rotate-3`}>
            {user?.name?.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className={`${passero.className} text-4xl uppercase tracking-tight`}>
              Identity <span className="opacity-40 text-gray-400">Vault</span>
            </h1>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.4em]">Node Security / {user?.role}</p>
          </div>
        </div>

        <div className="mt-8 md:mt-0 flex gap-8 bg-white/5 p-6 rounded-4xl border border-white/10 backdrop-blur-xl">
          <div className="text-center border-r border-white/10 pr-8">
            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1">KYC Status</p>
            <p className={`${passero.className} text-lg uppercase tracking-wider`}>
              {kycRecord?.documents?.status || "Pending"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1">Bank Link</p>
            <p className={`${passero.className} text-lg uppercase tracking-wider`}>
              {kycRecord?.bankDetails?.status || "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex flex-col lg:flex-row gap-10">

        {/* Navigation Tabs */}
        <div className="w-full lg:w-64 space-y-3">
          {[
            { id: 'profile', label: 'Overview', icon: <User size={18} /> },
            { id: 'kyc', label: 'KYC Vault', icon: <ShieldCheck size={18} /> },
            { id: 'bank', label: 'Settlement', icon: <Landmark size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-black text-white shadow-xl translate-x-2'
                  : 'bg-white text-black/40 hover:text-black hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center gap-4"> {tab.icon} {tab.label} </div>
              <ArrowRight size={14} className={activeTab === tab.id ? "opacity-100" : "opacity-0"} />
            </button>
          ))}
        </div>

        {/* Main Panels */}
        <div className="flex-1 bg-white rounded-[3rem] p-10 shadow-sm border border-black/5 min-h-[550px]">

          {/* TAB: KYC VAULT */}
          {activeTab === 'kyc' && (
            <form onSubmit={handleKycSubmit} className="space-y-10 animate-in fade-in slide-in-from-right-3 duration-500">
              <div className="flex items-center gap-5 border-b border-black/5 pb-8">
                <ShieldCheck size={32} className="opacity-20" />
                <h2 className={`${passero.className} text-3xl`}>Compliance Submission</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Identification Proof</label>
                  <select name="idType" className="w-full bg-gray-50 rounded-xl px-5 py-4 text-sm font-bold outline-none border border-black/5 focus:border-black">
                    <option value="pan">PAN Card</option>
                    <option value="aadhaar">Aadhaar Card</option>
                  </select>
                  <input name="idNumber" required placeholder="ENTER ID NUMBER" className="w-full bg-white border border-black/10 rounded-xl px-5 py-4 text-sm font-bold placeholder:opacity-20 outline-none focus:border-black" />
                  <div onClick={() => idFileRef.current.click()} className="border-2 border-dashed border-black/10 rounded-4xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-gray-50 transition-all">
                    {idFile ? <FileCheck className="text-black" /> : <Upload className="opacity-20" />}
                    <span className="text-[10px] font-bold uppercase opacity-60 text-center">{idFile ? idFile.name : "Upload ID Proof (PDF)"}</span>
                    <input ref={idFileRef} type="file" name="idFile" className="hidden" accept=".pdf" onChange={(e) => setIdFile(e.target.files[0])} />
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Address Verification</label>
                  <select name="addressType" className="w-full bg-gray-50 rounded-xl px-5 py-4 text-sm font-bold outline-none border border-black/5 focus:border-black">
                    <option value="utility_bill">Utility Bill</option>
                    <option value="aadhaar">Aadhaar Card</option>
                  </select>
                  <input name="addressNumber" placeholder="REF NUMBER (OPTIONAL)" className="w-full bg-white border border-black/10 rounded-xl px-5 py-4 text-sm font-bold placeholder:opacity-20 outline-none focus:border-black" />
                  <div onClick={() => addrFileRef.current.click()} className="border-2 border-dashed border-black/10 rounded-4xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-gray-50 transition-all">
                    {addrFile ? <FileCheck className="text-black" /> : <Upload className="opacity-20" />}
                    <span className="text-[10px] font-bold uppercase opacity-60 text-center">{addrFile ? addrFile.name : "Upload Address PDF"}</span>
                    <input ref={addrFileRef} type="file" name="addrFile" className="hidden" accept=".pdf" onChange={(e) => setAddrFile(e.target.files[0])} />
                  </div>
                </div>
              </div>

              <button disabled={isPending} className="w-full bg-black text-white py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.4em] transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-4">
                {isPending ? <Loader2 className="animate-spin" /> : "Verify Identity Records"}
              </button>
            </form>
          )}

          {/* TAB: BANK HUB */}
          {activeTab === 'bank' && (
            <form onSubmit={handleBankSubmit} className="space-y-10 animate-in fade-in slide-in-from-right-3 duration-500">
              <div className="flex items-center gap-5 border-b border-black/5 pb-8">
                <Landmark size={32} className="opacity-20" />
                <h2 className={`${passero.className} text-3xl`}>Payout Configuration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Beneficiary Name</label>
                  <input name="accName" required className="w-full bg-white border border-black/10 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-black" placeholder="FULL NAME AS PER BANK" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Bank Entity</label>
                  <input name="bankName" required className="w-full bg-white border border-black/10 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-black" placeholder="HDFC, ICICI, ETC" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">IFSC Code</label>
                  <input name="ifsc" required className="w-full bg-white border border-black/10 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-black" placeholder="BANK0001234" />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Account Number</label>
                  <input name="accNo" required type="password" className="w-full bg-white border border-black/10 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-black" placeholder="•••• •••• •••• ••••" />
                </div>
              </div>

              <button disabled={isPending} className="w-full bg-black text-white py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.4em] transition-all hover:scale-[1.01] disabled:opacity-50">
                {isPending ? <Loader2 className="animate-spin mx-auto" /> : "Secure Payout Credentials"}
              </button>
            </form>
          )}

          {/* TAB: PROFILE OVERVIEW & EDIT */}
          {activeTab === 'profile' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-3 duration-500">
              {/* User Card */}
              <div className="bg-gray-50 p-12 rounded-[3rem] border border-black/5 flex flex-col md:flex-row items-center gap-10">
                <div className={`${passero.className} w-32 h-32 bg-black rounded-4xl flex items-center justify-center text-6xl text-white shadow-2xl rotate-6`}>
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-center md:text-left space-y-4">
                  <p className="text-[11px] font-bold text-black/30 uppercase tracking-[0.4em]">Verified Contributor</p>
                  <h3 className={`${passero.className} text-6xl leading-none`}>{user?.name}</h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                    <span className="bg-white px-5 py-2 rounded-xl text-[10px] font-bold border border-black/5 shadow-sm lowercase">{user?.email}</span>
                    <span className="bg-black text-white px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest italic shadow-lg">Role: {user?.role}</span>
                  </div>
                </div>
              </div>

              {/* Personal Info Edit Section */}
              <div className="space-y-8 text-left">
                <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                  <Fingerprint size={20} className="opacity-20" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Personal Metadata</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold opacity-40 uppercase ml-2">Display Name</label>
                    <div className="flex items-center bg-gray-50 rounded-2xl border border-black/5 px-4 py-1 focus-within:border-black transition-all">
                      <User size={16} className="opacity-20" />
                      <input defaultValue={user?.name} className="bg-transparent w-full p-3 text-sm font-bold outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold opacity-40 uppercase ml-2">Contact Number</label>
                    <div className="flex items-center bg-gray-50 rounded-2xl border border-black/5 px-4 py-1 focus-within:border-black transition-all">
                      <Phone size={16} className="opacity-20" />
                      <input placeholder="+91 XXXX-XXXXXX" className="bg-transparent w-full p-3 text-sm font-bold outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold opacity-40 uppercase ml-2">Recovery Email</label>
                    <div className="flex items-center bg-gray-50 rounded-2xl border border-black/5 px-4 py-1 focus-within:border-black transition-all opacity-50">
                      <Mail size={16} className="opacity-20" />
                      <input disabled value={user?.email} className="bg-transparent w-full p-3 text-sm font-bold outline-none cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                <button className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                  <Save size={16} /> Update Node Info
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}