"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// import { startNewResumeAction } from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import { PlayCircle, Loader2, Zap, ShieldCheck, Clock } from "lucide-react";
import {autoAssignAndGetId} from "@/app/actions/userWork";
export default function NewResumeStarter() {
  const router = useRouter();
  const userId = useUserStore((state) => state.user?.id);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartWork = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const res = await autoAssignAndGetId(userId);

      if (res.success) {
        // Direct redirect to workspace
        router.push(`/user/workspace/${res.resumeId}`);
      } else {
        alert(res.error || "No resumes available at the moment.");
      }
    } catch (err) {
      console.error("Initialization failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 py-20">
      <div className="bg-white border border-slate-100 rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 text-center space-y-8">

        {/* Animated Icon Header */}
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          <div className="relative bg-slate-900 text-white p-6 rounded-full shadow-xl">
            <Zap size={32} className={isLoading ? "animate-bounce" : ""} />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            Ready to <span className="text-blue-600">Extract?</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">
            System: Connected • Data: Ready • ID: {userId?.slice(-6)}
          </p>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap justify-center gap-4 py-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest">
            <ShieldCheck size={12} className="text-blue-500" /> Auto-Verification
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-widest">
            <Clock size={12} className="text-blue-500" /> 20 Min Avg Session
          </div>
        </div>

        {/* Main Action Button */}
        <div className="pt-6">
          <button
            onClick={handleStartWork}
            disabled={isLoading}
            className="group relative w-full md:w-80 h-20 bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-blue-200"
          >
            <span className="flex items-center justify-center gap-4">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Configuring...</span>
                </>
              ) : (
                <>
                  <PlayCircle size={20} className="group-hover:scale-125 transition-transform" />
                  <span>Start Workspace</span>
                </>
              )}
            </span>
          </button>
        </div>

        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          By clicking start, you agree to the data processing terms.
        </p>
      </div>
    </div>
  );
}