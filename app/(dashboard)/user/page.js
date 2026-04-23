
"use client";
import { useEffect, useTransition } from "react";
import { useUserStore } from "@/store/useUserStore";
import { getKycRecord } from "@/app/actions/kyc";
import { passero, robotoSlab } from "@/lib/fonts";
import Link from "next/link";
import {
  Play, UserCircle, BarChart3, HelpCircle,
  CheckCircle2, Clock, Activity, AlertCircle, ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { autoAssignAndGetId } from "@/app/actions/userWork";
import { useState } from "react";

export default function UserDashboard() {
  const { user, updateUser } = useUserStore();
  const [isPending, startTransition] = useTransition();

  const TARGET_RESUMES = 300;
  const approved = user?.stats?.approvedCount || 0;
  const inProgress = user?.stats?.inProgressCount || 0;
  const percentage = Math.min(Math.round((approved / TARGET_RESUMES) * 100), 100);
  const userId = user?.id || user?._id;
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    async function syncData() {
      if (user?.id) {
        const res = await getKycRecord(user.id);
        if (res.success && res.data) {
          updateUser({
            kycStatus: res.data.kycStatus,
            bankDetailsStatus: res.data.bankDetailsStatus,
            stats: res.data.stats,
          });
        }
      }
    }
    startTransition(() => syncData());
  }, [user?.id]);



  const router = useRouter();
  const handleQuickStart = async () => {
    if (!userId) return alert("Session expired, login again");
    setIsAssigning(true);

    const res = await autoAssignAndGetId(userId);

    if (res.success) {
      // res.resumeId is the _id of the Master Resume we just found
      router.push(`/user/workspace/${res.resumeId}`);
    } else {
      alert(res.error); // This will now show if you actually ran out of PDFs
    }
    setIsAssigning(false);
  };


  return (
    <div className={`min-h-screen  p-8 lg:p-12 ${robotoSlab.className}`}>
      <div className="max-w-6xl mx-auto space-y-12">

        {/* --- WELCOME HEADER --- */}
        <div className="space-y-1">
          <p className="text-xs text-black/40  ml-2  mb-2 tracking-[0.3em] uppercase">
            Active / {user?.role || 'User'}
          </p>
          <h1 className="text-4xl font-light text-black">
            Welcome back, <span className="font-bold">{user?.name || "User"}</span>
          </h1>


          <p className="text-sm text-black/60 mt-2 ml-2 max-w-md">
            Your workspace is synchronized. All systems are operational and ready for task processing.
          </p>
        </div>

        {/* --- ACTION BUTTONS ROW --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={handleQuickStart}
            disabled={isAssigning}
            className={`group relative flex cursor-pointer flex-col item-center justify-center p-6 h-44 rounded-[2.5rem] transition-all active:scale-95 ${isAssigning ? "bg-black" : "bg-black hover:bg-white hover:text-black"
              } text-white shadow-2xl shadow-slate-200`}
          >

            <div className="flex justify-between ">
              <p className={`${robotoSlab.className} text-md font-black uppercase tracking-tighter leading-none`}>
                {isAssigning ? "Assigning..." : "Start Work"}
              </p>
                <ShieldCheck size={20} />
            </div>


          </button>

          <QuickAction
            href="/user/profile"
            label="Setup Profile"
            icon={<UserCircle size={20} />}
          />
          <QuickAction
            href="/user/reportuser"
            label="Check Report"
            icon={<BarChart3 size={20} />}
          />
          <QuickAction
            href="/user/queries"
            label="Queries"
            icon={<HelpCircle size={20} />}
          />
        </div>

        {/* --- PROGRESS & STATS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

          {/* Target Circular Progress - Black Card */}
          <div className="bg-black text-white rounded-[3rem] p-10 flex flex-col items-center text-center transition-all duration-500 hover:bg-white hover:text-black group shadow-xl">
            <h3 className="text-[10px] uppercase tracking-[0.2em] mb-8 opacity-50 group-hover:text-black/40">Goal Progress</h3>
            <div className="relative flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="opacity-10" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={553}
                  strokeDashoffset={553 - (553 * percentage) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`${passero.className} text-5xl`}>{percentage}%</span>
                <span className="text-[10px] uppercase opacity-50 mt-1">Target Reach</span>
              </div>
            </div>
            <p className="mt-8 text-sm opacity-70 group-hover:opacity-100">
              {approved} / {TARGET_RESUMES} approved.<br />
              Target: 300 Resumes
            </p>
          </div>

          {/* Breakdown Stats - White Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard label="Approved" value={approved} icon={<CheckCircle2 />} />
            <StatCard label="In Progress" value={inProgress} icon={<Activity />} />
            <StatCard label="Rejected" value={user?.stats?.rejectedCount || 0} icon={<AlertCircle />} />
          </div>

        </div>
      </div>
    </div>
  );
}

/* --- SUB-COMPONENTS --- */

function QuickAction({ href, label, icon, isBlack = false }) {
  // Styles for the black button (Start Work)
  const blackStyle = "bg-black text-white hover:bg-white hover:text-black shadow-lg";
  // Styles for the white buttons
  const whiteStyle = "bg-white text-black hover:bg-black hover:text-white shadow-sm";

  return (
    <Link href={href} className={`
      flex items-center justify-between p-6 rounded-[2rem] transition-all duration-500 group
      ${isBlack ? blackStyle : whiteStyle}
    `}>
      <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
      <div className={`p-2 rounded-xl transition-colors duration-500 ${isBlack ? 'bg-white/10 group-hover:bg-black/5' : 'bg-black/5 group-hover:bg-white/10'}`}>
        {icon}
      </div>
    </Link>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white text-black p-8 rounded-[2.5rem] shadow-sm transition-all duration-500 hover:bg-black hover:text-white group flex justify-between items-center">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest opacity-40 group-hover:opacity-60 font-bold">{label}</p>
        <h4 className={`${passero.className} text-4xl`}>{value}</h4>
      </div>
      <div className="p-4 rounded-2xl bg-black/5 group-hover:bg-white/10 transition-all duration-500">
        {icon}
      </div>
    </div>
  );
}