"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Edit3, Lock, ShieldCheck, Clock } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { getKycRecord } from "@/app/actions/kyc";
import { robotoSlab } from "@/lib/fonts";

export default function UserProfilePage() {
  const { user } = useUserStore();
  const [kycRecord, setKycRecord] = useState(null);
  const [isProfileLocked, setIsProfileLocked] = useState(true);

  useEffect(() => {
    async function load() {
      if (user?.id) {
        const res = await getKycRecord(user.id);
        if (res.success) setKycRecord(res.data);
      }
    }
    load();
  }, [user?.id]);

  const isKycPending = kycRecord?.documents?.status === "pending";
  const isBankPending = kycRecord?.bankDetails?.status === "pending";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 text-left font-sans">
      <nav className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
        <div>Dashboard / <span className="text-violet-600">Profile</span></div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 space-y-8">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-500 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-center text-white shadow-xl gap-6">
          <div className="flex items-center gap-10">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-slate-200 font-bold text-6xl shadow-2xl">D</div>
            <div className="space-y-4 text-left">
              <p className="text-[14px] opacity-80">Freelancer Profile</p>
              <h1 className={`${robotoSlab.className} text-4xl md:text-6xl font-bold tracking-tight text-white`}>
                {user?.name || "David kumar"}
              </h1>
              <div className="flex gap-3">
                <div className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-2">
                  <ShieldCheck size={14} /> Login ID: {user?.loginId || "NA"}
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setIsProfileLocked(!isProfileLocked)} className="px-8 py-3 bg-white text-violet-600 rounded-full text-xs font-bold shadow-xl hover:scale-105 transition-transform">
            {isProfileLocked ? <><Edit3 size={16} className="inline mr-2" /> Edit Username</> : <><Lock size={16} className="inline mr-2" /> Lock Profile</>}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Details Sidebar (60% Space) */}
          <aside className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-8 shadow-sm">
              <h2 className={`${robotoSlab.className} font-bold text-xl text-slate-900 mb-8`}>Account Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <DetailRow label="Authorized Name" value={user?.name || "David kumar"} isEdit={!isProfileLocked} />
                <DetailRow label="Primary Email" value="nikitadara9@gmail.com" isEdit={false} />
                <DetailRow label="Mobile Node" value="9509741759" isEdit={false} />
                <DetailRow label="Object ID" value="69e9f47e7785e8ab70b3c148" isEdit={false} />
              </div>
            </div>
          </aside>

          {/* Verification Section (40% Space) */}
          <main className="lg:col-span-5 flex flex-col gap-6">
            <VerificationCard
              title="KYC Details"
              status={kycRecord?.documents?.status || "create"}
              text="Please upload your ID card and address proof. This helps us know who you are so you can use all our features."
              isPending={isKycPending}
              href="/user/profile/kyc"
            />
            <VerificationCard
              title="Bank Details"
              status={kycRecord?.bankDetails?.status || "create"}
              text="Add your bank account info here. This is where we will send your money once your work is finished."
              isPending={isBankPending}
              href="/user/profile/bank"
            />
          </main>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, isEdit }) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
      {isEdit ? <input defaultValue={value} className="p-3 bg-slate-50 border border-violet-100 rounded-lg text-xs font-bold outline-none focus:border-violet-400" />
              : <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{value}</span>}
    </div>
  );
}

function VerificationCard({ title, status, isPending, href, text }) {
  const colors = { create: "bg-slate-100 text-slate-400", pending: "bg-orange-50 text-orange-500", verified: "bg-emerald-50 text-emerald-500", rejected: "bg-red-50 text-red-500" };
  return (
    <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-8 shadow-sm flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center">
        <h2 className={`${robotoSlab.className} font-bold text-xl text-slate-900`}>{title}</h2>
        <span className={`text-[10px] font-bold px-4 py-1.5 rounded-full uppercase italic ${colors[status]}`}>{status}</span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed -mt-2">{text}</p>
      <Link href={isPending ? "#" : href} className={`w-full py-4 rounded-xl font-bold text-xs text-center transition-all ${isPending ? "bg-slate-50 text-slate-300 cursor-not-allowed border" : "bg-violet-600 text-white shadow-lg shadow-violet-100 hover:bg-violet-700"}`}>
        {isPending ? <><Clock size={14} className="inline mr-2 animate-pulse" /> Verification in Progress</> : "Update / View Details"}
      </Link>
    </div>
  );
}