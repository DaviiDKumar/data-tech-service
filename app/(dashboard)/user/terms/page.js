"use client";

import { useState, useEffect } from "react";
import { passero, robotoSlab } from "@/lib/fonts";
import { 
  ShieldCheck, FileText, Scale, AlertTriangle, 
  Gavel, CheckCircle2, Info, UserX, Lock, ScrollText,
  BadgeCheck, HardDriveDownload, Ban
} from "lucide-react";

export default function TermsPage() {
  

  return (
    <div className={`min-h-screen bg-[#F4F4F9] p-6 lg:p-12 ${robotoSlab.className} text-black selection:bg-violet-600 selection:text-white`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-4xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-200">
              <Scale className="text-white" size={32} />
            </div>
            <div>
              <p className="text-[10px] text-violet-600 font-black tracking-[0.4em] uppercase mb-1">Dashboard / Compliance</p>
              <h1 className={`${passero.className} text-4xl uppercase italic leading-none`}>Terms & Conditions</h1>
            </div>
          </div>
          <div className="text-right hidden md:block border-l-2 border-slate-100 pl-8">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Governing Law</p>
            <p className="text-sm font-black text-black">Gujarat, India</p>
          </div>
        </header>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: PRIMARY CLAUSES (Verbatim Text) */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white rounded-[3.5rem] p-8 md:p-16 shadow-sm border border-slate-100 space-y-16">
              
              <TermSection title="Introduction" icon={<Info size={20}/>}>
                <p>These Website Standard Terms And Conditions (these “Terms” or these “Website Standard Terms And Conditions”) contained herein on this webpage, shall govern your use of this website, including all pages within this website (collectively referred to herein below as this “Website”). These Terms apply in full force and effect to your use of this Website and by using this Website, you expressly accept all terms and conditions contained herein in full. You must not use this Website, if you have any objection to any of these Website Standard Terms And Conditions.</p>
                <div className="p-6 bg-rose-50 border-l-4 border-rose-500 rounded-r-3xl mt-6">
                  <p className="text-xs font-black text-rose-700 uppercase tracking-tight">
                    This Website is not for use by any minors (defined as those who are not at least 18 years of age), and you must not use this Website if you a minor.
                  </p>
                </div>
              </TermSection>

              <TermSection title="Intellectual Property Rights" icon={<ShieldCheck size={20}/>}>
                <p>Other than content you own, which you may have opted to include on this Website, under these Terms, <span className="text-violet-600 font-bold font-black uppercase">Searchline Database Private Limited (Herein referred to as DataSort)</span> and/or its licensors own all rights to the intellectual property and material contained in this Website, and all such rights are reserved. You are granted a limited license only, subject to the restrictions provided in these Terms, for purposes of viewing the material contained on this Website.</p>
              </TermSection>

              <TermSection title="Restrictions" icon={<Ban size={20}/>}>
                <p className="mb-6 font-bold text-slate-400 uppercase text-[10px] tracking-widest">You are expressly and emphatically restricted from all of the following:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-600 italic">
                  <p>• Publishing any Website material in any media;</p>
                  <p>• Selling, sublicensing and/or otherwise commercializing any Website material;</p>
                  <p>• Publicly performing and/or showing any Website material;</p>
                  <p>• Using this Website in any way that is, or may be, damaging to this Website;</p>
                  <p>• Using this Website in any way that impacts user access to this Website;</p>
                  <p>• Using this Website contrary to applicable laws and regulations;</p>
                  <p>• Engaging in any data mining, harvesting, or extracting;</p>
                  <p>• Using this Website to engage in any advertising or marketing;</p>
                </div>
                <p className="mt-8 text-xs leading-relaxed opacity-60 bg-slate-50 p-4 rounded-2xl">Certain areas of this Website are restricted from access by you and Connecting all India may further restrict access by you to any areas of this Website, at any time, in its sole and absolute discretion. Any user ID and password you may have for this Website are confidential and you must maintain confidentiality of such information.</p>
              </TermSection>

              <TermSection title="Your Content" icon={<ScrollText size={20}/>}>
                <p>In these Website Standard Terms And Conditions, “Your Content” shall mean any audio, video, text, images or other material you choose to display on this Website. With respect to Your Content, by displaying it, you grant DataSort a non-exclusive, worldwide, irrevocable, royalty-free, sublicensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.</p>
                <p className="mt-4 font-bold text-violet-600">Your Content must be your own and must not be infringing on any third party’s rights. DataSort reserves the right to remove any of Your Content from this Website at any time, and for any reason, without notice. Also your basic details that you provide like your name, number and your email address can be shared with others associated with DataSort and those people/companies can may approach you for anything related and regarding to this Resume-data-filling project.</p>
              </TermSection>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <TermSection title="No Warranties" icon={<AlertTriangle size={20}/>}>
                  <p className="text-xs italic">This Website is provided 'as is,' with all faults, and DataSort makes no express or implied representations or warranties, of any kind related to this Website. Additionally, nothing contained on this Website shall be construed as providing consult or advice to you.</p>
                </TermSection>
                <TermSection title="Liability" icon={<Gavel size={20}/>}>
                  <p className="text-xs italic">In no event shall DataSort, nor any of its officers, directors and employees, be liable to you for anything arising out of or in any way connected with your use of this Website.</p>
                </TermSection>
              </div>

              <TermSection title="General Terms for Using the Portal" icon={<BadgeCheck size={20}/>}>
                <div className="space-y-6 text-sm font-medium text-slate-700">
                  <p className="flex gap-3"><span className="text-violet-600 font-bold">01.</span> All the work processed by a user will be subject to Quality check by DataSort.</p>
                  <p className="flex gap-3"><span className="text-violet-600 font-bold">02.</span> The quality check will be done by the internal Quality check (QC) department of DataSort. Payout will be processed only after QC department approves the work.</p>
                  <p className="flex gap-3"><span className="text-violet-600 font-bold">03.</span> DataSort will not compensate any user for any kind of delay caused due to events such as web server issues, website maintenance and any such other similar events.</p>
                  <p className="flex gap-3 font-bold text-black border-l-2 border-violet-600 pl-4 bg-violet-50/50 py-2">04. Payout will be processed only if the user completes minimum 300 (Maximum 700) resumes in 7 days and achieves 50% accuracy.</p>
                  <p className="flex gap-3"><span className="text-violet-600 font-bold">05.</span> User agrees not to use the data given on the portal for any other purpose other than copy-pasting in the given fields.</p>
                </div>
              </TermSection>
            </section>
          </div>

          {/* RIGHT: THE PAYOUT TABLE & FEES (Verbatim Table) */}
          <div className="lg:col-span-4 space-y-8">
            
            <div className="bg-black text-white rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-violet-200 sticky top-12">
              <h4 className={`${passero.className} text-2xl mb-8 tracking-widest text-violet-400 italic`}>Payout Matrix</h4>
              
              <div className="space-y-1">
                <TableRow tier="Master" acc="91% to 100%" rate="70" />
                <TableRow tier="Proficient" acc="85% to 90%" rate="60" />
                <TableRow tier="Proficient" acc="80% to 85%" rate="50" />
                <TableRow tier="Meets Expectation" acc="75% to 80%" rate="40" />
                <TableRow tier="Meets Expectation" acc="70% to 75%" rate="30" />
                <TableRow tier="Progressing" acc="65% to 70%" rate="20" />
                <TableRow tier="Progressing" acc="60% to 65%" rate="15" />
                <TableRow tier="Emerging" acc="55% to 60%" rate="10" />
                <TableRow tier="Emerging" acc="50% to 55%" rate="5" />
                <TableRow tier="Learning" acc="Below 50%" rate="2" isRed />
              </div>

              <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Min Withdrawal</p>
                   <p className={`${passero.className} text-xl text-violet-400`}>₹1000</p>
                </div>
                <div className="h-[1px] bg-white/10 w-full" />
                <p className="text-[9px] font-bold italic opacity-40 leading-relaxed text-center">
                  Payout will be made only for accurate resumes. Even if accuracy is below 50%, DataSort will pay minimum INR 2/- per accurate resume.
                </p>
              </div>

              {/* Extension Costs */}
              <div className="mt-8 space-y-4">
                 <h5 className={`${passero.className} text-sm uppercase text-violet-400`}>Rework Extensions</h5>
                 <div className="grid grid-cols-2 gap-3 text-center">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] uppercase opacity-40 mb-1">2 Days</p>
                      <p className="font-black text-sm text-white italic">₹2500/-</p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] uppercase opacity-40 mb-1">5 Days</p>
                      <p className="font-black text-sm text-white italic">₹3000/-</p>
                   </div>
                 </div>
              </div>
            </div>

            <div className="bg-violet-600 text-white rounded-[2.5rem] p-8 shadow-xl">
               <h3 className={`${passero.className} text-xl mb-4 uppercase`}>Governing Law</h3>
               <p className="text-xs leading-relaxed font-medium">
                 These Terms will be governed by and construed in accordance with the laws of the <span className="font-black underline decoration-white decoration-2 underline-offset-4">State of Gujarat, India</span> and you submit to the non-exclusive jurisdiction located in Gujarat.
               </p>
            </div>

          </div>
        </div>

        <footer className="text-center py-20">
           <p className="text-[10px] font-black uppercase tracking-[0.6em] opacity-20">
             DataSort / Searchline Database Private Limited / Gujarat Jurisdiction
           </p>
        </footer>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function TermSection({ title, icon, children }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-violet-600 border border-slate-100 shadow-sm">
          {icon}
        </div>
        <h2 className={`${passero.className} text-2xl uppercase tracking-widest text-black`}>{title}</h2>
      </div>
      <div className="text-sm leading-relaxed text-slate-600 font-medium ml-1">
        {children}
      </div>
    </div>
  );
}

function TableRow({ tier, acc, rate, isRed }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 group hover:bg-white/5 px-3 rounded-xl transition-all">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-white/90">{tier}</p>
        <p className="text-[8px] text-white/30 font-bold uppercase">{acc}</p>
      </div>
      <div className="text-right">
        <p className={`${passero.className} text-xl ${isRed ? 'text-rose-500' : 'text-violet-400'}`}>₹{rate}</p>
      </div>
    </div>
  );
}