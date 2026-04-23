"use client";

import { useState, useEffect } from "react";
import { passero, robotoSlab } from "@/lib/fonts";
import { ShieldCheck, FileText, Scale, AlertTriangle, Gavel, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen bg-gray-200 p-6 lg:p-12 ${robotoSlab.className} text-black selection:bg-black selection:text-white`}>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
              <Scale className="text-white" size={24} />
            </div>
            <div>
              <h1 className={`${passero.className} text-3xl uppercase italic leading-none`}>Terms & Conditions</h1>
              <p className="text-[10px] opacity-40 font-bold tracking-[0.3em] mt-1">Legal Framework / DataSort</p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Effective Date</p>
            <p className="text-sm font-black italic">April 2026</p>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* Introduction & IP */}
          <section className="bg-white rounded-[3rem] p-10 md:p-16 shadow-sm space-y-12">
            
            <div className="space-y-6">
              <SectionHeader title="1. Introduction" icon={<FileText size={18}/>} />
              <p className="text-sm leading-relaxed opacity-70">
                These Website Standard Terms And Conditions contained herein on this webpage, shall govern your use of this website, including all pages within this website (collectively referred to herein below as this “Website”). These Terms apply in full force and effect to your use of this Website and by using this Website, you expressly accept all terms and conditions contained herein in full. 
              </p>
              <div className="p-4 bg-gray-50 border-l-4 border-black rounded-r-xl">
                <p className="text-xs font-bold italic">
                  This Website is not for use by any minors (defined as those who are not at least 18 years of age), and you must not use this Website if you are a minor.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <SectionHeader title="2. Intellectual Property Rights" icon={<ShieldCheck size={18}/>} />
              <p className="text-sm leading-relaxed opacity-70">
                Other than content you own, under these Terms, <span className="font-bold">Searchline Database Private Limited (Herein referred to as DataSort)</span> and/or its licensors own all rights to the intellectual property and material contained in this Website. You are granted a limited license only, subject to the restrictions provided in these Terms.
              </p>
            </div>

            <div className="space-y-6">
              <SectionHeader title="3. Restrictions" icon={<AlertTriangle size={18}/>} />
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wide opacity-60">
                <li className="flex items-center gap-3">○ Publishing Website material in any media</li>
                <li className="flex items-center gap-3">○ Selling or commercializing any material</li>
                <li className="flex items-center gap-3">○ Data mining or harvesting activities</li>
                <li className="flex items-center gap-3">○ Using website in any damaging way</li>
                <li className="flex items-center gap-3">○ Using website contrary to applicable laws</li>
                <li className="flex items-center gap-3">○ Using website for unauthorized marketing</li>
              </ul>
            </div>

            {/* Premium Payout Table Section */}
            <div className="space-y-8 pt-10 border-t border-gray-100">
              <SectionHeader title="4. General Terms for Payouts" icon={<CheckCircle2 size={18}/>} />
              <div className="bg-black text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <h4 className={`${passero.className} text-2xl mb-8 text-center tracking-widest`}>Work Quality & ROI Scale</h4>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.3em] opacity-40">
                         <th className="pb-4">Quality Tier</th>
                         <th className="pb-4">Accuracy</th>
                         <th className="pb-4 text-right">Rate / Resume</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm">
                        <TierRow label="Master" range="91% - 100%" rate="INR 70/-" />
                        <TierRow label="Proficient" range="80% - 90%" rate="INR 50-60/-" />
                        <TierRow label="Meets Expectation" range="70% - 80%" rate="INR 30-40/-" />
                        <TierRow label="Progressing" range="60% - 70%" rate="INR 15-20/-" />
                        <TierRow label="Emerging" range="50% - 60%" rate="INR 5-10/-" />
                        <TierRow label="Learning" range="Below 50%" rate="INR 2/-" isRed />
                     </tbody>
                   </table>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-bold uppercase opacity-40 mb-2">Withdrawal Limit</p>
                      <p className={`${passero.className} text-xl tracking-wider`}>Min. ₹1,000</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-bold uppercase opacity-40 mb-2">Target Volume</p>
                      <p className={`${passero.className} text-xl tracking-wider`}>300 - 700 Resumes</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <SectionHeader title="5. Limitation of Liability" icon={<Scale size={18}/>} />
              <p className="text-sm leading-relaxed opacity-70 italic">
                In no event shall DataSort, nor any of its officers, directors and employees, be liable to you for anything arising out of or in any way connected with your use of this Website. This Website is provided 'as is,' with all faults.
              </p>
            </div>

            <div className="space-y-6">
              <SectionHeader title="6. Governing Law & Jurisdiction" icon={<Gavel size={18}/>} />
              <p className="text-sm leading-relaxed opacity-70">
                These Terms will be governed by and construed in accordance with the laws of the <span className="font-bold underline decoration-2">State of Gujarat, India</span> and you submit to the non-exclusive jurisdiction of the state and courts located in Gujarat, India for the resolution of any disputes.
              </p>
            </div>

          </section>

          {/* Footer Clause */}
          <footer className="text-center pb-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] opacity-30">
              © 2026 DataSort / Searchline Database Private Limited
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SectionHeader({ title, icon }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-black/20">{icon}</span>
      <h2 className={`${passero.className} text-2xl uppercase tracking-wider`}>{title}</h2>
    </div>
  );
}

function TierRow({ label, range, rate, isRed }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
      <td className="py-4 font-bold text-xs uppercase tracking-widest">{label}</td>
      <td className="py-4 opacity-60 text-xs tabular-nums">{range}</td>
      <td className={`py-4 text-right ${passero.className} text-xl ${isRed ? 'text-red-400' : 'text-white'}`}>{rate}</td>
    </tr>
  );
}