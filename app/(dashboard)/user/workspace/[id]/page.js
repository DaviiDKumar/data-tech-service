"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
    saveResumeProgress, 
    submitResume, 
    holdAndSaveResume, 
    getWorkspaceData 
} from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import { passero } from "@/lib/fonts";
import {
    ArrowLeft, CheckCircle, Loader2, 
    Save, FileText, Database, User, 
    GraduationCap, Briefcase, MapPin, Lock, Eye
} from "lucide-react";
import Link from "next/link";

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
    const [saveStatus, setSaveStatus] = useState("synced");
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [globalError, setGlobalError] = useState(null);

    const [formData, setFormData] = useState({
        // Identity
        firstName: "", middleName: "", lastName: "", dob: "", gender: "",
        nationality: "", maritalStatus: "", passport: "", hobbies: "", languages: "",
        // Contact
        address: "", landmark: "", city: "", state: "", pincode: "", mobile: "", email: "",
        // Academic
        sscResult: "", sscBoard: "", sscYear: "",
        hscResult: "", hscBoard: "", hscYear: "",
        gradDegree: "", gradResult: "", gradUniversity: "", gradYear: "",
        pgDegree: "", pgResult: "", pgYear: "", higherEducation: "",
        // Experience
        expMonths: "", expYears: "", totalMonths: "", noOfCompanies: "", lastEmployer: ""
    });

    const saveTimeoutRef = useRef(null);

    const isExpired = useMemo(() => {
        if (!userEndDate) return false;
        const now = new Date();
        const expiry = new Date(userEndDate);
        expiry.setHours(23, 59, 59, 999);
        return now > expiry;
    }, [userEndDate]);

    const performSync = useCallback(async (dataToSave) => {
        if (!userId || !id || isReadOnly || globalError || isExpired) return;
        setSaveStatus("syncing");
        try {
            const res = await saveResumeProgress(id, userId, dataToSave);
            if (!res.success && res.error === "ACCESS_DENIED") {
                setGlobalError(res.message);
            }
        } finally {
            setSaveStatus("synced");
        }
    }, [id, userId, isReadOnly, globalError, isExpired]);

    const triggerAutoSave = useCallback((newData) => {
        if (isReadOnly || globalError || isExpired) return;
        setSaveStatus("syncing");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => performSync(newData), 30000);
    }, [performSync, isReadOnly, globalError, isExpired]);

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

    useEffect(() => {
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, []);

    const handleChange = (e) => {
        if (isReadOnly || globalError || isExpired) return;
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };
        setFormData(updatedData);
        triggerAutoSave(updatedData);
    };

    const isFormComplete = () =>
        Object.values(formData).every(val => val?.toString().trim() !== "");

    const handleSubmit = async () => {
        if (isReadOnly || globalError || isExpired) return;
        if (!window.confirm("Submit this resume as final?")) return;
        setIsActionLoading(true);
        try {
            const res = await submitResume(id, userId, formData);
            if (res.success) {
                if (res.newData) updateUser(res.newData);
                router.push("/user/submitted");
            } else {
                alert(res.error || "Submission failed.");
                setIsActionLoading(false);
            }
        } catch {
            alert("An error occurred.");
            setIsActionLoading(false);
        }
    };

    const handleHoldSave = async () => {
        if (isReadOnly || globalError || isExpired) return;
        if (!isFormComplete()) { alert("⚠️ All fields must be filled."); return; }
        setIsActionLoading(true);
        try {
            const res = await holdAndSaveResume(id, userId, formData);
            if (res.success) {
                if (res.newData) updateUser(res.newData);
                router.push("/user/allresumesavailable");
            } else {
                alert(res.error || "Save failed.");
                setIsActionLoading(false);
            }
        } catch {
            alert("An error occurred.");
            setIsActionLoading(false);
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

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden font-sans select-none">

            {/* ── HEADER ── */}
            <header className="shrink-0 h-16 border-b border-black px-6 flex items-center justify-between bg-white z-50">
                <div className="flex items-center gap-4">
                    <Link
                        href={isReadOnly ? "/user/rejected" : "/user/allresumesavailable"}
                        className="p-2 hover:bg-black hover:text-white rounded-xl transition-all"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="w-px h-6 bg-black" />
                    <div className="flex flex-col">
                        <h2 className="text-[11px] font-black uppercase text-black flex items-center gap-2">
                            <FileText size={14} />
                            <span className="truncate max-w-xs">{resume?.originalName || "Untitled Resume"}</span>
                        </h2>
                        {!isReadOnly && (
                            <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${saveStatus === 'syncing' ? 'text-zinc-400' : 'text-emerald-600'}`}>
                                {saveStatus === 'syncing'
                                    ? <><Loader2 size={10} className="animate-spin" /> Syncing...</>
                                    : <><CheckCircle size={10} /> Data Synced</>}
                            </span>
                        )}
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="flex items-center gap-3">
                        <button onClick={handleHoldSave} disabled={isActionLoading} className="px-5 py-2.5 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30 rounded-lg">
                            {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <span className="flex items-center gap-2"><Save size={12} /> Hold & Save</span>}
                        </button>
                        <button onClick={handleSubmit} disabled={isActionLoading} className="px-5 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md disabled:opacity-30 rounded-lg">
                            {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : "Submit Final"}
                        </button>
                    </div>
                )}
            </header>

            {/* ── BODY ── */}
            <main className="flex flex-1 min-h-0 overflow-hidden">

                {/* LEFT: PDF VIEWER */}
                <section className="w-1/2 h-full flex flex-col bg-zinc-100 border-r border-black overflow-hidden">
                    <div className="flex-1 p-4 overflow-hidden">
                        <div className="w-full h-full rounded-3xl overflow-hidden border-2 border-black bg-white shadow-2xl">
                            {resume?.fileUrl ? (
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(resume.fileUrl)}&embedded=true`}
                                    className="w-full h-full"
                                    title="Resume Preview"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-300">
                                    <FileText size={48} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">No Document</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* RIGHT: FORM */}
                <section className={`w-1/2 h-full overflow-y-auto bg-white p-10 scroll-smooth ${isReadOnly ? 'bg-zinc-50' : ''}`}>
                    <div className="max-w-2xl mx-auto space-y-14 pb-24">

                        {/* Page header */}
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

                        {/* ── IDENTITY ── */}
                        <FormSection icon={<User size={14} />} title="Identity Details">
                            <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Date of Birth" name="dob" value={formData.dob} onChange={handleChange} type="date" disabled={isReadOnly} />
                            <Input label="Gender" name="gender" value={formData.gender} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Passport ID" name="passport" value={formData.passport} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Hobbies / Interests" name="hobbies" value={formData.hobbies} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Linguistic Skills" name="languages" value={formData.languages} onChange={handleChange} disabled={isReadOnly} />
                        </FormSection>

                        {/* ── CONTACT ── */}
                        <FormSection icon={<MapPin size={14} />} title="Geolocation & Comms">
                            <Input label="Full Address" name="address" value={formData.address} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Landmark" name="landmark" value={formData.landmark} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="City" name="city" value={formData.city} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="State / Region" name="state" value={formData.state} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Secure Mobile" name="mobile" value={formData.mobile} onChange={handleChange} disabled={isReadOnly} />
                            <Input label="Verified Email" name="email" value={formData.email} onChange={handleChange} type="email" disabled={isReadOnly} />
                        </FormSection>

                        {/* ── ACADEMIC ── */}
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

                        {/* ── EXPERIENCE ── */}
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

/* ── SUB-COMPONENTS ── */

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
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
            <input
                type={type}
                name={name}
                value={value || ""}
                onChange={onChange}
                disabled={disabled}
                className={`w-full border-2 rounded-xl px-5 py-3.5 text-xs font-bold outline-none transition-all placeholder:text-zinc-300
                    ${disabled
                        ? 'bg-zinc-50 border-zinc-100 text-zinc-500 cursor-not-allowed'
                        : 'bg-white border-zinc-200 focus:border-black cursor-text'
                    }`}
                placeholder={disabled ? "" : "---"}
            />
        </div>
    );
}

export default dynamic(() => Promise.resolve(WorkspaceContent), { ssr: false });