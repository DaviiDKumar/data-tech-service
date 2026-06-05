"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    saveResumeProgress,
    submitResume,
    holdAndSaveResume,
    getWorkspaceData,
    skipResume,
} from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import { passero } from "@/lib/fonts";
import {
    ArrowLeft, CheckCircle, Loader2,
    FileText, Database, User,
    GraduationCap, Briefcase, MapPin, Lock, ArrowUpRight, CloudCheck,
    SkipForward
} from "lucide-react";
import Link from "next/link";

const PdfViewer = dynamic(() => import('./PdfViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white">
            <Loader2 className="animate-spin text-zinc-300" size={28} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">
                Loading Document...
            </span>
        </div>
    ),
});

function WorkspaceContent() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const userId = useUserStore((state) => state.user?.id);
    const userEndDate = useUserStore((state) => state.user?.endDate);
    const { updateUser } = useUserStore();

    const isReadOnly = searchParams.get('mode') === 'review';

    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(!!(id && id !== "undefined" && userId));
    const [activeAction, setActiveAction] = useState(null);
    const [globalError, setGlobalError] = useState(null);

    const [formData, setFormData] = useState({
        firstName: "", middleName: "", lastName: "", dob: "", gender: "",
        nationality: "", maritalStatus: "", passport: "", hobbies: "", languages: "",
        address: "", landmark: "", city: "", state: "", pincode: "", mobile: "", email: "",
        sscResult: "", sscBoard: "", sscYear: "",
        hscResult: "", hscBoard: "", hscYear: "",
        gradDegree: "", gradResult: "", gradUniversity: "", gradYear: "",
        pgDegree: "", pgResult: "", pgYear: "", higherEducation: "",
        expMonths: "", expYears: "", totalMonths: "", noOfCompanies: "", lastEmployer: ""
    });

    const isExpired = useMemo(() => {
        if (!userEndDate) return false;
        const now = new Date();
        const expiry = new Date(userEndDate);
        expiry.setHours(23, 59, 59, 999);
        return now > expiry;
    }, [userEndDate]);

    // 1. Initial Data Load Sequence
    useEffect(() => {
        if (!id || id === "undefined" || !userId) return;
        let isMounted = true;
        async function fetchResumeData() {
            try {
                const res = await getWorkspaceData(id, userId);
                if (!isMounted) return;
                if (!res.success) { setGlobalError(res.message || res.error); return; }
                setResume(res.data);
                if (res.data?.formData) {
                    setFormData(prev => ({ ...prev, ...res.data.formData }));
                }
            } catch (err) {
                console.error("Workspace fetch error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchResumeData();
        return () => { isMounted = false; };
    }, [id, userId]);

    // 2. Pure Change Handler (No Auto-Save Background Triggers)
    const handleChange = (e) => {
        if (isReadOnly || globalError || isExpired) return;
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleHoldSave = async () => {
        if (isReadOnly || globalError || isExpired || activeAction) return;
        setActiveAction('save');

        try {
            const cleanData = { ...formData };
            const res = await holdAndSaveResume(id, userId, cleanData);

            if (res.success) {
                if (res.newData) updateUser(res.newData);
                alert(res.message || "Resume progress parked.");
                router.push("/user/reassigned");
            } else {
                alert(res.error || "Save failed.");
            }
        } catch (err) {
            console.error("🔥 Manual Save Crash:", err);
            alert(`An error occurred: ${err.message}`);
        } finally {
            setActiveAction(null);
        }
    };

    const handleSubmit = async () => {
        if (isReadOnly || globalError || isExpired || activeAction) return;
        if (!window.confirm("Submit this resume as final?")) return;

        setActiveAction('submit');
        try {
            const res = await submitResume(id, userId, formData);
            if (res.success) {
                if (res.newData) updateUser(res.newData);
                router.push("/user/submitted");
            } else {
                alert(res.error || "Submission failed.");
            }
        } catch (err) {
            console.error("Submission Crash:", err);
            alert("An error occurred during submission.");
        } finally {
            setActiveAction(null);
        }
    };

    const handleSkip = async () => {
        if (isReadOnly || globalError || isExpired || activeAction) return;

        // ✅ FIXED: Completely removed the dead saveTimeoutRef check block

        if (!window.confirm("Skip this template layout and request the next available data file?")) return;

        setActiveAction('skip');
        try {
            const res = await skipResume(id, userId);
            if (res.success) {
                if (res.resumeId) {
                    router.push(`/user/workspace/${res.resumeId}`);
                    router.refresh(); // Forces hot reload of server components inside layout
                } else {
                    alert(res.message || "All files completed across system queues.");
                    router.push("/user");
                }
            } else {
                alert(res.error || "Skip process rejected.");
            }
        } catch {
            alert("Internal worker script crash while executing skip.");
        } finally {
            setActiveAction(null);
        }
    };
    if (globalError || isExpired) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-50 font-sans">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-2 border-red-100 max-w-md">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <Lock size={40} />
                    </div>
                    <h2 className={`${passero.className} text-3xl uppercase tracking-tighter text-slate-900 mb-4`}>
                        Workspace Locked
                    </h2>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                        {isExpired || globalError === "ACCESS_DENIED"
                            ? "Your project timeline has ended. Access to this workspace has been restricted."
                            : globalError}
                    </p>
                    <button
                        onClick={() => router.push('/user')}
                        className="mt-8 w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white text-black">
            <Loader2 className="animate-spin" size={40} />
            <p className={`${passero.className} text-[10px] uppercase tracking-[5px] text-zinc-400`}>
                Validating Access...
            </p>
        </div>
    );

    const anyActionLoading = !!activeAction;

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">

            {/* --- HEADER --- */}
            <header className="shrink-0 h-24 border-b border-slate-500 px-6 flex items-center justify-between bg-white z-50">
                <div className="flex items-center gap-4">
                    <Link
                        href={isReadOnly ? "/user/rejected" : "/user/reassigned"}
                        className="p-2 hover:bg-black hover:text-white rounded-xl transition-all"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="w-px h-12 bg-black" />
                    <div className="flex flex-col gap-2">
                        <h2 className="text-[14px] font-black text-black flex items-center gap-2">
                            <FileText size={14} />
                            <span className="max-w-xs">{resume?.originalName || "Untitled Resume"}</span>
                        </h2>

                    </div>
                </div>

                {!isReadOnly && (
                    <div className="flex items-center gap-3">
                        {/* SKIP ACTION */}
                        <button
                            onClick={handleSkip}
                            disabled={anyActionLoading}
                            className="group px-5 py-3 border-2 border-amber-400 bg-white text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-amber-400 hover:text-white transition-all duration-300 disabled:opacity-30 rounded-xl flex items-center justify-center min-w-[130px]"
                        >
                            {activeAction === 'skip' ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    <SkipForward size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    Skip Track
                                </span>
                            )}
                        </button>

                        {/* HOLD & SAVE */}
                        {/* HOLD & SAVE BUTTON */}
                        <button
                            type="button" // 👈 CRUCIAL: Prevents the browser from misfiring this as a submit action
                            onClick={handleHoldSave}
                            disabled={anyActionLoading}
                            className="px-6 py-3 border-2 border-violet-600 bg-white text-violet-600 text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            {activeAction === 'save' ? "Parking..." : "Hold & Save"}
                        </button>

                        {/* SUBMIT FINAL */}
                        <button
                            onClick={handleSubmit}
                            disabled={anyActionLoading}
                            className="group px-6 py-3 bg-emerald-600 border-2 border-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-emerald-700 hover:border-emerald-700 transition-all duration-300 disabled:opacity-30 rounded-xl flex items-center justify-center min-w-[150px]"
                        >
                            {activeAction === 'submit' ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Submit Final
                                    <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </header>

            {/* --- BODY --- */}
            <main className="flex flex-1 min-h-0 overflow-hidden">
                {/* LEFT: CANVAS PDF */}
                <section className="w-1/2 h-full flex flex-col border-r-2 bg-white overflow-hidden">
                    <div className="flex-1 bg-zinc-200 p-4 relative overflow-hidden">
                        <div className="w-full h-full bg-white rounded-2xl border-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)] relative overflow-hidden">
                            {resume?.fileUrl ? (
                                <PdfViewer fileUrl={resume.fileUrl} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                                        <FileText size={24} className="text-slate-300" />
                                    </div>
                                    <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">
                                        Awaiting Document...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-white border-t-2 border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">SSL Encrypted Stream</span>
                        </div>
                        <span className={`${passero.className} text-xs text-slate-300 opacity-50`}>DataSort Reader v2</span>
                    </div>
                </section>

                {/* RIGHT: DATA FIELDS SHEET FORM */}
                <section className={`w-1/2 h-full overflow-y-auto bg-white p-10 scroll-smooth ${isReadOnly ? 'bg-zinc-50' : ''}`}>
                    <div className="max-w-2xl mx-auto space-y-14 pb-24">
                        <header className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-md">
                                <Database size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">
                                    ID: {id?.slice(-6) ?? "------"}
                                </span>
                            </div>
                            <h3 className={`${passero.className} text-5xl uppercase tracking-tighter text-black leading-none`}>
                                Data Extraction
                            </h3>
                        </header>

                        {/* --- IDENTITY SECTION --- */}
                        <FormSection icon={<User size={14} />} title="Identity Details">
                            <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} disabled={isReadOnly} />
                            <DobInput label="Date of Birth" name="dob" value={formData.dob} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Gender" name="gender" value={formData.gender} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Passport ID" name="passport" value={formData.passport} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Hobbies / Interests" name="hobbies" value={formData.hobbies} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Linguistic Skills" name="languages" value={formData.languages} onChange={handleChange} disabled={isReadOnly} />
                        </FormSection>

                        {/* --- CONTACT SECTION --- */}
                        <FormSection icon={<MapPin size={14} />} title="Geolocation & Comms">
                            <Input label="Full Address" name="address" value={formData.address} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Landmark Location" name="landmark" value={formData.landmark} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="City" name="city" value={formData.city} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="State / Region" name="state" value={formData.state} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Secure Mobile" name="mobile" value={formData.mobile} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Verified Email" name="email" value={formData.email} onChange={handleChange} type="email" disabled={isReadOnly} />
                        </FormSection>

                        {/* --- ACADEMIC SECTION --- */}
                        <FormSection icon={<GraduationCap size={14} />} title="Academic History">
                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">SSC Details</p>
                                <Input label="SSC %" name="sscResult" value={formData.sscResult} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="Board" name="sscBoard" value={formData.sscBoard} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="Year" name="sscYear" value={formData.sscYear} onChange={handleChange} disabled={isReadOnly} />
                            </div>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">HSC Details</p>
                                <Input label="HSC %" name="hscResult" value={formData.hscResult} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="Board" name="hscBoard" value={formData.hscBoard} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="Year" name="hscYear" value={formData.hscYear} onChange={handleChange} disabled={isReadOnly} />
                            </div>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Graduation</p>
                                <Input label="Degree" name="gradDegree" value={formData.gradDegree} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="CGPA / Result" name="gradResult" value={formData.gradResult} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="University" name="gradUniversity" value={formData.gradUniversity} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="Year" name="gradYear" value={formData.gradYear} onChange={handleChange} disabled={isReadOnly} />
                            </div>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Post Graduation (if any)</p>
                                <Input label="PG Degree" name="pgDegree" value={formData.pgDegree} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="PG Result" name="pgResult" value={formData.pgResult} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="PG Year" name="pgYear" value={formData.pgYear} onChange={handleChange} disabled={isReadOnly} />
                                <Input label="Higher Education" name="higherEducation" value={formData.higherEducation} onChange={handleChange} disabled={isReadOnly} />
                            </div>
                        </FormSection>

                        {/* --- WORK EXPERIENCE SECTION --- */}
                        <FormSection icon={<Briefcase size={14} />} title="Work Experience">
                            <Input label="Experience (Months)" name="expMonths" value={formData.expMonths} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Experience (Years)" name="expYears" value={formData.expYears} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Total Months" name="totalMonths" value={formData.totalMonths} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="No. of Companies" name="noOfCompanies" value={formData.noOfCompanies} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Last Employer" name="lastEmployer" value={formData.lastEmployer} onChange={handleChange} disabled={isReadOnly} />
                        </FormSection>

                        <footer className="pt-4 opacity-20 text-center">
                            <p className={`${passero.className} text-sm uppercase tracking-[0.5em]`}>Data Extraction Complete</p>
                        </footer>
                    </div>
                </section>
            </main>
        </div>
    );
}

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

function Input({ label, name, value, onChange, type = "text", disabled = false }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[12px] font-semibold tracking-widest text-zinc-800">{label}</label>
            <input
                type={type}
                name={name}
                value={value || ""}
                onChange={onChange}
                disabled={disabled}
                placeholder={disabled ? "" : "---"}
                className={`w-full border-2 rounded-xl px-5 py-3.5 text-xs font-bold outline-none transition-all placeholder:text-zinc-300
                    ${disabled
                        ? 'bg-zinc-50 border-zinc-100 text-zinc-800 cursor-not-allowed'
                        : 'bg-white border-zinc-200 focus:border-black cursor-text'
                    }`}
            />
        </div>
    );
}

function DobInput({ label, name, value, onChange, disabled = false }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[12px] font-semibold tracking-widest text-zinc-800">{label}</label>
            <input
                type="text"
                name={name}
                value={value || ""}
                onChange={onChange}
                disabled={disabled}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                className={`w-full border-2 rounded-xl px-5 py-3.5 text-xs font-bold outline-none transition-all placeholder:text-zinc-300
                    ${disabled
                        ? 'bg-zinc-50 border-zinc-100 text-zinc-800 cursor-not-allowed'
                        : 'bg-white border-zinc-200 focus:border-black cursor-text'
                    }`}
            />
        </div>
    );
}

export default dynamic(() => Promise.resolve(WorkspaceContent), { ssr: false });