"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { getKycRecord, submitBankDetails } from "@/app/actions/kyc";
import { ArrowLeft, Lock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function BankDetailsPage() {
  const { user } = useUserStore();
  const [isPending, startTransition] = useTransition();
  const [kycRecord, setKycRecord] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (user?.id) {
        const res = await getKycRecord(user.id);
        if (res.success) setKycRecord(res.data);
      }
      setIsMounted(true);
    }
    loadData();
  }, [user?.id]);

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // CRITICAL: Mapping frontend 'name' attributes to the 7 backend schema keys
    const payload = {
      bankName: formData.get("bankName"),
      accountNumber: formData.get("accountNumber"),
      accountHolderName: formData.get("accountHolderName"),
      ifscCode: formData.get("ifscCode"),
      accountType: formData.get("accountType"),
      paymentMethod: formData.get("paymentMethod"),
      paymentMobile: formData.get("paymentMobile"),
    };

    startTransition(async () => {
      const res = await submitBankDetails(user?.id, payload);
      if (res.success) {
        toast.success("Full settlement profile synchronized.");
        window.location.reload(); 
      } else {
        toast.error(res.error || "Sync failed.");
      }
    });
  };

  if (!isMounted) return null;

  const isLocked = kycRecord?.bankDetails?.status === "pending";

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 text-left">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Add Bank Details</h1>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Dashboard / <span className="text-violet-600">Settlement</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 md:p-12">
        <div className="flex justify-between items-start mb-12">
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-800">Payout Credentials</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Node Status: {kycRecord?.bankDetails?.status || "create"}</p>
          </div>
          <Link href="/user/profile" className="flex items-center gap-2 px-8 py-2.5 bg-red-700 text-white rounded-full text-xs font-bold hover:bg-red-800 transition-all shadow-lg shadow-red-100">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>

        <form onSubmit={handleBankSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <BankInput label="Bank Entity Name" name="bankName" defaultValue={kycRecord?.bankDetails?.data?.bankName} disabled={isLocked} />
            <BankInput label="Account Number" name="accountNumber" type="password" disabled={isLocked} placeholder="••••••••••••" />
            <BankInput label="Authorized Holder Name" name="accountHolderName" defaultValue={kycRecord?.bankDetails?.data?.accountHolderName || "David kumar"} disabled={isLocked} />
            <BankInput label="IFSC Code" name="ifscCode" defaultValue={kycRecord?.bankDetails?.data?.ifscCode} disabled={isLocked} />
            
            <BankSelect label="Account Type" name="accountType" options={['Savings', 'Current']} defaultValue={kycRecord?.bankDetails?.data?.accountType} disabled={isLocked} />
            <BankSelect label="Settlement Method" name="paymentMethod" options={['UPI', 'Bank Transfer (NEFT/IMPS)']} defaultValue={kycRecord?.bankDetails?.data?.paymentMethod} disabled={isLocked} />
            
            <div className="md:col-span-1">
              <BankInput label="Payment Mobile Number *" name="paymentMobile" defaultValue={kycRecord?.bankDetails?.data?.paymentMobile || "9509741759"} disabled={isLocked} />
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 italic">
              <Lock size={12} /> Data encrypted via DTS Node Security Protocol.
            </div>
            <button 
              type="submit" 
              disabled={isLocked || isPending} 
              className={`w-full md:w-auto px-16 py-4 rounded-xl font-bold text-xs shadow-xl transition-all ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isPending ? <Loader2 className="animate-spin" /> : isLocked ? "Pending Verification" : "Save Settlement Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── HELPERS ───
function BankInput({ label, name, type = "text", defaultValue, disabled, placeholder }) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        name={name} type={type} defaultValue={defaultValue} disabled={disabled} placeholder={placeholder}
        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 disabled:opacity-50 transition-all" 
      />
    </div>
  );
}

function BankSelect({ label, name, options, defaultValue, disabled }) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select name={name} defaultValue={defaultValue} disabled={disabled} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none appearance-none disabled:opacity-50">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}