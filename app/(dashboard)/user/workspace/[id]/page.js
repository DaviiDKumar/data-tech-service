"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { saveResumeProgress, submitResume, holdAndSaveResume } from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import {
    ArrowLeft, CloudSync, CheckCircle,
    Loader2, Send, Save, FileText, Database,
    User, GraduationCap, Briefcase, MapPin
} from "lucide-react";
import Link from "next/link";
import { getWorkspaceData } from "@/app/actions/userWork";

function WorkspaceContent() {
    const { id } = useParams();
    const router = useRouter();
    const userId = useUserStore((state) => state.user?.id);

    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState("synced");
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "", middleName: "", lastName: "", dob: "", gender: "",
        nationality: "", maritalStatus: "", passport: "", hobbies: "", languages: "",
        address: "", landmark: "", city: "", state: "", pincode: "", mobile: "", email: "",
        sscResult: "", sscBoard: "", sscYear: "", hscResult: "", hscBoard: "", hscYear: "",
        gradDegree: "", gradResult: "", gradUniversity: "", gradYear: "",
        pgDegree: "", pgResult: "", pgYear: "", higherEducation: "",
        expMonths: "", expYears: "", totalMonths: "", noOfCompanies: "", lastEmployer: ""
    });

    const saveTimeoutRef = useRef(null);

    const performSync = useCallback(async (dataToSave) => {
        if (!userId || !id) return;
        setSaveStatus("syncing");
        const res = await saveResumeProgress(id, userId, dataToSave);
        if (res.success) setSaveStatus("synced");
    }, [id, userId]);

    const triggerAutoSave = useCallback((newData) => {
        setSaveStatus("syncing");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => performSync(newData), 30000);
    }, [performSync]);

    useEffect(() => {
        // FIX: Also check if id is the string "undefined"
        if (!id || id === "undefined" || !userId) {
            console.log("useEffect blocked: id or userId is missing/undefined", { id, userId });
            return;
        }

        let cancelled = false;

        async function fetchResumeData() {
            try {
                console.log("Fetching data for ID:", id); // Log the ID being sent
                const res = await getWorkspaceData(id, userId);

                if (cancelled) return;

                if (res.success) {
                    // LOG THE FILEURL HERE
                    console.log("✅ Resume Data Received. fileUrl:", res.data.fileUrl);

                    setResume(res.data);
                    if (res.data.formData) {
                        setFormData(prev => ({ ...prev, ...res.data.formData }));
                    }
                } else {
                    console.error("❌ Fetch failed:", res.error);
                }
            } catch (err) {
                console.error("❌ Request Error:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchResumeData();
        return () => {
            cancelled = true;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [id, userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };
        setFormData(updatedData);
        triggerAutoSave(updatedData);
    };

    const handleManualSync = async () => {
        setIsActionLoading(true);
        await performSync(formData);
        setIsActionLoading(false);
    };

    const { updateUser } = useUserStore();

    const handleSubmit = async () => {
        const confirmSubmit = window.confirm("Ready for final submission?");
        if (!confirmSubmit) return;
        setIsActionLoading(true);
        const res = await submitResume(id, userId, formData);
        if (res.success) {
            if (res.newData) updateUser(res.newData);
            router.push("/user/submitted");
        } else {
            alert("Error: " + (res.error || "Submission failed"));
        }
        setIsActionLoading(false);
    };

    const isFormComplete = () => {
        // This looks at every field in your formData object
        // .values() gets the data, .every() checks if all are true (not empty)
        return Object.values(formData).every(value => {
            if (typeof value === 'string') return value.trim() !== "";
            return value !== null && value !== undefined;
        });
    };

    const handleSave = async () => {
        const confirmSave = window.confirm("Ready for final Save?");
        if (!confirmSave) return;
        if (!isFormComplete()) {
            alert("⚠️ Cannot Save: Please fill all fields before saving the resume.");
            return;
        }
        setIsActionLoading(true);
        const res = await holdAndSaveResume(id, userId, formData);
        if (res.success) {
            if (res.newData) updateUser(res.newData);
            router.push("/user/reassigned");
        } else {
            alert("Error: " + (res.error || "Save failed"));
        }
        setIsActionLoading(false);
    }


    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Forging Workspace...</p>
        </div>
    );

    return (
        /*
         * KEY FIX:
         * - Root = h-screen, flex-col, overflow-hidden  →  nothing escapes the viewport
         * - Header = flex-shrink-0                       →  never squished
         * - <main> = flex-1 overflow-hidden              →  fills remaining height, clips children
         * - Each pane = h-full overflow-y-auto           →  owns its OWN scrollbar, nothing leaks
         * - Removed any padding/margin that could add phantom height to the outer shell
         */
        <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className="flex-shrink-0 h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-white/80 backdrop-blur-xl z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link
                        href="/user/allresumesavailable"
                        className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                    >
                        <ArrowLeft size={18} />
                    </Link>

                    <div className="w-px h-6 bg-slate-100" />

                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-xs font-black uppercase text-slate-900 tracking-tight flex items-center gap-1.5">
                            <FileText size={14} className="text-blue-600" />
                            {resume?.originalName}
                        </h2>
                        {saveStatus === "syncing" ? (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-500 tracking-widest">
                                <Loader2 size={10} className="animate-spin" /> Syncing…
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 tracking-widest">
                                <CheckCircle size={10} /> Synced
                            </span>
                        )}
                    </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleManualSync}
                        disabled={isActionLoading || saveStatus === "synced"}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Force Sync
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isActionLoading}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 disabled:opacity-50 transition-all shadow-md"
                    >
                        {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Submit
                    </button>
                </div>
            </header>

            {/* ── Main split ─────────────────────────────────────────────────── */}
            {/*
             * flex-1          → takes all height left after header
             * overflow-hidden → clips both children; each child must scroll itself
             * min-h-0         → flex child shrink fix (some browsers need this)
             */}
            <main className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── LEFT: PDF viewer ──────────────────────────────────────── */}
                {/*
                 * h-full          → fills the main row height exactly
                 * overflow-y-auto → its OWN scrollbar (if iframe needs it)
                 * The iframe itself is set to 100% width/height of its container
                 * so it grows to fill without creating a double scroll.
                 */}
                <section className="w-1/2 h-full overflow-hidden bg-slate-50 border-r border-slate-200 flex flex-col">
                    {/* thin title bar */}
                    <div className="flex-shrink-0 px-5 py-2.5 border-b border-slate-200 bg-white flex items-center gap-2">
                        <FileText size={12} className="text-slate-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Resume Preview</span>
                    </div>

                    {/* iframe fills the rest — NO outer scroll, iframe handles its own */}
                    <div className="flex-1 min-h-0 p-4">
                        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
                            <iframe
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(resume?.fileUrl)}&embedded=true`}
                                className="w-full h-full block"
                                title="Resume Preview"
                            />
                        </div>
                    </div>
                </section>

                {/* ── RIGHT: Form ───────────────────────────────────────────── */}
                {/*
                 * h-full          → fills the main row height exactly
                 * overflow-y-auto → its OWN independent scrollbar
                 * No outer wrapper has overflow that could create a second bar
                 */}
                <section className="w-1/2 h-full overflow-y-auto bg-white">
                    <div className="max-w-2xl mx-auto py-12 px-10 space-y-14">

                        {/* Section header */}
                        <header className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg">
                                <Database size={11} />
                                <span className="text-[9px] font-black uppercase tracking-widest">GrowthForge DTS</span>
                            </div>
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                                Data <span className="text-blue-600">Extraction</span>
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">
                                Fill in details extracted from the resume on the left.
                            </p>
                        </header>

                        {/* ── Personal Details ── */}
                        <FormSection icon={<User size={14} />} title="Personal Details">
                            <Row>
                                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                                <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                            </Row>
                            <Row>
                                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                                <Input label="Date of Birth" name="dob" value={formData.dob} onChange={handleChange} type="date" />
                            </Row>
                            <Row>
                                <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
                                <Input label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                            </Row>
                            <Row>
                                <Select label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={["Single", "Married", "Divorced", "Widowed"]} />
                                <Input label="Passport No." name="passport" value={formData.passport} onChange={handleChange} />
                            </Row>
                            <Input label="Hobbies" name="hobbies" value={formData.hobbies} onChange={handleChange} />
                            <Input label="Languages Known" name="languages" value={formData.languages} onChange={handleChange} />
                        </FormSection>

                        {/* ── Communication Details ── */}
                        <FormSection icon={<MapPin size={14} />} title="Communication Details">
                            <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
                            <Input label="Landmark" name="landmark" value={formData.landmark} onChange={handleChange} />
                            <Row>
                                <Input label="City" name="city" value={formData.city} onChange={handleChange} />
                                <Input label="State" name="state" value={formData.state} onChange={handleChange} />
                            </Row>
                            <Row>
                                <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
                                <Input label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} type="tel" />
                            </Row>
                            <Input label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
                        </FormSection>

                        {/* ── Qualification Details ── */}
                        <FormSection icon={<GraduationCap size={14} />} title="Qualification Details">
                            <Row cols={3}>
                                <Input label="SSC Result" name="sscResult" value={formData.sscResult} onChange={handleChange} />
                                <Input label="SSC Board" name="sscBoard" value={formData.sscBoard} onChange={handleChange} />
                                <Input label="SSC Pass Year" name="sscYear" value={formData.sscYear} onChange={handleChange} />
                            </Row>
                            <Row cols={3}>
                                <Input label="HSC Result" name="hscResult" value={formData.hscResult} onChange={handleChange} />
                                <Input label="HSC Board" name="hscBoard" value={formData.hscBoard} onChange={handleChange} />
                                <Input label="HSC Pass Year" name="hscYear" value={formData.hscYear} onChange={handleChange} />
                            </Row>
                            <Row>
                                <Input label="Graduation Degree" name="gradDegree" value={formData.gradDegree} onChange={handleChange} />
                                <Input label="Graduation Result" name="gradResult" value={formData.gradResult} onChange={handleChange} />
                            </Row>
                            <Row>
                                <Input label="Graduation University" name="gradUniversity" value={formData.gradUniversity} onChange={handleChange} />
                                <Input label="Graduation Year" name="gradYear" value={formData.gradYear} onChange={handleChange} />
                            </Row>
                            <Row cols={3}>
                                <Input label="PG Degree" name="pgDegree" value={formData.pgDegree} onChange={handleChange} />
                                <Input label="PG Result" name="pgResult" value={formData.pgResult} onChange={handleChange} />
                                <Input label="PG Year" name="pgYear" value={formData.pgYear} onChange={handleChange} />
                            </Row>
                            <Input label="Higher Level Education" name="higherEducation" value={formData.higherEducation} onChange={handleChange} />
                        </FormSection>

                        {/* ── Employment Details ── */}
                        <FormSection icon={<Briefcase size={14} />} title="Employment Details">
                            <Row>
                                <Input label="Experience (Months)" name="expMonths" value={formData.expMonths} onChange={handleChange} />
                                <Input label="Experience (Years)" name="expYears" value={formData.expYears} onChange={handleChange} />
                            </Row>
                            <Row>
                                <Input label="Total Experience (Months)" name="totalMonths" value={formData.totalMonths} onChange={handleChange} />
                                <Input label="No. of Companies" name="noOfCompanies" value={formData.noOfCompanies} onChange={handleChange} />
                            </Row>
                            <Input label="Last Employer" name="lastEmployer" value={formData.lastEmployer} onChange={handleChange} />
                        </FormSection>

                        {/* ── Submit footer ── */}
                        <div className="pb-8 flex flex-col gap-8">
                            <button
                                onClick={handleSubmit}
                                disabled={isActionLoading}
                                className="w-full bg-blue-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {isActionLoading
                                    ? <Loader2 size={18} className="animate-spin" />
                                    : <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                }
                                Submit Final Extraction
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isActionLoading}
                                className="w-full bg-blue-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {isActionLoading
                                    ? <Loader2 size={18} className="animate-spin" />
                                    : <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                }
                                Save final
                            </button>


                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function FormSection({ icon, title, children }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    {icon}
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">{title}</h4>
            </div>
            <div className="space-y-5">{children}</div>
        </div>
    );
}

/** Responsive grid row — cols defaults to 2 */
function Row({ cols = 2, children }) {
    const colClass = cols === 3 ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 gap-4";
    return <div className={colClass}>{children}</div>;
}

function Input({ label, name, value, onChange, type = "text" }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-0.5">
                {label}
            </label>
            <input
                type={type}
                name={name}
                value={value || ""}
                onChange={onChange}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
            />
        </div>
    );
}

function Select({ label, name, value, onChange, options }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-0.5">
                {label}
            </label>
            <select
                name={name}
                value={value || ""}
                onChange={onChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
            >
                <option value="">Select {label}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}

export default dynamic(() => Promise.resolve(WorkspaceContent), { ssr: false });