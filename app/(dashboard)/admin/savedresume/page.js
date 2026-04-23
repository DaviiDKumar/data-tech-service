import { getAdminSavedResumes } from "@/app/actions/admin";
import { ubuntu, passero } from "@/lib/fonts";
import Link from "next/link";
import { FileText, ExternalLink, ShieldCheck, Clock, User as UserIcon, ChevronRight } from "lucide-react";

export default async function AdminSavedResumesPage() {
    // Fetching data using your specific action
    const response = await getAdminSavedResumes();
    const resumes = response.data || [];
    console.log(resumes);


    if (!response.success) {
        return (
            <div className="p-20 text-center font-mono text-red-500">
                SYSTEM_ERROR: {response.error}
            </div>
        );
    }

    return (
        <div className={`${ubuntu.className} min-h-screen bg-white text-black`}>
            {/* STICKY HEADER */}
            <header className="sticky top-0 z-50 bg-white border-b border-black px-8 py-6 flex justify-between items-end">
                <div>
                    <h1 className={`${passero.className} text-4xl font-black tracking-tighter uppercase leading-none`}>
                        DTS <span className="text-gray-300">/</span> ADMIN
                    </h1>
                    <p className="text-[10px] font-mono mt-2 tracking-[0.2em] text-gray-400 uppercase">
                        Growthforge Data Service // Pipeline Management
                    </p>
                </div>
                <div className="text-right font-mono">
                    <span className="text-[10px] text-gray-400 block uppercase">Active Pool</span>
                    <span className="text-2xl font-bold">{resumes.length}</span>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto">
                {/* DATA GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumes.map((item) => {
                        const userName = item.userId?.name || "ORPHAN_USER";
                        const userEmail = item.userId?.email || "NO_CONTACT";
                        const fileName = item.resumeId?.originalName || "DOCUMENT_NULL.PDF";
                        const fileLink = item.resumeId?.fileUrl || "#";

                        return (
                            <div
                                key={item._id}
                                className="border border-black p-6 hover:bg-gray-50 transition-all group flex flex-col justify-between h-full"
                            >
                                <div>
                                    {/* STATUS BADGE */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`text-[9px] font-black px-2 py-1 border border-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${item.status === 'review' ? 'bg-yellow-400' :
                                                item.status === 'saved' ? 'bg-green-400' : 'bg-blue-400'
                                            }`}>
                                            {item.status}
                                        </div>
                                        <span className="text-[9px] font-mono text-gray-400 italic">
                                            ID: {item._id.toString().slice(-6).toUpperCase()}
                                        </span>
                                    </div>

                                    {/* USER INFO */}
                                    <div className="mb-6">
                                        <h2 className="text-lg font-bold leading-tight uppercase truncate">
                                            {userName}
                                        </h2>
                                        <p className="text-xs font-mono text-gray-500 truncate lowercase italic">
                                            {userEmail}
                                        </p>
                                    </div>

                                    {/* FILE PREVIEW BOX */}
                                    <div className="bg-black text-white p-4 mb-6 flex justify-between items-center group-hover:invert transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText size={16} className="shrink-0" />
                                            <span className="text-[10px] font-mono font-bold truncate">
                                                {fileName}
                                            </span>
                                        </div>
                                        <a href={fileLink} target="_blank" className="hover:scale-110 transition-transform">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>

                                {/* FOOTER ACTIONS */}
                                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Clock size={10} />
                                        <span className="text-[9px] font-mono uppercase">
                                            {new Date(item.updatedAt).toLocaleDateString('en-GB')}
                                        </span>
                                    </div>
                                 
                                    <Link
                                        href={`/admin/reviewSaved/${item._id}`} // Points to the new separate page
                                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-black hover:underline"
                                    >
                                        Inspect <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* EMPTY STATE */}
                {resumes.length === 0 && (
                    <div className="py-40 text-center">
                        <div className="inline-block border border-dashed border-black px-10 py-6">
                            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                                Zero records found in pipeline
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}