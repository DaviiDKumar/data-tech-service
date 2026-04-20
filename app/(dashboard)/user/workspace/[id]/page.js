"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { saveResumeProgress, submitResume } from "@/app/actions/userWork";
import { useUserStore } from "@/store/useUserStore";
import {
    ArrowLeft, CloudSync, CheckCircle,
    Loader2, Send, Save, FileText, Database,
    User, GraduationCap, Briefcase, MapPin
} from "lucide-react";
import Link from "next/link";
import { getWorkspaceData, } from "@/app/actions/userWork";




function WorkspaceContent() {
    const { id } = useParams();
    const router = useRouter();
    const userId = useUserStore((state) => state.user?.id);

    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(true); // Initial state remains true
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

    // Sync logic
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

    // FIXED: Data fetching with automatic form population
    useEffect(() => {
        if (!id || !userId) return;  // userId bhi add karo
        let cancelled = false;

        async function fetchResumeData() {
            try {
                const res = await getWorkspaceData(id, userId);  // yeh badla
                if (cancelled) return;
                if (res.success) {
                    setResume(res.data);
                    if (res.data.formData) {
                        setFormData(prev => ({ ...prev, ...res.data.formData }));
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchResumeData();

        return () => {
            cancelled = true;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [id, userId]);  // userId dependency add karo
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


    const { updateUser } = useUserStore(); // Store se function nikalo

    const handleSubmit = async () => {
        const confirmSubmit = window.confirm("Ready for final submission?");
        if (!confirmSubmit) return;

        setIsActionLoading(true);

        // 1. Action call karo
        const res = await submitResume(id, userId, formData);

        if (res.success) {
            // ⚡ INSTANT UPDATE: Store ko server se aaye naye data se update karo
            // Isse dashboard par 0 API call hogi, data pehle se updated hoga
            if (res.newData) {
                updateUser(res.newData);
            }

            // 2. Redirect
            router.push("/user/submitted");
        } else {
            alert("Error: " + (res.error || "Submission failed"));
        }

        setIsActionLoading(false);
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Forging Workspace...</p>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
            {/* Header */}
            <header className="h-20 border-b border-slate-100 px-8 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xl z-50">
                <div className="flex items-center gap-6">
                    <Link href="/user/allresumesavailable" className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400 hover:text-slate-900">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                            <FileText size={16} className="text-blue-600" /> {resume?.originalName}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            {saveStatus === "syncing" ? (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-orange-500 tracking-widest">
                                    <CloudSync size={12} className="animate-spin" /> Syncing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 tracking-widest">
                                    <CheckCircle size={12} /> Progress Synced
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleManualSync}
                    disabled={isActionLoading || saveStatus === "synced"}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-lg"
                >
                    {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Force Sync
                </button>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* PDF (LEFT) */}
                <section className="w-1/2 bg-slate-50 overflow-y-auto p-6 border-r border-slate-200 shadow-inner">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
                        <iframe
                            src={`${resume?.fileUrl}#toolbar=0`}
                            className="w-full h-[180vh]"
                            title="Resume Preview"
                        />
                    </div>
                </section>

                {/* FORM (RIGHT) */}
                {/* FORM (RIGHT) */}
                <section className="w-1/2 bg-white overflow-y-auto custom-scrollbar">
                    <div className="max-w-2xl mx-auto py-16 px-12 space-y-16 pb-40">
                        <header className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg">
                                <Database size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">GrowthForge DTS</span>
                            </div>
                            <h3 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                                Data <span className="text-blue-600 text-outline">Extraction</span>
                            </h3>
                        </header>

                        {/* Personal Details */}
                        <FormSection icon={<User size={16} />} title="Personal Details">
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                                <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                                <Input label="Date Of Birth" name="dob" value={formData.dob} onChange={handleChange} type="date" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange}
                                    options={["Male", "Female", "Other"]} />
                                <Input label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Select label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}
                                    options={["Single", "Married", "Divorced", "Widowed"]} />
                                <Input label="Passport" name="passport" value={formData.passport} onChange={handleChange} />
                            </div>
                            <Input label="Hobbies" name="hobbies" value={formData.hobbies} onChange={handleChange} />
                            <Input label="Language Known" name="languages" value={formData.languages} onChange={handleChange} />
                        </FormSection>

                        {/* Communication Details */}
                        <FormSection icon={<MapPin size={16} />} title="Communication Details">
                            <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
                            <Input label="Landmark" name="landmark" value={formData.landmark} onChange={handleChange} />
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="City" name="city" value={formData.city} onChange={handleChange} />
                                <Input label="State" name="state" value={formData.state} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
                                <Input label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} type="tel" />
                            </div>
                            <Input label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
                        </FormSection>

                        {/* Qualification Details */}
                        <FormSection icon={<GraduationCap size={16} />} title="Qualification Details">
                            <div className="grid grid-cols-3 gap-6">
                                <Input label="SSC Result" name="sscResult" value={formData.sscResult} onChange={handleChange} />
                                <Input label="SSC Board" name="sscBoard" value={formData.sscBoard} onChange={handleChange} />
                                <Input label="SSC Pass Year" name="sscYear" value={formData.sscYear} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <Input label="HSC Result" name="hscResult" value={formData.hscResult} onChange={handleChange} />
                                <Input label="HSC Board" name="hscBoard" value={formData.hscBoard} onChange={handleChange} />
                                <Input label="HSC Pass Year" name="hscYear" value={formData.hscYear} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Graduation Degree" name="gradDegree" value={formData.gradDegree} onChange={handleChange} />
                                <Input label="Graduation Result" name="gradResult" value={formData.gradResult} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Graduation University" name="gradUniversity" value={formData.gradUniversity} onChange={handleChange} />
                                <Input label="Graduation Year" name="gradYear" value={formData.gradYear} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <Input label="PG Degree" name="pgDegree" value={formData.pgDegree} onChange={handleChange} />
                                <Input label="PG Result" name="pgResult" value={formData.pgResult} onChange={handleChange} />
                                <Input label="PG Year" name="pgYear" value={formData.pgYear} onChange={handleChange} />
                            </div>
                            <Input label="Higher Level Education" name="higherEducation" value={formData.higherEducation} onChange={handleChange} />
                        </FormSection>

                        {/* Employment Details */}
                        <FormSection icon={<Briefcase size={16} />} title="Employment Details">
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Experience (Months)" name="expMonths" value={formData.expMonths} onChange={handleChange} />
                                <Input label="Experience (Years)" name="expYears" value={formData.expYears} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Total Work Experience (in Months)" name="totalMonths" value={formData.totalMonths} onChange={handleChange} />
                                <Input label="No Of Companies" name="noOfCompanies" value={formData.noOfCompanies} onChange={handleChange} />
                            </div>
                            <Input label="Last Employer" name="lastEmployer" value={formData.lastEmployer} onChange={handleChange} />
                        </FormSection>

                        <footer className="pt-10">
                            <button
                                onClick={handleSubmit}
                                disabled={isActionLoading}
                                className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all duration-500 flex items-center justify-center gap-4 group"
                            >
                                {isActionLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                Submit Final Extraction
                            </button>
                        </footer>
                    </div>
                </section>


            </main>
        </div>
    );
}

// Sub-components
function FormSection({ icon, title, children }) {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                    {icon}
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 italic">{title}</h4>
            </div>
            <div className="space-y-6">{children}</div>
        </div>
    );
}

function Input({ label, name, value, onChange, type = "text" }) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
            <input
                type={type}
                name={name}
                value={value || ""}
                onChange={onChange}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                placeholder={`Enter ${label.toLowerCase()}`}
            />
        </div>
    );
}

function Select({ label, name, value, onChange, options }) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
            <select
                name={name}
                value={value || ""}
                onChange={onChange}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm appearance-none"
            >
                <option value="">Select {label}</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}

export default dynamic(() => Promise.resolve(WorkspaceContent), { ssr: false });