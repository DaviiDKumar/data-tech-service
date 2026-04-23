"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getAdminSavedResumes } from "@/app/actions/admin"; 
import { ubuntu, passero } from "@/lib/fonts";
import { 
  ArrowLeft, FileText, Database, Loader2, 
  ShieldAlert, User, Mail, Hash, ChevronRight, ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function ReviewSavedDetailPage() {
    const { id } = useParams();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            // Fetching using your specific function
            const res = await getAdminSavedResumes(["saved", "in-progress", "re-assigned", "review"]);
            if (res.success) {
                // Find the specific record David kumar / others from the returned array
                const currentItem = res.data.find(item => item._id === id);
                if (currentItem) setDetail(currentItem);
            }
            setLoading(false);
        }
        loadData();
    }, [id]);

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center ">
            <Loader2 className="animate-spin text-black mb-4" size={40} />
            <span className={`${passero.className} text-xl uppercase tracking-widest`}>Accessing Data Stream...</span>
        </div>
    );

    if (!detail) return (
        <div className="h-screen flex flex-col items-center justify-center text-center p-10 ">
            <ShieldAlert size={48} className="mb-4 text-black" />
            <h1 className={`${passero.className} text-3xl uppercase tracking-tighter`}>Node Offline</h1>
            <p className="text-[10px] font-mono text-gray-400 mt-2 mb-8 uppercase tracking-widest italic">Reference: {id}</p>
            <Link href="/admin/savedresume" className="border border-black px-10 py-3 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all">
                Return to Pipeline
            </Link>
        </div>
    );

    const formData = detail.formData || {};

    return (
        <div className={`${ubuntu.className} h-screen flex flex-col  overflow-hidden text-black`}>
            
            {/* --- BLACK & WHITE HEADER --- */}
            <header className="h-20 bg-white border-b border-black px-8 flex items-center justify-between shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/admin/savedresume" className="w-10 h-10 border border-black rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 className={`${passero.className} text-3xl uppercase italic tracking-tighter leading-none`}>
                            Audit <span className="text-gray-300">/</span> Instance
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">{detail.status}</span>
                             <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">Instance: {detail._id}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[11px] font-bold uppercase leading-none">{detail.userId?.name || "Guest"}</p>
                        <p className="text-[9px] text-gray-400 font-mono italic">{detail.userId?.email}</p>
                    </div>
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-xs font-bold rounded-lg shadow-[4px_4px_0px_0px_rgba(200,200,200,1)]">
                        {detail.userId?.name?.substring(0,2).toUpperCase()}
                    </div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden p-6 gap-6 bg-[#F9F9F9]">
                
                {/* PDF PANEL (LEFT) */}
                <section className="w-[50%] bg-black  overflow-hidden relative border border-black shadow-2xl">
                    <div className="absolute top-6 left-6 z-10 bg-white border border-black text-black px-4 py-2 text-[9px] font-bold uppercase tracking-widest">
                        {detail.resumeId?.originalName || "SOURCE_FILE.PDF"}
                    </div>
                    <iframe 
                        src={`${detail.resumeId?.fileUrl}#toolbar=0&view=FitH`} 
                        className="w-full h-full bg-white opacity-95 grayscale hover:grayscale-0 transition-all duration-500"
                        title="Resume Feed"
                    />
                </section>

                {/* DATA MATRIX (RIGHT) */}
                <section className="w-[50%] bg-white  overflow-y-auto no-scrollbar border border-black p-12 relative">
                    <div className="max-w-xl mx-auto space-y-16 pb-32">
                        
                        <div className="flex items-center gap-3 border-b border-black pb-8">
                            <Database size={20} />
                            <span className={`${passero.className} text-xl tracking-[0.2em] uppercase`}>
                                Data <span className="opacity-20 italic underline">Extraction</span>
                            </span>
                        </div>

                        {/* SECTION: Identity */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-2 border-l-4 border-black pl-4">
                                <User size={16}/>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Personal Node</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <DataField label="Given Name" value={formData.firstName} />
                                <DataField label="Family Name" value={formData.lastName} />
                                <DataField label="Date of Birth" value={formData.dob} />
                                <DataField label="Gender" value={formData.gender} />
                            </div>
                        </div>

                        {/* SECTION: Contact */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-2 border-l-4 border-black pl-4">
                                <Mail size={16}/>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Communication Layer</span>
                            </div>
                            <DataField label="Official Email" value={formData.email} full />
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <DataField label="Secure Mobile" value={formData.mobile} />
                                <DataField label="Current City" value={formData.city} />
                            </div>
                        </div>

                        {/* ACTION FOOTER */}
                        <div className="pt-12 flex gap-4">
                            <button className="flex-1 border border-black py-4 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                                Request Edit
                            </button>
                            <button className="flex-1 bg-black text-white py-4 text-[10px] font-black uppercase tracking-widest hover:invert transition-all">
                                Approve Node
                            </button>
                        </div>

                        <footer className="pt-10 opacity-10 text-center">
                            <p className={`${passero.className} text-[10px] uppercase tracking-[1.5em]`}>Growthforge DTS</p>
                        </footer>
                    </div>
                </section>
            </main>
        </div>
    );
}

// Minimalist High-Contrast Field
function DataField({ label, value, full = false }) {
    return (
        <div className={`${full ? 'col-span-full' : ''} space-y-2`}>
            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">
                {label}
            </label>
            <div className="w-full bg-white border-b-2 border-gray-100 px-1 py-3 text-sm font-bold text-black flex items-center transition-all hover:border-black">
                {value || <span className="text-gray-200 italic font-medium uppercase text-[10px]">null_stream</span>}
            </div>
        </div>
    );
}