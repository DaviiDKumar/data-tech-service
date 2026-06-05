"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useParams } from "next/navigation";
import { getAdminReports } from "@/app/actions/admin"; // Updated to comprehensive lookup function
import { ubuntu, passero, robotoSlab } from "@/lib/fonts";
import { 
  ArrowLeft, FileText, Database, Loader2, 
  ShieldAlert, User, Mail, ShieldCheck, MapPin, GraduationCap, Briefcase
} from "lucide-react";
import Link from "next/link";

// Clean client-side window loading frame for PDF canvas rendering components
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
      <span className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-zinc-400">
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
        // ✅ FIXED: Encompasses all structural state enums so data fields never drop records
        const res = await getAdminReports(["submitted", "approved", "rejected", "saved", "in-progress", "re-assigned", "review"]);
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
      <Loader2 className="animate-spin text-black mb-3" size={32} />
      <span className={`${passero.className} text-sm uppercase tracking-[0.3em] text-zinc-400`}>Accessing Data Stream...</span>
    </div>
  );

  if (!detail) return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-10 bg-white">
      <ShieldAlert size={40} className="mb-4 text-rose-600" />
      <h1 className={`${robotoSlab.className} text-2xl font-black uppercase tracking-tight`}>Data Node Offline</h1>
      <p className="text-[10px] font-mono text-zinc-400 mt-2 mb-8 uppercase tracking-widest">Reference ID token: {id}</p>
      <Link href="/admin/savedresume" className="border-2 border-black text-black px-8 py-3 text-[10px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all rounded-xl">
        Return to Operational Pipeline
      </Link>
    </div>
  );

  const formData = detail.formData || {};
  const pdfUrl = detail.resumeId?.fileUrl;

  return (
    <div className={`${ubuntu.className} h-screen flex flex-col overflow-hidden text-black bg-white`}>
      
      {/* ── HEADER LAYOUT BLOCK ── */}
      <header className="h-20 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin/savedresume" className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-black hover:border-black transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className={`${robotoSlab.className} text-xl font-black uppercase tracking-tight leading-none`}>
              Inspection <span className="text-zinc-400 font-light">Canvas</span>
            </h2>
            <div className="flex items-center gap-2 mt-1.5 font-mono text-[9px]">
              <span className={`font-sans font-black uppercase px-2 py-0.5 rounded text-[8px] tracking-wider border
                ${detail.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  detail.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                {detail.status}
              </span>
              <span className="text-zinc-400">Instance Signature: {detail._id}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 select-none">
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-tight leading-none text-zinc-900">{detail.userId?.name || "Anonymous Worker"}</p>
            <p className="text-[9px] text-zinc-400 font-mono mt-1">ID: {detail.userId?.loginId || "N/A"}</p>
          </div>
          <div className="w-9 h-9 bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-mono font-black rounded-lg">
            {detail.userId?.name?.substring(0, 2).toUpperCase() || "OP"}
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden p-4 gap-4 bg-zinc-50/50">
        
        {/* LEFT CANVAS PANEL: EMBEDDED PDF WORKSPACE ENGINE */}
        <section className="w-[50%] h-full bg-white border border-zinc-200 rounded-2xl relative overflow-hidden shadow-xs">
          {pdfUrl ? (
            <PdfViewer fileUrl={pdfUrl} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-white select-none">
              <FileText size={32} className="text-zinc-200" />
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-300">Baseline Document Reference Lost</span>
            </div>
          )}
        </section>

        {/* RIGHT DATA FIELD MATRIX PANEL */}
        <section className="w-[50%] bg-white border border-zinc-200 p-8 lg:p-10 rounded-2xl shadow-xs overflow-y-auto no-scrollbar relative">
          <div className="max-w-xl mx-auto space-y-10 pb-20">
            
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-4 shrink-0">
              <Database size={16} className="text-zinc-400" />
              <span className={`${robotoSlab.className} text-md font-black uppercase tracking-wider`}>
                Extracted Payload Records
              </span>
            </div>

            {/* IDENTITY TRACK NODE */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-black pl-3 select-none">
                <User size={14} className="text-zinc-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Personal Identity Bounds</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <DataField label="First Name" value={formData.firstName} />
                <DataField label="Middle Name" value={formData.middleName} />
                <DataField label="Last Name" value={formData.lastName} />
                <DataField label="Date of Birth" value={formData.dob} />
                <DataField label="Gender Identity" value={formData.gender} />
                <DataField label="Nationality" value={formData.nationality} />
                <DataField label="Marital Status" value={formData.maritalStatus} />
                <DataField label="Passport ID Document" value={formData.passport} />
              </div>
              <DataField label="Hobbies & Extra-Curricular Interests" value={formData.hobbies} full />
              <DataField label="Linguistic Proficiencies" value={formData.languages} full />
            </div>

            {/* GEOLOCATION COMMUNICATION NODE */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-black pl-3 select-none">
                <MapPin size={14} className="text-zinc-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Communication parameters</span>
              </div>
              <DataField label="Mailing Address Line" value={formData.address} full />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <DataField label="Nearby Landmark" value={formData.landmark} />
                <DataField label="City / Core" value={formData.city} />
                <DataField label="State / Region" value={formData.state} />
                <DataField label="Postal Pin-code" value={formData.pincode} />
                <DataField label="Worker Mobile Link" value={formData.mobile} />
              </div>
              <DataField label="Contact Email Address" value={formData.email} full />
            </div>

            {/* ACADEMIC PROGRESSION MATRIX */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-black pl-3 select-none">
                <GraduationCap size={14} className="text-zinc-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Academic History Chronicles</span>
              </div>
              
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-zinc-400 block">SSC Profile Metrics</span>
                <div className="grid grid-cols-3 gap-3">
                  <DataField label="SSC % / Marks" value={formData.sscResult} />
                  <DataField label="Academic Board" value={formData.sscBoard} />
                  <DataField label="Passing Year" value={formData.sscYear} />
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-zinc-400 block">HSC Profile Metrics</span>
                <div className="grid grid-cols-3 gap-3">
                  <DataField label="HSC % / Marks" value={formData.hscResult} />
                  <DataField label="Academic Board" value={formData.hscBoard} />
                  <DataField label="Passing Year" value={formData.hscYear} />
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-zinc-400 block">Undergraduate Education</span>
                <div className="grid grid-cols-2 gap-3">
                  <DataField label="Degree Specification" value={formData.gradDegree} />
                  <DataField label="Final Score / CGPA" value={formData.gradResult} />
                  <DataField label="University Body" value={formData.gradUniversity} />
                  <DataField label="Graduation Year" value={formData.gradYear} />
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-zinc-400 block">Post-Graduate Registry</span>
                <div className="grid grid-cols-3 gap-3">
                  <DataField label="PG Degree" value={formData.pgDegree} />
                  <DataField label="PG Cumulative Score" value={formData.pgResult} />
                  <DataField label="Completion Year" value={formData.pgYear} />
                </div>
                <DataField label="Higher Professional Qualifications / Certifications" value={formData.higherEducation} full />
              </div>
            </div>

            {/* INDUSTRIAL WORK SYSTEM MATRIX */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-black pl-3 select-none">
                <Briefcase size={14} className="text-zinc-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Professional Tenure Log</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <DataField label="Experience (Months)" value={formData.expMonths} />
                <DataField label="Experience (Years)" value={formData.expYears} />
                <DataField label="Total Calculated Months" value={formData.totalMonths} />
                <DataField label="Organizations Served" value={formData.noOfCompanies} />
              </div>
              <DataField label="Last Functional Clearing Employer" value={formData.lastEmployer} full />
            </div>

            {/* ACTION INTERACTION BOUNDARY */}
            <div className="pt-4 flex gap-4 border-t border-zinc-100 select-none">
              <Link 
                href="/admin/savedresume"
                className="flex-1 text-center border-2 border-zinc-200 text-zinc-700 font-black text-[10px] uppercase tracking-wider py-3.5 rounded-xl hover:border-black hover:text-black transition-all"
              >
                Return to pipeline terminal
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// System Constant Field Generator
function DataField({ label, value, full = false }) {
  // Gracefully handles empty whitespace strings or structural null parameters down the line cleanly
  const hasContent = value !== undefined && value !== null && value.toString().trim() !== "";

  return (
    <div className={`${full ? 'col-span-full' : ''} space-y-1`}>
      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-0.5 select-none">
        {label}
      </label>
      <div className="w-full bg-white border-b-2 border-zinc-100 px-0.5 py-1.5 text-xs font-bold text-black flex items-center transition-all hover:border-zinc-400 select-all min-h-[32px]">
        {hasContent ? (
          value.toString().trim()
        ) : (
          <span className="text-zinc-200 font-mono font-medium lowercase text-[9px] select-none">null_stream</span>
        )}
      </div>
    </div>
  );
}