"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { getKycRecord, submitKycWithFiles } from "@/app/actions/kyc";
import { 
  Upload, ArrowLeft, ShieldCheck, Loader2, 
  FileCheck, AlertCircle, Database, CheckCircle 
} from "lucide-react";
import { toast } from "sonner";

export default function KYCVerificationPage() {
  const { user } = useUserStore();
  const [isPending, startTransition] = useTransition();
  const [kycRecord, setKycRecord] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // File states
  const [idFile, setIdFile] = useState(null);
  const [addrFile, setAddrFile] = useState(null);
  const idFileRef = useRef(null);
  const addrFileRef = useRef(null);

  useEffect(() => {
    let active = true;
    const frame = requestAnimationFrame(() => { if (active) setIsMounted(true); });

    async function loadData() {
      if (user?.id) {
        const res = await getKycRecord(user.id);
        if (res.success && active) setKycRecord(res.data);
      }
    }
    loadData();
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [user?.id]);

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await submitKycWithFiles(user?.id, formData);
      if (res.success) {
        toast.success("Identity records synchronized.");
        const updated = await getKycRecord(user?.id);
        if (updated.success) setKycRecord(updated.data);
      } else {
        toast.error(res.error || "Compliance submission failed.");
      }
    });
  };

  if (!isMounted) return null;

  const isLocked = kycRecord?.documents?.status === "pending";
  const isVerified = kycRecord?.documents?.status === "verified";

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      
      {/* ─── HEADER ─── */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
          Dashboard / <span className="text-violet-600">KYC Docs</span>
        </div>
      </div>

      {/* ─── COMPLIANCE CARD ─── */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 md:p-12">
          
          <div className="flex justify-between items-start mb-12">
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-800">Identity Upload Console</h2>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                Current Status: <span className={isVerified ? "text-emerald-500" : "text-orange-500"}>
                  {kycRecord?.documents?.status || "Create"}
                </span>
              </p>
            </div>
            <Link href="/user/profile" className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-all">
              <ArrowLeft size={14} /> Back to Profile
            </Link>
          </div>

          <form onSubmit={handleKycSubmit} className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* LEFT: SELECTION & ID NUMBERS */}
              <div className="space-y-10">
                <div className="space-y-6">
                  <KycInput 
                    label="ID Proof Type" 
                    name="idType"
                    type="select"
                    disabled={isLocked}
                    defaultValue={kycRecord?.documents?.idProof?.idType || "pan"}
                    options={[
                      { value: 'pan', label: 'PAN Card' },
                      { value: 'aadhaar', label: 'Aadhar Card' },
                      { value: 'voter_id', label: 'Voter ID' },
                      { value: 'passport', label: 'Passport' }
                    ]} 
                  />
                  <KycInput 
                    label="Identity Number" 
                    name="idNumber"
                    type="text"
                    disabled={isLocked}
                    defaultValue={kycRecord?.documents?.idProof?.idNumber}
                    placeholder="Enter Card / Passport Number"
                  />
                </div>

                <div className="space-y-6">
                  <KycInput 
                    label="Address Proof Type" 
                    name="addressType"
                    type="select"
                    disabled={isLocked}
                    defaultValue={kycRecord?.documents?.addressProof?.idType || "electricy_bill"}
                    options={[
                      { value: 'electricy_bill', label: 'Electricity Bill' },
                      { value: 'rent_agreement', label: 'Rent Agreement' },
                      { value: 'water_bill', label: 'Water Bill' },
                      { value: 'gas_bill', label: 'Gas Bill' },
                      { value: 'other_bill', label: 'Other Bill' }
                    ]} 
                  />
                  <KycInput 
                    label="Address Doc Number" 
                    name="addressNumber"
                    type="text"
                    disabled={isLocked}
                    defaultValue={kycRecord?.documents?.addressProof?.idNumber}
                    placeholder="Enter Bill / Agreement ID"
                  />
                </div>
                
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                  <ShieldCheck className="text-blue-500 shrink-0 mt-0.5" size={20} />
                  <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase italic">
                    Identity data is protected under DTS Node Security Protocols. No numeric digits are stored in plain text.
                  </p>
                </div>
              </div>

              {/* RIGHT: FILE UPLOADS */}
              <div className="space-y-10">
                <UploadContainer 
                  label="Upload ID Proof (PDF)" 
                  name="idFile"
                  file={idFile} 
                  setFile={setIdFile} 
                  inputRef={idFileRef} 
                  disabled={isLocked}
                  existingUrl={kycRecord?.documents?.idProof?.fileUrl}
                />
                <UploadContainer 
                  label="Upload Address Proof (PDF)" 
                  name="addrFile"
                  file={addrFile} 
                  setFile={setAddrFile} 
                  inputRef={addrFileRef}
                  disabled={isLocked}
                  existingUrl={kycRecord?.documents?.addressProof?.fileUrl}
                />
                <input type="hidden" name="existingIdUrl" defaultValue={kycRecord?.documents?.idProof?.fileUrl} />
                <input type="hidden" name="existingAddrUrl" defaultValue={kycRecord?.documents?.addressProof?.fileUrl} />
              </div>

            </div>

            {/* ─── ACTION FOOTER ─── */}
            <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <Database size={16} className="text-slate-300" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  AES-256 Storage Sync / Node: {user?.id?.slice(-8).toUpperCase()}
                </p>
              </div>

              <button 
                type="submit" 
                disabled={isPending || isLocked}
                className={`w-full md:w-auto px-16 py-4 rounded-xl font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                  isLocked ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : 
                 isLocked ? "Awaiting Validation" : "Submit/Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── HELPERS ───

function KycInput({ label, name, type, options, defaultValue, placeholder, disabled }) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      {type === "select" ? (
        <select 
          name={name} 
          disabled={disabled}
          defaultValue={defaultValue}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 appearance-none disabled:opacity-50 transition-all capitalize"
        >
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input 
          name={name}
          type="text"
          disabled={disabled}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 disabled:opacity-50 transition-all placeholder:text-slate-300"
        />
      )}
    </div>
  );
}

function UploadContainer({ label, name, file, setFile, inputRef, disabled, existingUrl }) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div 
        onClick={() => !disabled && inputRef.current.click()}
        className={`group border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50/50' : 
          file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-600 hover:bg-slate-50 cursor-pointer'
        }`}
      >
        <div className={`p-4 rounded-2xl mb-4 transition-transform ${!disabled && 'group-hover:-translate-y-1'} ${file ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-300'}`}>
          {file ? <FileCheck size={32} /> : <Upload size={32} />}
        </div>
        
        <p className="text-sm font-bold text-slate-900">{file ? file.name : (existingUrl ? "Document Archived" : "Click to Upload PDF")}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
          {file ? "File Loaded" : (existingUrl ? "Stored in Cloudinary" : "Max size 5MB")}
        </p>
        
        <input 
          ref={inputRef} 
          name={name}
          type="file" 
          className="hidden" 
          accept=".pdf" 
          onChange={(e) => setFile(e.target.files[0])} 
        />

        {existingUrl && !file && (
          <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
            <CheckCircle size={10} className="text-emerald-500" />
            <span className="text-[9px] font-black text-emerald-600 uppercase">Synced</span>
          </div>
        )}
      </div>
    </div>
  );
}