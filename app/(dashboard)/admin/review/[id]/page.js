"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminReports, bulkUpdateResumeStatus } from "@/app/actions/admin"; 
import { 
  ArrowLeft, CheckCircle, XCircle, FileText, User, GraduationCap, 
  Briefcase, Loader2, Mail, ShieldCheck, MapPin, Info, Database, Send
} from "lucide-react";
import Link from "next/link";

function AdminReviewDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const res = await getAdminReports(["submitted", "approved", "rejected"]);
        if (!cancelled && res.success) {
          const currentItem = res.data.find(item => item._id === id);
          if (currentItem) setDetail(currentItem);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setTimeout(() => setLoading(false), 0);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [id]);

  const handleDecision = async (status) => {
    if (!window.confirm(`Mark as ${status.toUpperCase()}?`)) return;
    setIsActionLoading(true);
    const res = await bulkUpdateResumeStatus([id], status);
    if (res.success) router.push("/admin/submitted");
    setIsActionLoading(false);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Intelligence Suite...</p>
    </div>
  );

  const formData = detail?.formData || {};

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
      
      {/* --- ADMIN HEADER --- */}
      <header className="h-20 border-b border-slate-100 px-8 flex items-center justify-between shrink-0 bg-white/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-6">
          <Link href="/admin/submitted" className="p-3 hover:bg-slate-50 rounded-2xl transition-all group">
            <ArrowLeft size={20} className="text-slate-400 group-hover:text-slate-900" />
          </Link>
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600" /> Inspecting: {detail?.resumeId?.originalName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
               Worker: <span className="text-slate-900 italic">{detail?.userId?.name}</span>
               <span className="w-1 h-1 bg-slate-200 rounded-full" />
               Status: <span className="text-blue-600">{detail?.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => handleDecision('rejected')} disabled={isActionLoading} className="px-6 py-2.5 bg-white border-2 border-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all disabled:opacity-50">
            Reject
          </button>
          <button onClick={() => handleDecision('approved')} disabled={isActionLoading} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all disabled:opacity-50">
            Approve & Verify
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* LEFT: PDF PREVIEW */}
        <section className="w-1/2 bg-slate-50 p-6 overflow-y-auto border-r border-slate-200">
           <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white h-fit sticky top-0">
              <iframe src={`${detail?.resumeId?.fileData}#toolbar=0`} className="w-full h-[180vh]" title="Review PDF" />
           </div>
        </section>

        {/* RIGHT: FULL FORM DATA (READ-ONLY) */}
        <section className="w-1/2 bg-white overflow-y-auto custom-scrollbar">
          <div className="max-w-2xl mx-auto py-16 px-12 space-y-16 pb-40">
            
            <header className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg">
                <Database size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">GrowthForge DTS</span>
              </div>
              <h3 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                Data <span className="text-blue-600 text-outline">Extraction</span>
              </h3>
            </header>

            {/* Personal Details */}
            <ReviewSection icon={<User size={16}/>} title="Personal Details">
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="First Name" value={formData.firstName} />
                <DisplayField label="Middle Name" value={formData.middleName} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="Last Name" value={formData.lastName} />
                <DisplayField label="Date Of Birth" value={formData.dob} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="Gender" value={formData.gender} />
                <DisplayField label="Nationality" value={formData.nationality} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="Marital Status" value={formData.maritalStatus} />
                <DisplayField label="Passport" value={formData.passport} />
              </div>
              <DisplayField label="Hobbies" value={formData.hobbies} />
              <DisplayField label="Language Known" value={formData.languages} />
            </ReviewSection>

            {/* Communication Details */}
            <ReviewSection icon={<MapPin size={16}/>} title="Communication Details">
              <DisplayField label="Address" value={formData.address} full />
              <DisplayField label="Landmark" value={formData.landmark} full />
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="City" value={formData.city} />
                <DisplayField label="State" value={formData.state} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="Pincode" value={formData.pincode} />
                <DisplayField label="Mobile" value={formData.mobile} />
              </div>
              <DisplayField label="Email" value={formData.email} full />
            </ReviewSection>

            {/* Qualification Details */}
            <ReviewSection icon={<GraduationCap size={16}/>} title="Qualification Details">
              <div className="grid grid-cols-3 gap-6">
                <DisplayField label="SSC Result" value={formData.sscResult} />
                <DisplayField label="SSC Board" value={formData.sscBoard} />
                <DisplayField label="SSC Year" value={formData.sscYear} />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <DisplayField label="HSC Result" value={formData.hscResult} />
                <DisplayField label="HSC Board" value={formData.hscBoard} />
                <DisplayField label="HSC Year" value={formData.hscYear} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="Grad Degree" value={formData.gradDegree} />
                <DisplayField label="Grad Result" value={formData.gradResult} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="Grad University" value={formData.gradUniversity} />
                <DisplayField label="Grad Year" value={formData.gradYear} />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <DisplayField label="PG Degree" value={formData.pgDegree} />
                <DisplayField label="PG Result" value={formData.pgResult} />
                <DisplayField label="PG Year" value={formData.pgYear} />
              </div>
              <DisplayField label="Higher Level Education" value={formData.higherEducation} full />
            </ReviewSection>

            {/* Employment Details */}
            <ReviewSection icon={<Briefcase size={16}/>} title="Employment Details">
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="Exp (Months)" value={formData.expMonths} />
                <DisplayField label="Exp (Years)" value={formData.expYears} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DisplayField label="Total Months" value={formData.totalMonths} />
                <DisplayField label="No Of Companies" value={formData.noOfCompanies} />
              </div>
              <DisplayField label="Last Employer" value={formData.lastEmployer} full />
            </ReviewSection>

            <footer className="pt-10">
               <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">EndOfVerificationProtocol</p>
               </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

// --- REUSABLE DISPLAY COMPONENTS ---

function ReviewSection({ icon, title, children }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
          {icon}
        </div>
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 italic">{title}</h4>
      </div>
      <div className="space-y-6 pl-2">{children}</div>
    </div>
  );
}

function DisplayField({ label, value, full = false }) {
  return (
    <div className={`space-y-2 ${full ? 'col-span-full' : ''}`}>
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
      <div className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 min-h-14 flex items-center">
        {value || <span className="text-slate-200 italic font-medium">Not Provided</span>}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminReviewDetailContent), { ssr: false });