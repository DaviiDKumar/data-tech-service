"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { getInProgressResumes } from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import { 
   Play, FileText, Loader2, 
   ArrowRight, LayoutGrid, Timer 
} from "lucide-react";
import Link from "next/link";

function InProgressContent() {
  const userId = useUserStore((state) => state.user?.id);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    let isSubscribed = true;
    async function fetchData() {
      try {
        const res = await getInProgressResumes(userId);
        if (isSubscribed && res.success) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }
    fetchData();
    return () => { isSubscribed = false; };
  }, [userId]);

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto min-h-screen bg-white">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-4 text-orange-500 font-black text-[10px] uppercase tracking-[0.4em]">
            <Timer size={16} /> Active Sessions
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
            In <span className="text-orange-500">Progress</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
            <span className="w-12 h-px bg-slate-200"></span> Resume extraction unfinished tasks
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-100 px-6 py-3 rounded-2xl flex items-center gap-4">
            <div className="text-center">
                <span className="block text-[10px] font-black text-orange-400 uppercase">Pending</span>
                <span className="text-xl font-black text-orange-600">{data.length}</span>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-orange-500" size={40} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Drafts...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3.5rem] py-32 text-center">
          <LayoutGrid className="mx-auto text-slate-300 mb-6" size={48} />
          <h3 className="text-slate-900 font-black uppercase text-sm tracking-widest">Workspace Clear</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">No unfinished resumes found.</p>
          <Link href="/user/allresumesavailable" className="inline-flex items-center gap-2 mt-8 text-[10px] font-black uppercase text-blue-600 hover:gap-4 transition-all">
            Start New Task <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((item) => (
            <div key={item._id} className="group relative bg-white border border-slate-100 p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-orange-100 hover:border-orange-200 transition-all duration-500">
              
              <div className="flex items-start justify-between mb-8">
                <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                  <FileText size={24} />
                </div>
                <div className="text-right">
                    <span className="block text-[9px] font-black text-slate-300 uppercase tracking-tighter italic">Last Edited</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">
                        {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">
                  {item.resumeId?.originalName || "Draft_Resume.pdf"}
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Reference: {item._id.slice(-12).toUpperCase()}
                </p>
              </div>

              {/* Action Button */}
              <Link 
                href={`/user/workspace/${item.resumeId?._id}`}
                className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-orange-500 transition-all duration-300 shadow-xl shadow-slate-200"
              >
                Continue Forge <Play size={14} fill="currentColor" />
              </Link>

              {/* Progress Indicator */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-orange-100 rounded-t-full overflow-hidden">
                <div className="h-full bg-orange-500 w-2/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="mt-20 text-center text-[9px] font-black text-slate-200 uppercase tracking-[1em]">
        Work In Progress System
      </p>
    </div>
  );
}

export default dynamic(() => Promise.resolve(InProgressContent), { ssr: false });