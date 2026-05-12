"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { getReassignedResumes, getInProgressResumes } from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import {
  Zap, ArrowRight, Loader2,
  Search, LayoutGrid, CheckCircle2, Info, FileText, CloudSync, Edit3
} from "lucide-react";
import Link from "next/link";
import { passero } from "@/lib/fonts";
function UserReassignedContent() {
  const userId = useUserStore((state) => state.user?.id);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!userId) {
      const timer = setTimeout(() => { setLoading(false); }, 0);
      return () => clearTimeout(timer);
    }
    let isMounted = true;
    async function fetchData() {
      try {
        const [reassignedRes, inProgressRes] = await Promise.all([
          getReassignedResumes(userId),
          getInProgressResumes(userId),
        ]);
        if (!isMounted) return;
        const combined = [
          ...(reassignedRes?.success ? reassignedRes.data : []),
          ...(inProgressRes?.success ? inProgressRes.data : []),
        ];
        setData(combined);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [userId]);

  const filtered = data.filter(item =>
    item.resumeId?.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-violet-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Workspace...</p>
    </div>
  );

  return (
    <div className="p-8 md:p-12  mx-auto min-h-screen font-sans">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end  mb-16 px-2">
        {/* --- LEFT SIDE: TITLE & BRANDING --- */}
        <div className="space-y-6">
          <div className="flex items-center ">
            <div className="p-3  rounded-2xl text-violet-600 ">
              <CloudSync size={22} className="animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold  text-violet-600 ">
                All Your Saved Work
              </span>

            </div>
          </div>

          <div className="space-y-2">
            <h1 className={`${passero.className} text-6xl uppercase italic text-slate-900 leading-none tracking-tighter`}>
              Saved <span className="text-violet-600 drop-shadow-sm">Resumes</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
              <span className="w-8 h-[2px] bg-violet-600" />
              All Your In-Progress & Auto Saved Resumes in One Place
            </p>
          </div>
        </div>

       
      </div>



      <div className="space-y-8">
        {/* ── SEARCH & FILTERS ── */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-sm border-2 border-slate-100 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search saved resumes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-transparent focus:border-violet-600 rounded-2xl text-xs font-bold transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <div className="text-right">
              
              <p className={`${passero.className} text-2xl text-violet-600 leading-none`}>{filtered.length}</p>
            </div>
            <div className="p-3  text-violet-600 rounded-xl">
              <CloudSync size={20} />
            </div>
          </div>
        </div>

        {/* ── TABLE / GRID ── */}
        {filtered.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200  py-32 text-center">
            <LayoutGrid className="mx-auto text-slate-200 mb-6" size={48} />
            <h3 className="text-slate-900 font-black uppercase text-lg  ">No Saved Progress</h3>
            <p className="text-[9px] font-bold text-slate-400  mt-2">Documents you save for later will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border-2 border-slate-100  shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b-2 border-slate-100">
                    <th className="px-8 py-6 text-[12px]   text-slate-700">S.No</th>
                    <th className="px-8 py-6 text-[12px]   text-slate-700">Resume Name</th>
                    <th className="px-8 py-6 text-[12px]   text-slate-700 text-center">Status</th>
                    <th className="px-8 py-6 text-[12px]   text-slate-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-50">
                  {currentItems.map((item, index) => (
                    <tr key={item._id} className="hover:bg-violet-50/30 transition-all group">
                      <td className="px-8 py-6">
                        <span className={`${passero.className} text-xl text-slate-700 group-hover:text-violet-600 transition-colors`}>
                          {indexOfFirstItem + index + 1}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-700 group-hover:bg-violet-600 group-hover:text-white transition-all">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px]">
                              {item.resumeId?.originalName || "Secure_Doc.pdf"}
                            </p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              Allocated: {new Date(item.createdAt).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[12px]  tracking-widest">
                          <CheckCircle2 size={10} /> Synced
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link
                          href={`/user/workspace/${item.resumeId?._id}`}
                          className={`${passero.className} inline-flex items-center gap-2 px-6 py-2.5  text-black text-[12px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-violet-600  bg-white hover:text-white transition-all shadow-4xl hover:shadow-violet-100 underline underline-offset-4  active:scale-95 group/btn`}
                        >
                          <Edit3 size={12} className={` group-hover/btn:rotate-12 transition-transform`} />
                          Continue
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── PAGINATION ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Displaying <span className="text-black">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filtered.length)}</span> of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-10 h-10 rounded-2xl text-[10px] font-black transition-all border-2 ${currentPage === i + 1
                          ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-100"
                          : "bg-white border-transparent text-slate-400 hover:border-slate-200"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-20 text-center text-[9px] font-black text-slate-200 uppercase tracking-[1em]">
        End of Priority Channel
      </p>
    </div>
  );
}

export default dynamic(() => Promise.resolve(UserReassignedContent), { ssr: false });