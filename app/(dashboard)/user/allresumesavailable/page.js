"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation"; // 1. Router import karo
import { getResumesForUser, incrementResumeHits } from "@/app/actions/userWork"; // 2. Naya action import karo
import { useUserStore } from "@/store/useUserStore";
import { 
  FileText, PlayCircle, CheckCircle, 
  ChevronLeft, ChevronRight, Loader2, Search 
} from "lucide-react";

export default function ResumesPool() {
  const router = useRouter(); // 3. Router initialize karo
  const userId = useUserStore((state) => state.user?.id);
  
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // Tracking individual clicks

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const res = await getResumesForUser(page, 8, userId);
    if (res.success) {
      setResumes(res.data);
      setTotalPages(res.totalPages);
    }
    setLoading(false);
  }, [page, userId]);

  // 4. Function to handle Hit Increment and Navigation
  const handleStartExtraction = async (resumeId) => {
    setActionLoading(resumeId); // Loader dikhane ke liye
    try {
      // Backend mein hit badhao
      await incrementResumeHits(resumeId);
      // Phir workspace par bhejo
      router.push(`/user/workspace/${resumeId}`);
    } catch (error) {
      console.error("Navigation failed:", error);
      // Fail hone par bhi bhej dete hain taaki kaam na ruke
      router.push(`/user/workspace/${resumeId}`);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchData();
  }, [fetchData]);

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen bg-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-slate-900">
            Resume <span className="text-blue-600">Inventory</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
            <span className="w-8 h-px bg-slate-200"></span> Global Data Pool
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
           <span className="text-[10px] font-black uppercase px-4 text-slate-400">Page {page} of {totalPages}</span>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Master Pool...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resumes.map((resume) => {
              const isAvailable = resume.workStatus === "available";
              const isDone = ["submitted", "approved"].includes(resume.workStatus);
              const isProcessing = actionLoading === resume._id;

              return (
                <div 
                  key={resume._id} 
                  className={`group relative bg-white border ${isAvailable ? 'border-slate-100 shadow-sm' : 'border-slate-200 bg-slate-50/50'} p-6 rounded-[2.5rem] transition-all hover:shadow-xl hover:-translate-y-1`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl transition-colors ${isAvailable ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <FileText size={20} />
                    </div>
                    {!isAvailable && (
                      <span className="text-[8px] font-black uppercase px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm">
                        {resume.workStatus}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-black text-slate-800 uppercase text-[11px] truncate tracking-tight">
                      {resume.originalName || "Untitled_Resume.pdf"}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      REF: {resume._id.slice(-12)}
                    </p>
                  </div>

                  <div className="mt-8">
                    {isAvailable ? (
                      <button 
                        onClick={() => handleStartExtraction(resume._id)}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95 disabled:opacity-70"
                      >
                        {isProcessing ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <PlayCircle size={14} />
                        )}
                        {isProcessing ? "Opening..." : "Start Extraction"}
                      </button>
                    ) : (
                      <button 
                        disabled 
                        className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-400 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                      >
                        <CheckCircle size={14} className={isDone ? "text-emerald-500" : "text-orange-400"} /> 
                        {isDone ? "Task Completed" : "In Progress"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="mt-16 flex justify-center items-center gap-6">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 disabled:opacity-20 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2">
               {[...Array(totalPages)].map((_, i) => (
                 <button 
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-100'}`}
                 >
                   {i + 1}
                 </button>
               ))}
            </div>

            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 disabled:opacity-20 transition-all shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}

      {!loading && resumes.length === 0 && (
        <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <Search size={40} className="mx-auto text-slate-300 mb-4" />
           <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Inventory is Empty</h2>
           <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">Check back later for new assignments</p>
        </div>
      )}
    </div>
  );
}