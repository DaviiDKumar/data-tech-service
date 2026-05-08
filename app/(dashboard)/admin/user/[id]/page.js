import connectDB from "@/lib/db";
import User from "@/models/User";
import { passero } from "@/lib/fonts";
import { ArrowLeft, CheckCircle, Clock, BarChart3, Calendar } from "lucide-react";
import Link from "next/link";

export default async function UserDetailPage({ params }) {
  await connectDB();
  const { id } = await params;
  const user = await User.findById(id).lean();

  if (!user) return <div className="p-20 text-center uppercase tracking-[5px]">User Not Found</div>;

  // Destructure stats for cleaner code
  const { stats } = user;

  return (
    <div className="p-8 bg-gray-200 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/admin/queries" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-black">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="flex gap-4">
          <button className="bg-black text-white px-8 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-[2px] hover:bg-zinc-800 transition-all">
            Update Work Limit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Left: User Profile & Timeline */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-300">
            <div className="w-20 h-20 bg-black text-white rounded-3xl mb-6 flex items-center justify-center text-2xl font-bold">
              {user.name?.charAt(0)}
            </div>
            <h2 className={`${passero.className} text-2xl mb-1 uppercase`}>{user.name}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mb-8">{user.loginId}</p>
            
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <InfoItem label="Email" value={user.email} />
              <InfoItem label="Phone" value={user.phone} />
              <InfoItem label="Role" value={user.role.toUpperCase()} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-300">
             <h3 className={`${passero.className} text-[10px] tracking-[4px] mb-6 uppercase text-slate-400`}>Contract Period</h3>
             <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Calendar size={18} className="text-slate-300" />
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Start Date</p>
                    <p className="text-xs font-bold">{new Date(user.startDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Calendar size={18} className="text-slate-300" />
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">End Date</p>
                    <p className="text-xs font-bold">{new Date(user.endDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Work Statistics & Verification */}
        <div className="col-span-8 space-y-8">
          
          {/* Work Stats Grid */}
          <section className="bg-zinc-900 p-8 rounded-[40px] text-white shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className={`${passero.className} text-xs tracking-[4px] uppercase opacity-60`}>Work Performance</h3>
              <BarChart3 size={20} className="opacity-30" />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <StatBox label="Submitted" value={stats?.submittedCount} />
              <StatBox label="In Progress" value={stats?.inProgressCount} />
              <StatBox label="Approved" value={stats?.approvedCount} color="text-green-400" />
              <StatBox label="Rejected" value={stats?.rejectedCount} color="text-red-400" />
            </div>
          </section>

          {/* Verification Status */}
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-300">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">KYC Status</p>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${user.kycStatus === 'verified' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {user.kycStatus === 'verified' ? <CheckCircle size={20}/> : <Clock size={20}/>}
                </div>
                <p className="text-lg font-bold uppercase tracking-tighter">{user.kycStatus}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-300">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Bank Status</p>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${user.bankDetailsStatus === 'verified' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {user.bankDetailsStatus === 'verified' ? <CheckCircle size={20}/> : <Clock size={20}/>}
                </div>
                <p className="text-lg font-bold uppercase tracking-tighter">{user.bankDetailsStatus}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-300/50 p-8 rounded-[40px] border border-dashed border-slate-400 flex items-center justify-center">
            <p className="text-[9px] font-bold uppercase tracking-[4px] text-slate-500 italic">
              Detailed document images are stored in secure storage
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[8px] text-slate-400 uppercase font-bold tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-black">{value || '---'}</p>
    </div>
  );
}

function StatBox({ label, value, color = "text-white" }) {
  return (
    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center">
      <p className="text-[7px] uppercase font-bold tracking-widest opacity-40 mb-2">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
    </div>
  );
}