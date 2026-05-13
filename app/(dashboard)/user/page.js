
"use client";
import { useEffect, useState, useTransition } from "react";
import { useUserStore } from "@/store/useUserStore";
import { passero, robotoSlab } from "@/lib/fonts";
import Link from "next/link";
import {
  UserCircle, BarChart3, HelpCircle,
  IndianRupee, TrendingUp, SquareCheckBig, CheckCheck, ArrowUpRight, Clock, Calendar, AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { autoAssignAndGetId } from "@/app/actions/userWork";
import { getUserTodayAndTotalWork } from "@/app/actions/userWork";
import Logout from "@/components/Logout";





export default function UserDashboard() {
  const { user, updateUser } = useUserStore();
  const [isPending, startTransition] = useTransition();


  const userId = user?.id || user?._id;
  const endDate = user?.endDate || user?.stats?.endDate;
  const [isAssigning, setIsAssigning] = useState(false);

  // Inside UserDashboard.js
  const [workCounts, setWorkCounts] = useState({ total: 0, today: 0 });

  useEffect(() => {
    async function syncData() {
      if (user?.id) {
        // Fetch both KYC/General Stats AND the specific Work Counts
        const [countRes] = await Promise.all([

          getUserTodayAndTotalWork(user.id)
        ]);

        if (countRes.success) {
          setWorkCounts(countRes.counts);
        }
      }
    }
    syncData();
  }, [user?.id]);

  // 1. Put these states at the top of your function

  // 1. States at the top
  const [timeLeft, setTimeLeft] = useState({ d: "00", h: "00", m: "00", s: "00" });
  const [timeProgress, setTimeProgress] = useState(0);

  // 2. The Final Fixed Effect
  useEffect(() => {
    // Check root first, then fallback to stats, then fallback to createdAt
    const rawStart = user?.startDate || user?.createdAt;
    const rawEnd = user?.endDate ;

    if (!rawStart || !rawEnd) {
      console.warn("Timer: Waiting for valid dates...", { rawStart, rawEnd });
      return;
    }

    const start = new Date(rawStart).getTime();
    const end = new Date(rawEnd).getTime();

    if (isNaN(start) || isNaN(end)) {
      console.error("Timer: Date parsing failed.");
      return;
    }

    const tick = () => {
      const now = Date.now();
      const total = end - start;
      const remaining = end - now;

      // Progress math
      const elapsed = now - start;
      const currentProgress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
      setTimeProgress(currentProgress);

      if (remaining <= 0) {
        setTimeLeft({ d: "00", h: "00", m: "00", s: "00" });
        return;
      }

      // Time calculations
      const d = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const h = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft({
        d: String(d).padStart(2, "0"),
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    };

    const timerId = setInterval(tick, 1000);
    tick(); // Run immediately

    return () => clearInterval(timerId);

    // FIX: Added 'user' to dependencies to satisfy ESLint and handle loading states
  }, [user]);



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
    <div className={`min-h-screen pt-0 p-8 lg:p-8 lg:pt-0 ${robotoSlab.className}`}>
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="h-20 flex items-center border-b-2 border-slate-300 justify-between  sticky top-0 z-40 backdrop-blur-xl">

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-left">
                <p className={`${passero.className} text-[18px] font-bold text-violet-700 leading-none`}>
                  User ID : <span className={` ${robotoSlab.className} text-[17px] font-bold text-black`}> {userId || "N/A"}</span>
                </p>
                <p className={`${passero.className} text-[15px] font-bold text-violet-700 leading-none mt-1`}>
                  Last Date : <span className={` ${robotoSlab.className} text-[13px] font-bold text-black`} > {endDate? new Date( endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}</span>
                </p>
              </div>
            </div>
          </div>

          <Logout />

        </header>

        {/* --- WELCOME HEADER --- */}
        <div className="space-y-1">
          <p className="text-xs text-black/40  ml-2  mb-2 tracking-[0.3em] uppercase">
            Dashboard
          </p>
          <h1 className="text-4xl font-light text-black">
            Welcome back, <span className="font-bold">{user?.name || "User"}</span>
          </h1>


          <p className="text-sm text-black/60 mt-2 ml-2 max-w-md">
            Your workspace is Ready. Track your work, progress milestones, and earnings.
          </p>
        </div>

        {/* --- ACTION BUTTONS ROW --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={handleQuickStart}
            disabled={isAssigning}
            className={`group relative flex cursor-pointer flex-col item-center justify-center p-6 h-20 shadow-2xl rounded-[2.5rem] transition-all active:scale-95 ${isAssigning ? "bg-violet-600 text-white" : "bg-violet-600 text-white"}hover:bg-white hover:text-black"
              } text-white shadow-2xl shadow-slate-200`}
          >

            <div className="flex justify-between ">
              <p className={`${robotoSlab.className} text-md font-black uppercase tracking-tighter leading-none`}>
                {isAssigning ? "Assigning..." : "Start Work"}
              </p>
              <ArrowUpRight size={20} className=" bg-white text-violet-600 p-1 rounded-full " />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">

          {/* 1. Violet Gradient (Completed Today) */}
          <StatCard
            label="Resumes Completed Today"
            value={workCounts.today}
            subLabel="Daily Productivity"
            variant="violet"
            icon={<CheckCheck size={22} />}
          />

          {/* 2. Green Gradient (Earnings) */}
          <StatCard
            label="Total Estimated Earnings"
            value={`₹ ${workCounts.total * 60}`}
            subLabel="Based on work logs"
            variant="green"
            icon={<IndianRupee size={22} />}
          />

          {/* 3. Red Gradient (All Time Total) */}
          <StatCard
            label="Total Resumes Completed"
            value={workCounts.total}
            subLabel="All time (Saved + Submitted)"
            variant="red"
            icon={<TrendingUp size={22} />}
          />

          {/* 4. Dark Yellow/Orange Gradient (Joining Bonus) */}
          <StatCard
            label="Joining Bonus"
            value="₹ 2000"
            subLabel="After 500 accurate resumes"
            variant="orange"
            icon={<SquareCheckBig size={22} />}
          />
        </div>



        {/* --- MILESTONE PROGRESS SECTION --- */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-black">
            Your Progress Towards Milestones
          </h2>
          <p className="text-sm text-black/60">
            Keep up the great work! Here’s how close you are to reaching your next rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">

          {/* Milestone 1: Violet (300) */}
          <MilestoneCircle
            label="Tier 1 Goal"
            total={workCounts.total}
            target={300}
            variant="violet"
          />

          {/* Milestone 2: Red (500) */}
          <MilestoneCircle
            label="Tier 2 Goal"
            total={workCounts.total}
            target={500}
            variant="red"
          />

          {/* Milestone 3: Yellow/Amber (700) */}
          <MilestoneCircle
            label="Tier 3 Goal"
            total={workCounts.total}
            target={700}
            variant="yellow"
          />

        </div>

        <WorkJourneyGuide />

        {/* Timer section  */}
        <div className="bg-white border-2 border-slate-100 p-8 rounded-4xl shadow-sm space-y-8 mt-12">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-100">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-black leading-none">Submission Timer</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Target: 300 - 700 Resumes
              </p>
            </div>
          </div>

          {/* 4 Countdown Boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Days", val: timeLeft.d, color: "text-rose-600 bg-rose-50 border-rose-100" },
              { label: "Hours", val: timeLeft.h, color: "text-slate-600 bg-slate-50 border-slate-100" },
              { label: "Minutes", val: timeLeft.m, color: "text-slate-600 bg-slate-50 border-slate-100" },
              { label: "Seconds", val: timeLeft.s, color: "text-slate-600 bg-slate-50 border-slate-100" },
            ].map((box, i) => (
              <div key={i} className={`${box.color} py-6 rounded-3xl flex flex-col items-center border-2 transition-all`}>
                <span className={`${passero.className} text-5xl font-black`}>
                  {box.val}
                </span>
                <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">
                  {box.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar Area */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Time Progress</span>
              <span className="text-[11px] font-black text-black">{Math.round(timeProgress)}%</span>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-4xl overflow-hidden border border-slate-50">
              <div
                className="h-full bg-orange-500 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                style={{ width: `${timeProgress}%` }}
              />
            </div>
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

function StatCard({ label, value, subLabel, icon, variant = "violet" }) {
  const themes = {
    violet: "bg-gradient-to-br from-indigo-600 to-violet-500",
    green: "bg-gradient-to-br from-emerald-600 to-teal-500",
    red: "bg-gradient-to-br from-rose-600 to-red-500",
    orange: "bg-gradient-to-br from-orange-600 to-amber-700",
  };

  return (
    <div className={`${themes[variant]} p-8 rounded-lg text-white shadow-xl flex flex-col h-40 relative overflow-hidden`}>
      {/* Top Section: Label and Icon */}
      <div className="flex justify-between items-start relative z-10">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-tight max-w-[130px]">
          {label}
        </span>
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/10">
          {icon}
        </div>
      </div>

      {/* Bottom Section: Big Value and Subtext */}
      <div className="mt-auto relative z-10">
        <h4 className={`${robotoSlab.className} text-4xl font-black leading-none tracking-tighter`}>
          {value}
        </h4>
        <p className="text-[9px] uppercase tracking-[0.2em] opacity-60 mt-2 font-bold">
          {subLabel}
        </p>
      </div>

      {/* Static Decorative Element (No Hover) */}
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
    </div>
  );
}

function MilestoneCircle({ total, target, label, variant = "violet" }) {
  const percentage = Math.min(Math.round((total / target) * 100), 100);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const themes = {
    violet: { stroke: "stroke-indigo-600", bg: "bg-indigo-50", text: "text-indigo-600" },
    red: { stroke: "stroke-red-600", bg: "bg-red-50", text: "text-red-600" },
    yellow: { stroke: "stroke-amber-500", bg: "bg-amber-50", text: "text-amber-500" },
  };

  const theme = themes[variant];

  return (
    <div className="bg-white border-2 border-slate-200 shadow-2xl p-8 rounded-[3rem] flex flex-col items-center justify-center text-center  relative overflow-hidden">
      {/* Percentage Circle */}
      <div className="relative flex items-center justify-center mb-6">
        <svg className="w-40 h-40 transform -rotate-90">
          {/* Background Track */}
          <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
          {/* Progress Bar */}
          <circle
            cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 1.5s ease-in-out" }}
            className={`${theme.stroke} stroke-round`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${passero.className} text-4xl text-black`}>{percentage}%</span>
        </div>
      </div>

      {/* Label & Target Info */}
      <div className="space-y-1">
        <h3 className="text-[14px] font-semibold  text-black">{label}</h3>
        <p className="text-[12px] font-bold text-black">
          {total} <span className="text-violet-600">/</span> {target}
        </p>
      </div>

      {/* Mini Status Tag */}
      <div className={`mt-4 px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-widest ${theme.bg} ${theme.text}`}>
        {percentage === 100 ? "Milestone Reached" : `${target - total} More To Go`}
      </div>
    </div>
  );
}

function WorkJourneyGuide() {
  const steps = [
    {
      number: "1",
      title: "Account Registered",
      desc: "You have successfully registered and received work access.",
      variant: "blue",
    },
    {
      number: "2",
      title: "Start Working",
      desc: "Begin resume work and maintain accuracy while typing.",
      variant: "white",
    },
    {
      number: "3",
      title: "Submit & Review",
      desc: "Submit completed resumes. Quality team will review your work.",
      variant: "white",
    },
    {
      number: "4",
      title: "Payout Released",
      desc: "After approval, payout will be released to your account.",
      variant: "green",
    },
  ];

  const themes = {
    blue: "bg-indigo-600 text-white",
    green: "bg-emerald-600 text-white",
    white: "bg-white text-black border-2 border-slate-100",
  };

  const numberColors = {
    blue: "text-white/40",
    green: "text-white/40",
    white: "text-indigo-600",
  };

  return (
    <div className="mt-20 space-y-8">
      {/* --- HEADER --- */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black flex items-center gap-3 text-black">
          Work Journey Guide
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
          Understand your complete workflow from start to payout.
        </p>
      </div>

      {/* --- STEPS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`${themes[step.variant]} p-8 rounded-xl h-48 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 duration-300`}
          >
            <span className={`${robotoSlab.className} text-3xl leading-none ${numberColors[step.variant]}`}>
              {step.number}
            </span>
            <div className="space-y-2">
              <h3 className="font-black text-lg leading-tight uppercase tracking-tighter">
                {step.title}
              </h3>
              <p className="text-[11px] font-medium opacity-70 leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* --- WARNING ALERT --- */}
      <div className="bg-amber-50 border-2 border-amber-100 p-5 rounded-2xl flex items-center gap-4">
        <div className="text-xl">⚠️</div>
        <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest">
          Complete minimum required resumes with accuracy to receive payout and bonus.
        </p>
      </div>
    </div>
  );
}

