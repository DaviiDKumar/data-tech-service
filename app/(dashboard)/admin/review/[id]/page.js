"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminReports, bulkUpdateResumeStatus } from "@/app/actions/admin"; 
import { passero, robotoSlab } from "@/lib/fonts";
import { 
  ArrowLeft, CheckCircle, XCircle, FileText, User, GraduationCap, 
  Briefcase, Loader2, ShieldCheck, MapPin, Database, Eye, RefreshCcw
} from "lucide-react";
import Link from "next/link";

// ── MATCHES YOUR WORKING WORKSPACE LOADING LAYOUT METHOD ──
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="animate-spin text-zinc-300" size={28} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">
        Streaming Document Engine...
      </span>
    </div>
  ),
});

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
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [id]);

  const handleDecision = async (status) => {
    if (!window.confirm(`Confirm Audit Status Modification: Mark as ${status.toUpperCase()}?`)) return;
    setIsActionLoading(true);
    const res = await bulkUpdateResumeStatus([id], status);
    if (res.success) router.push("/admin/submitted");
    setIsActionLoading(false);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4 text-black">
      <Loader2 className="animate-spin" size={40} />
      <p className={`${passero.className} text-[10px] uppercase tracking-[5px] text-zinc-400`}>
        Initializing Audit Matrix...
      </p>
    </div>
  );

  const formData = detail?.formData || {};
  const pdfUrl = detail?.resumeId?.fileUrl;

  return (
    <div className={`h-screen flex flex-col bg-white overflow-hidden ${robotoSlab.className} text-black`}>
      
      {/* ── STABLE STRUCTURAL HEADER ── */}
      <header className="shrink-0 h-24 border-b border-slate-500 px-6 flex items-center justify-between bg-white z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin/submitted" className="p-2 hover:bg-black hover:text-white rounded-xl transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-px h-12 bg-black" />
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[14px] font-black text-black flex items-center gap-2">
              <Eye size={14} />
              <span className="max-w-xs truncate">{detail?.resumeId?.originalName || "Untitled_Data_Stream.pdf"}</span>
            </h2>
            <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-wider text-black/40">
               <div>Record: <span className="text-black font-bold">{detail?._id?.slice(-6).toUpperCase()}</span></div>
               <div className="w-1 h-1 bg-black/20 rounded-full" />
               <div>Agent Node: <span className="text-blue-600 font-bold">{detail?.userId?.name || 'Unassigned'}</span></div>
               <div className="w-1 h-1 bg-black/20 rounded-full" />
               <div>Global State: <span className="text-neutral-800 font-bold">{detail?.status}</span></div>
            </div>
          </div>
        </div>

        {/* ── ACTION TRIGGER STRIP ── */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleDecision('review')} 
            disabled={isActionLoading} 
            className="group px-5 py-3 border-2 border-amber-500 bg-white text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-amber-500 hover:text-white transition-all duration-300 rounded-xl flex items-center justify-center gap-2"
          >
            <RefreshCcw size={14} /> Send back to Review
          </button>
          
          <button 
            onClick={() => handleDecision('rejected')} 
            disabled={isActionLoading} 
            className="group px-5 py-3 border-2 border-rose-600 bg-white text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-rose-600 hover:text-white transition-all duration-300 rounded-xl flex items-center justify-center gap-2"
          >
            <XCircle size={14} /> Revoke / Reject
          </button>
          
          <button 
            onClick={() => handleDecision('approved')} 
            disabled={isActionLoading} 
            className="group px-6 py-3 bg-black border-2 border-black text-white text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-neutral-800 hover:border-neutral-800 transition-all duration-300 rounded-xl flex items-center justify-center gap-2 shadow-lg"
          >
            <CheckCircle size={14} className="text-emerald-400" /> Authorize Data
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE SPLIT DOCK ── */}
      <main className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT COMPONENT COLUMN: NATIVE RENDERING FILE CANVAS */}
        <section className="w-1/2 h-full flex flex-col border-r-2 bg-white overflow-hidden">
          <div className="flex-1 bg-zinc-200 p-4 relative overflow-hidden">
            <div className="w-full h-full bg-white rounded-2xl border-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)] relative overflow-hidden">
              {pdfUrl ? (
                <PdfViewer fileUrl={pdfUrl} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                    <FileText size={24} className="text-slate-300" />
                  </div>
                  <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">
                     No Source URL Bound
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-3 bg-white border-t-2 border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Secure Native Audit Desk</span>
            </div>
            <span className="font-mono text-[9px] text-slate-300">DataSort Core v2</span>
          </div>
        </section>

        {/* RIGHT COMPONENT COLUMN: EXPLORATION FORGE FIELD INVENTORY */}
        <section className="w-1/2 h-full overflow-y-auto bg-white p-10 scroll-smooth">
          <div className="max-w-2xl mx-auto space-y-14 pb-24">
            
            <header className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-md">
                <Database size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">GrowthForge Spec Profile</span>
              </div>
              <h3 className={`${passero.className} text-5xl uppercase tracking-tighter text-black leading-none`}>
                Extracted Audit Matrix
              </h3>
            </header>

            {/* IDENTITY METRICS */}
            <FormSection icon={<User size={14} />} title="Identity Details">
              <Input label="First Name" value={formData.firstName} />
              <Input label="Middle Name" value={formData.middleName} />
              <Input label="Last Name" value={formData.lastName} />
              <Input label="Date of Birth (DD/MM/YYYY)" value={formData.dob} />
              <Input label="Gender" value={formData.gender} />
              <Input label="Nationality" value={formData.nationality} />
              <Input label="Marital Status" value={formData.maritalStatus} />
              <Input label="Passport ID Reference" value={formData.passport} />
              <Input label="Hobbies / Special Interests" value={formData.hobbies} />
              <Input label="Linguistic Proficiencies" value={formData.languages} />
            </FormSection>

            {/* GEOLOCATION & GEOMETRIC COMMS */}
            <FormSection icon={<MapPin size={14} />} title="Geolocation & Comms">
              <Input label="Full Residence Address" value={formData.address} />
              <Input label="Landmark Location" value={formData.landmark} />
              <Input label="City" value={formData.city} />
              <Input label="State / Region Zone" value={formData.state} />
              <Input label="Postal Pincode" value={formData.pincode} />
              <Input label="Secure Mobile Contact" value={formData.mobile} />
              <Input label="Verified Email Endpoint" value={formData.email} />
            </FormSection>

            {/* ACADEMIC LEDGERS */}
            <FormSection icon={<GraduationCap size={14} />} title="Academic Verification History">
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">SSC Metrics</p>
                <Input label="SSC Aggregate %" value={formData.sscResult} />
                <Input label="SSC Examination Board" value={formData.sscBoard} />
                <Input label="SSC Graduation Year" value={formData.sscYear} />
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">HSC Metrics</p>
                <Input label="HSC Aggregate %" value={formData.hscResult} />
                <Input label="HSC Examination Board" value={formData.hscBoard} />
                <Input label="HSC Graduation Year" value={formData.hscYear} />
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Undergraduate Records</p>
                <Input label="Degree Specialization" value={formData.gradDegree} />
                <Input label="Final CGPA / Outcome Score" value={formData.gradResult} />
                <Input label="Affiliated University Body" value={formData.gradUniversity} />
                <Input label="Graduation Timeline Year" value={formData.gradYear} />
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Post-Graduate / Higher Track Blocks</p>
                <Input label="PG Degree Specification" value={formData.pgDegree} />
                <Input label="PG Evaluation Score" value={formData.pgResult} />
                <Input label="PG Completion Year" value={formData.pgYear} />
                <Input label="Alternative Higher Certifications" value={formData.higherEducation} />
              </div>
            </FormSection>

            {/* EXPERIENCE LOGS */}
            <FormSection icon={<Briefcase size={14} />} title="Work Operational Experience">
              <Input label="Experience (Net Months)" value={formData.expMonths} />
              <Input label="Experience (Net Years)" value={formData.expYears} />
              <Input label="Cumulative Log Total Months" value={formData.totalMonths} />
              <Input label="Registered Organizations Visited" value={formData.noOfCompanies} />
              <Input label="Last Functional Authority Employer" value={formData.lastEmployer} />
            </FormSection>

            <footer className="pt-4 opacity-20 text-center">
              <p className={`${passero.className} text-sm uppercase tracking-[0.5em]`}>Extraction Log Finalized</p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── ISOLATED STRUCTURAL SUB-COMPONENTS TO MATCH YOUR SYSTEM ── */

function FormSection({ icon, title, children }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 border-b-2 border-black pb-2">
        <div className="bg-black text-white p-2 rounded-lg">{icon}</div>
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-black">{title}</h4>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input({ label, value }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-semibold tracking-widest text-zinc-800">{label}</label>
      <div className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-4 text-xs font-bold text-zinc-800 min-h-[52px] flex items-center select-all">
        {value?.toString().trim() !== "" ? value : <span className="opacity-20 italic font-medium">No Input Provided</span>}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminReviewDetailContent), { ssr: false });