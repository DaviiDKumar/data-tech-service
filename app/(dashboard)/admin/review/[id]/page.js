"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminReports, bulkUpdateResumeStatus } from "@/app/actions/admin"; 
import { passero, robotoSlab } from "@/lib/fonts";
import { 
  ArrowLeft, CheckCircle, XCircle, FileText, User, GraduationCap, 
  Briefcase, Loader2, Mail, ShieldCheck, MapPin, Info, Database, Send,
  Activity, Eye
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
          console.log(currentItem);
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
    if (!window.confirm(`Confirm Audit: Mark as ${status.toUpperCase()}?`)) return;
    setIsActionLoading(true);
    const res = await bulkUpdateResumeStatus([id], status);
    if (res.success) router.push("/admin/submitted");
    setIsActionLoading(false);
  };

  
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-200 gap-4">
      <Loader2 className="animate-spin text-black" size={40} />
      <span className={`${passero.className} text-xl tracking-widest`}>Initializing Audit...</span>
    </div>
  );


  const formData = detail?.formData || {};

  return (
    <div className={`h-screen flex flex-col bg-gray-200 overflow-hidden ${robotoSlab.className} text-black`}>
      
      {/* --- PREMIUM HEADER --- */}
      <header className="h-24 bg-white border-b border-white px-8 flex items-center justify-between shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-8">
          <Link href="/admin/submitted" className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all group shadow-inner">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col">
            <h2 className={`${passero.className} text-2xl uppercase italic tracking-tight flex items-center gap-3`}>
              <Eye size={20} className="text-black" /> Audit: <span className="opacity-30">{detail?.resumeId?.originalName}</span>
            </h2>
            <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest text-black/40">
               Node: <span className="text-black italic">{detail?.userId?.name}</span>
               <div className="w-1 h-1 bg-black/10 rounded-full" />
               State: <span className="text-black">{detail?.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleDecision('rejected')} 
            disabled={isActionLoading} 
            className="px-8 h-14 bg-white border border-gray-200 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 shadow-sm"
          >
            Revoke Access
          </button>
          <button 
            onClick={() => handleDecision('approved')} 
            disabled={isActionLoading} 
            className="px-10 h-14 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all disabled:opacity-30 shadow-2xl shadow-black/20"
          >
            Authorize Data
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden p-6 gap-6">
        
        {/* LEFT: DOCUMENT NODE */}
        <section className="w-1/2 rounded-[3rem] overflow-hidden bg-white shadow-xl border border-white">
            <div className="h-full relative group">
              <iframe 
                src={`${detail?.resumeId?.fileUrl}#toolbar=0`} 
                className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700" 
                title="Review PDF" 
              />
              <div className="absolute top-6 left-6 bg-black text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Live Source Preview
              </div>
            </div>
        </section>

        {/* RIGHT: DATA EXTRACTION FORGE */}
        <section className="w-1/2 bg-white rounded-[3rem] overflow-y-auto no-scrollbar shadow-sm border border-white">
          <div className="max-w-xl mx-auto py-16 px-10 space-y-16 pb-40">
            
            <header className="space-y-2 border-b border-gray-100 pb-8">
              <div className="flex items-center gap-2 text-black/20 mb-2">
                <Database size={14} />
                <span className="text-[9px] font-black uppercase tracking-[0.4em]">GrowthForge DTS Engine</span>
              </div>
              <h3 className={`${passero.className} text-6xl uppercase italic tracking-tighter leading-none`}>
                Parsed <span className="opacity-20">Matrix</span>
              </h3>
            </header>

            {/* Personal Details */}
            <ReviewNode icon={<User size={18}/>} title="Identity Node">
              <div className="grid grid-cols-2 gap-4">
                <DataField label="First Name" value={formData.firstName} />
                <DataField label="Middle Name" value={formData.middleName} />
                <DataField label="Last Name" value={formData.lastName} />
                <DataField label="D.O.B" value={formData.dob} />
                <DataField label="Gender" value={formData.gender} />
                <DataField label="Nationality" value={formData.nationality} />
                <DataField label="Marital Status" value={formData.maritalStatus} />
                <DataField label="Passport ID" value={formData.passport} />
              </div>
              <DataField label="Hobbies / Interests" value={formData.hobbies} full />
              <DataField label="Linguistic Skills" value={formData.languages} full />
            </ReviewNode>

            {/* Communication Details */}
            <ReviewNode icon={<MapPin size={18}/>} title="Geolocation & Comms">
              <DataField label="Full Address" value={formData.address} full />
              <div className="grid grid-cols-2 gap-4">
                <DataField label="City" value={formData.city} />
                <DataField label="State / Region" value={formData.state} />
                <DataField label="Pincode" value={formData.pincode} />
                <DataField label="Secure Mobile" value={formData.mobile} />
              </div>
              <DataField label="Verified Email" value={formData.email} full />
            </ReviewNode>

            {/* Qualification Details */}
            <ReviewNode icon={<GraduationCap size={18}/>} title="Academic History">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <DataField label="SSC %" value={formData.sscResult} />
                  <DataField label="Board" value={formData.sscBoard} />
                  <DataField label="Year" value={formData.sscYear} />
                </div>
                <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <DataField label="HSC %" value={formData.hscResult} />
                  <DataField label="Board" value={formData.hscBoard} />
                  <DataField label="Year" value={formData.hscYear} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <DataField label="Undergrad Degree" value={formData.gradDegree} />
                <DataField label="CGPA / Result" value={formData.gradResult} />
                <DataField label="University" value={formData.gradUniversity} />
                <DataField label="Year" value={formData.gradYear} />
              </div>
            </ReviewNode>

            {/* Employment Details */}
            <ReviewNode icon={<Briefcase size={18}/>} title="Work Experience">
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Exp (Months)" value={formData.expMonths} />
                <DataField label="Exp (Years)" value={formData.expYears} />
                <DataField label="Node Total" value={formData.totalMonths} />
                <DataField label="Total Orgs" value={formData.noOfCompanies} />
              </div>
              <DataField label="Last Authority / Employer" value={formData.lastEmployer} full />
            </ReviewNode>

            <footer className="pt-10 opacity-20 text-center">
              <p className={`${passero.className} text-sm uppercase tracking-[0.5em]`}>Audit Protocol Complete</p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

/* --- REUSABLE AUDIT COMPONENTS --- */

function ReviewNode({ icon, title, children }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-xl">
          {icon}
        </div>
        <h4 className={`${passero.className} text-xl uppercase italic tracking-widest text-black`}>{title}</h4>
      </div>
      <div className="space-y-4 pl-2">{children}</div>
    </div>
  );
}

function DataField({ label, value, full = false }) {
  return (
    <div className={`space-y-1.5 ${full ? 'col-span-full' : ''}`}>
      <label className="text-[9px] font-black uppercase tracking-widest text-black/30 px-1">{label}</label>
      <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold text-black min-h-[56px] flex items-center transition-all hover:bg-gray-100/50">
        {value || <span className="opacity-10 italic font-medium">No Data Input</span>}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminReviewDetailContent), { ssr: false });