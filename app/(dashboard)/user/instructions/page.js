"use client";

import { useState, useEffect } from "react";
import { passero, robotoSlab } from "@/lib/fonts";
import { 
  FileText, User, MapPin, GraduationCap, 
  Briefcase, MessageSquare, Info, ShieldCheck 
} from "lucide-react";

export default function InstructionsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen bg-gray-200 p-6 lg:p-10 ${robotoSlab.className} text-black`}>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <h1 className={`${passero.className} text-3xl uppercase italic leading-none`}>View Instructions</h1>
              <p className="text-[10px] opacity-40 font-bold tracking-[0.3em] mt-1">Data Entry Protocol / Dashboard</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-gray-100 px-5 py-2 rounded-2xl border border-gray-200">
            <ShieldCheck size={16} className="text-black/20" />
            <p className="text-[10px] font-black uppercase tracking-widest">Accuracy Node v1.0</p>
          </div>
        </header>

        {/* --- INSTRUCTIONS GRID --- */}
        <div className="grid grid-cols-1 gap-6 pb-20">
          
          {/* PERSONAL INFORMATION SECTION */}
          <InstructionSection title="Personal Information" icon={<User size={20}/>}>
            <Rule label="First Name" text="If the resume contains name in Capital and Small Case both, write any one of them; else write same as given." />
            <Rule label="Middle Name" text="Write Middle Name from Full Name in the resume. If Full Name contains initial write initial of the name; but if there is Father’s Name in the resume, write Father’s First Name in Middle Name." />
            <Rule label="Last Name" text="If the resume contains name in Capital and Small Case both, write any one of them; else write same as given." />
            <Rule label="Date of Birth" text="Date of Birth should be written in the format DD-MM-YYYY (31-01-1991) or DD/MM/YYYY (31/01/1991)." />
            <Rule label="Gender" text="Write as per the name; you can write NA if no gender info is given in the resume." />
            <Rule label="Nationality" text="Write NA if no Nationality info is given in the resume." />
            <Rule label="Marital Status" text="Write as per the info given in resume. If Marriage Date is given write Married." />
            <Rule label="Passport" text="Write Passport Number only." />
          </InstructionSection>

          {/* PREFERENCES SECTION */}
          <InstructionSection title="Preferences & Skills" icon={<MessageSquare size={20}/>}>
            <Rule label="Hobbies" text="Write Hobbies in one line separating each hobby with comma (,) and space ( ) if the hobbies are written in points or multiple lines or write same as given." />
            <Rule label="Languages Known" text="Write Languages Known in one line separating each Languages Known with comma (,) and space ( ) if the Languages Known are written in points or multiple lines or write same as given." />
          </InstructionSection>

          {/* CONTACT & LOCATION SECTION */}
          <InstructionSection title="Contact & Location" icon={<MapPin size={20}/>}>
            <Rule label="Address" text="Address will not contain Post Office, Taluka, Tehsil, City, State, Pin code & Country. If multiple addresses are given, Permanent Address should be mentioned." />
            <Rule label="Landmark" text="Write NA if no Landmark info is given in the resume." />
            <Rule label="City" text="Write City from the address mentioned in the resume. If multiple addresses are given, City Name from Permanent Address should be mentioned." />
            <Rule label="State" text="Write State from the address mentioned in the resume. If multiple addresses are given, State Name from Permanent Address should be mentioned." />
            <Rule label="Pin Code" text="Write Pin Code from the address mentioned in the resume. If multiple addresses are given, Pin Code from Permanent Address should be mentioned." />
            <Rule label="Mobile" text="Write only 10 Digit Mobile Number. If multiple mobile numbers are given write each Mobile Numbers separated with comma (,) and space ( )." />
            <Rule label="E-Mail ID" text="Write E-Mail ID as given in the resume. If multiple E-Mail IDs are given write each E-Mail ID separated with comma (,) and space ( )." />
          </InstructionSection>

          {/* EDUCATION SECTION */}
          <InstructionSection title="Academic Records" icon={<GraduationCap size={20}/>}>
            <Rule label="SSC Result" text="Write Result as per below preference: Percentage, Grade, Division / Class. If mentioned Passed then write PASS" />
            <Rule label="SSC Board/University" text="Write the Board/University Name. No School/College Name should be written." />
            <Rule label="SSC Passing Year" text="Write Passing Year only without mentioning the Month or Date." />
            <hr className="border-black/5" />
            <Rule label="HSC Details" text="Write Result as per below preference: Percentage, Grade, Division / Class. If mentioned Passed then write PASS. Write Diploma details in HSC. If the resume contains both HSC and Diploma details then write both results/boards/years separated with comma (,) and space ( )." />
            <hr className="border-black/5" />
            <Rule label="Graduation Details" text="Write Degree Name as per the Resume. If candidate is still pursing the degree write same as given in resume. If the resume contains multiple graduation details then write all Degree, Results, and University separated with comma (,) and space ( ). No College Name should be written." />
            <hr className="border-black/5" />
            <Rule label="Post-Graduation" text="Write Degree Name as per the Resume. If the resume contains multiple post-graduation details then write all Degree, Results, and University separated with comma (,) and space ( ). Write Passing Year only without mentioning the Month or Date." />
            <Rule label="Highest Level" text="Write Highest Level of Education of the candidate." />
          </InstructionSection>

          {/* WORK EXPERIENCE SECTION */}
          <InstructionSection title="Professional Experience" icon={<Briefcase size={20}/>}>
            <Rule label="Total Work Experience" text="Calculate the Total Work Experience from the resume. Write in Months or Years. Do not calculate training in the Work Experience. Write 0 for Freshers." />
            <Rule label="Total Companies Worked for" text="Write number of companies, the candidate has worked for. Write 0 for Freshers." />
            <Rule label="Last/Current Employer" text="Write Result as per below preference: Company Name of currently working company, Company Name of Last working company." />
          </InstructionSection>

        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function InstructionSection({ title, icon, children }) {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-white transition-all hover:shadow-md">
      <div className="bg-black text-white px-8 py-5 flex items-center gap-3">
        {icon}
        <h2 className={`${passero.className} text-xl uppercase tracking-wider`}>{title}</h2>
      </div>
      <div className="p-8 space-y-6">
        {children}
      </div>
    </div>
  );
}

function Rule({ label, text }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start group">
      <div className="md:col-span-1">
        <span className={`${passero.className} text-lg text-black block tracking-tight group-hover:translate-x-1 transition-transform`}>
          {label}
        </span>
      </div>
      <div className="md:col-span-3">
        <p className="text-sm leading-relaxed text-black/70 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          {text}
        </p>
      </div>
    </div>
  );
}