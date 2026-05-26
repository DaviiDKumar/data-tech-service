"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getAdminSavedResumes } from "@/app/actions/admin"; 
import { ubuntu, passero } from "@/lib/fonts";
import { 
  ArrowLeft, FileText, Database, Loader2, 
  ShieldAlert, User, Mail, ShieldCheck, MapPin, GraduationCap, Briefcase
} from "lucide-react";
import Link from "next/link";

// ── NATIVE VERIFIED CLIENT-SIDE WORKSPACE LOADING METHOD ──
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

export default function ReviewSavedDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const res = await getAdminSavedResumes(["saved", "in-progress", "re-assigned", "review"]);
        if (!cancelled && res.success) {
          const currentItem = res.data.find(item => item._id === id);
          if (currentItem) setDetail(currentItem);
        }
      } catch (err) {
        console.error("Detail Fetch Error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white text-black">
      <Loader2 className="animate-spin mb-4" size={40} />
      <span className={`${passero.className} text-xl uppercase tracking-widest`}>Accessing Data Stream...</span>
    </div>
  );

  if (!detail) return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-10 bg-white">
      <ShieldAlert size={48} className="mb-4 text-black" />
      <h1 className={`${passero.className} text-3xl uppercase tracking-tighter`}>Node Offline</h1>
      <p className="text-[10px] font-mono text-gray-400 mt-2 mb-8 uppercase tracking-widest italic">Reference: {id}</p>
      <Link href="/admin/savedresume" className="border border-black px-10 py-3 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all">
        Return to Pipeline
      </Link>
    </div>
  );

  const formData = detail.formData || {};
  const pdfUrl = detail.resumeId?.fileUrl;

  return (
    <div className={`${ubuntu.className} h-screen flex flex-col overflow-hidden text-black bg-white`}>
      
      {/* ── STABLE BRUTALIST HEADER ── */}
      <header className="h-20 bg-white border-b border-black px-8 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/admin/savedresume" className="w-10 h-10 border border-black rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className={`${passero.className} text-3xl uppercase italic tracking-tighter leading-none`}>
              Draft <span className="text-gray-300">/</span> Instance
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">{detail.status}</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">Instance ID: {detail._id}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase leading-none">{detail.userId?.name || "Guest"}</p>
            <p className="text-[9px] text-gray-400 font-mono italic mt-0.5">{detail.userId?.email}</p>
          </div>
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-xs font-bold rounded-lg shadow-[4px_4px_0px_0px_rgba(200,200,200,1)]">
            {detail.userId?.name?.substring(0,2).toUpperCase() || "GT"}
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden p-6 gap-6 bg-[#F9F9F9]">
        
        {/* LEFT COMPONENT PANEL: SYSTEM COMPONENT PDF RENDERER */}
        <section className="w-[50%] h-full bg-zinc-200 border-2 border-black rounded-2xl relative overflow-hidden shadow-md">
          {pdfUrl ? (
            <PdfViewer fileUrl={pdfUrl} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white">
              <FileText size={48} className="text-zinc-200" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">No Document Bound</span>
            </div>
          )}
        </section>

        {/* RIGHT COMPONENT PANEL: EXPLORATION COMPLETE FORM MATRIX */}
        <section className="w-[50%] bg-white overflow-y-auto no-scrollbar border border-black p-12 rounded-2xl shadow-sm relative">
          <div className="max-w-xl mx-auto space-y-12 pb-32">
            
            <div className="flex items-center gap-3 border-b border-black pb-6">
              <Database size={20} />
              <span className={`${passero.className} text-xl tracking-[0.2em] uppercase`}>
                Draft <span className="opacity-20 italic underline">Extraction</span>
              </span>
            </div>

            {/* IDENTITY TRACK NODE */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-black pl-4">
                <User size={16}/>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Identity Matrix</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DataField label="First Name" value={formData.firstName} />
                <DataField label="Middle Name" value={formData.middleName} />
                <DataField label="Last Name" value={formData.lastName} />
                <DataField label="Date of Birth" value={formData.dob} />
                <DataField label="Gender" value={formData.gender} />
                <DataField label="Nationality" value={formData.nationality} />
                <DataField label="Marital Status" value={formData.maritalStatus} />
                <DataField label="Passport ID" value={formData.passport} />
              </div>
              <DataField label="Hobbies & Interests" value={formData.hobbies} full />
              <DataField label="Linguistic Proficiencies" value={formData.languages} full />
            </div>

            {/* GEOLOCATION COMMUNICATION NODE */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-black pl-4">
                <MapPin size={16}/>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Communication Layer</span>
              </div>
              <DataField label="Mailing Address" value={formData.address} full />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DataField label="Landmark Location" value={formData.landmark} />
                <DataField label="City" value={formData.city} />
                <DataField label="State / Region" value={formData.state} />
                <DataField label="Postal Pincode" value={formData.pincode} />
                <DataField label="Secure Mobile" value={formData.mobile} />
              </div>
              <DataField label="Verified Email" value={formData.email} full />
            </div>

            {/* ACADEMIC PROGRESSION MATRIX */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-black pl-4">
                <GraduationCap size={16}/>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Academic History</span>
              </div>
              
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">SSC Metrics</p>
                <div className="grid grid-cols-3 gap-4">
                  <DataField label="SSC %" value={formData.sscResult} />
                  <DataField label="Board" value={formData.sscBoard} />
                  <DataField label="Pass Year" value={formData.sscYear} />
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">HSC Metrics</p>
                <div className="grid grid-cols-3 gap-4">
                  <DataField label="HSC %" value={formData.hscResult} />
                  <DataField label="Board" value={formData.hscBoard} />
                  <DataField label="Pass Year" value={formData.hscYear} />
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Undergraduate Track</p>
                <div className="grid grid-cols-2 gap-4">
                  <DataField label="Degree Spec" value={formData.gradDegree} />
                  <DataField label="Final CGPA / Result" value={formData.gradResult} />
                  <DataField label="University Body" value={formData.gradUniversity} />
                  <DataField label="Graduation Year" value={formData.gradYear} />
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Post-Graduation Matrix</p>
                <div className="grid grid-cols-3 gap-4">
                  <DataField label="PG Degree" value={formData.pgDegree} />
                  <DataField label="PG Result" value={formData.pgResult} />
                  <DataField label="PG Pass Year" value={formData.pgYear} />
                </div>
                <DataField label="Higher Education / Certifications" value={formData.higherEducation} full />
              </div>
            </div>

            {/* INDUSTRIAL WORK SYSTEM MATRIX */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-black pl-4">
                <Briefcase size={16}/>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Work Operational Experience</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DataField label="Experience (Months)" value={formData.expMonths} />
                <DataField label="Experience (Years)" value={formData.expYears} />
                <DataField label="Cumulative Total Months" value={formData.totalMonths} />
                <DataField label="Total Organizations Visited" value={formData.noOfCompanies} />
              </div>
              <DataField label="Last Functional Authority Employer" value={formData.lastEmployer} full />
            </div>

            {/* ACTION INTERACTION BOUNDARY */}
            <div className="pt-6 flex gap-4 border-t border-neutral-200">
              <Link 
                href="/admin/savedresume"
                className="flex-1 text-center border border-black py-4 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-xl"
              >
                Return to pipeline
              </Link>
            </div>

            <footer className="pt-6 opacity-10 text-center">
              <p className={`${passero.className} text-[10px] uppercase tracking-[1.5em]`}>Growthforge DTS</p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

// System Constant Field Generator
function DataField({ label, value, full = false }) {
  return (
    <div className={`${full ? 'col-span-full' : ''} space-y-1.5`}>
      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">
        {label}
      </label>
      <div className="w-full bg-white border-b-2 border-gray-100 px-1 py-2 text-xs font-bold text-black flex items-center transition-all hover:border-black select-all min-h-[36px]">
        {value?.toString().trim() !== "" ? value : <span className="text-zinc-200 italic font-medium uppercase text-[9px]">null_stream</span>}
      </div>
    </div>
  );
}