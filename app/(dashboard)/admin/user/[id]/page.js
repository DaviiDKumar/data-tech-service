import connectDB from "@/lib/db";
import User from "@/models/User";
import { passero } from "@/lib/fonts";
import { ArrowLeft, CheckCircle, Clock, BarChart3, Calendar, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function UserDetailPage({ params }) {
  await connectDB();
  
  // Next.js 15+ requires awaiting params
  const { id } = await params;
  
  // Fetch user and clean data for the frontend
  const user = await User.findById(id).lean();

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
        <p className={`${passero.className} text-xl uppercase tracking-[10px] text-slate-300`}>User Not Found</p>
        <Link href="/admin/queries" className="text-[10px] font-bold uppercase tracking-widest text-violet-600 underline">
          Return to Hub
        </Link>
      </div>
    );
  }

  const { stats } = user;

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans text-left">
      {/* Navigation Header */}
      <div className="max-w-7xl mx-auto mb-10 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-violet-600 transition-colors">
          <ArrowLeft size={14} /> Back to Administration
        </Link>
        
        <div className="flex gap-4">
          <button className="bg-white border-2 border-slate-200 text-slate-900 px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[2px] hover:bg-slate-50 transition-all shadow-sm">
            Reset Password
          </button>
          <button className="bg-violet-600 text-white px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[2px] hover:bg-violet-700 shadow-lg shadow-violet-100 transition-all">
            Update Work Limit
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        
        {/* Left Column: Identity Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border-2 border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <ShieldCheck size={80} />
            </div>
            
            <div className="w-24 h-24 bg-violet-600 text-white rounded-[2rem] mb-8 flex items-center justify-center text-4xl font-bold shadow-xl shadow-violet-100">
              {user.name?.charAt(0)}
            </div>
            
            <h2 className={`${passero.className} text-3xl text-slate-900 mb-1 uppercase tracking-tight`}>
              {user.name}
            </h2>
            <p className="text-[11px] text-violet-500 font-black uppercase tracking-[3px] mb-10">
              ID: {user.loginId || "PENDING_SYNC"}
            </p>
            
            <div className="space-y-6 pt-8 border-t-2 border-slate-50">
              <InfoItem label="Primary Email" value={user.email} />
              <InfoItem label="Mobile Node" value={user.phone} />
              <InfoItem label="Assigned Role" value={user.role?.toUpperCase()} />
              <InfoItem label="Database ID" value={id} />
            </div>
          </div>

          {/* Timeline Node */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-100">
             <h3 className={`${passero.className} text-[10px] tracking-[4px] mb-8 uppercase text-slate-400`}>Contract Lifecycle</h3>
             <div className="space-y-6">
                <TimelineItem label="Activation Date" date={user.startDate} />
                <TimelineItem label="Termination Date" date={user.endDate} />
             </div>
          </div>
        </div>

        {/* Right Column: Analytics & Validation */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Performance Terminal */}
          <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex items-center justify-between mb-10">
              <h3 className={`${passero.className} text-xs tracking-[5px] uppercase text-violet-400 opacity-80`}>Node Performance Analytics</h3>
              <BarChart3 size={20} className="text-violet-400 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatBox label="Total Syncs" value={stats?.submittedCount} />
              <StatBox label="In Review" value={stats?.inProgressCount} />
              <StatBox label="Valid Nodes" value={stats?.approvedCount} color="text-emerald-400" />
              <StatBox label="Rejected" value={stats?.rejectedCount} color="text-rose-400" />
            </div>
          </section>

          {/* Verification Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <StatusCard label="KYC Validation" status={user.kycStatus} />
            <StatusCard label="Bank Payout Hub" status={user.bankDetailsStatus} />
          </div>

          {/* Footer Security Note */}
          <div className="bg-slate-200/50 p-6 rounded-[2rem] border-2 border-dashed border-slate-300 flex items-center justify-center">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 italic">
              Encrypted Document Storage Active • SECURE_NODE_V3
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── HELPER COMPONENTS ───

function InfoItem({ label, value }) {
  return (
    <div className="text-left">
      <p className="text-[9px] text-slate-300 uppercase font-black tracking-widest mb-1.5">{label}</p>
      <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">{value || 'NOT_FOUND'}</p>
    </div>
  );
}

function TimelineItem({ label, date }) {
  return (
    <div className="flex items-center gap-5">
      <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
        <Calendar size={18} />
      </div>
      <div className="text-left">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-bold text-slate-700">
          {date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, color = "text-white" }) {
  return (
    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center backdrop-blur-sm">
      <p className="text-[8px] uppercase font-black tracking-[3px] text-slate-500 mb-3">{label}</p>
      <p className={`text-3xl font-bold tracking-tighter ${color}`}>{value ?? 0}</p>
    </div>
  );
}

function StatusCard({ label, status }) {
  const isVerified = status === 'verified';
  return (
    <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 flex flex-col items-center text-center group hover:border-violet-100 transition-all">
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] mb-8">{label}</p>
      <div className={`p-6 rounded-[2rem] mb-6 transition-transform group-hover:scale-110 ${isVerified ? 'bg-emerald-50 text-emerald-500 shadow-lg shadow-emerald-100' : 'bg-orange-50 text-orange-500 shadow-lg shadow-orange-100'}`}>
        {isVerified ? <CheckCircle size={32}/> : <Clock size={32}/>}
      </div>
      <p className="text-2xl font-black uppercase tracking-tighter text-slate-800 italic">
        {status || 'pending'}
      </p>
    </div>
  );
}