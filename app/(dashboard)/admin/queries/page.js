import connectDB from "@/lib/db";
import Query from "@/models/Queries";
import User from "@/models/User";
import { passero } from "@/lib/fonts";
import AdminChatInterface from "@/components/AdminChatInterface";

export default async function AdminQueriesPage({ searchParams }) {
  // 1. DYNAMIC TRIGGER: Always await params/searchParams FIRST
  const params = await searchParams;
  const selectedId = params.id;

  // 2. Now call your DB
  await connectDB();

  const allQueries = await Query.find()
    .populate('user', 'name email loginId kycStatus')
    .sort({ updatedAt: -1 })
    .lean();

  const activeQuery = allQueries.find(q => q._id.toString() === selectedId);
  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Column 1: Ticket Sidebar */}
      <div className="w-80 bg-white border-r border-slate-300 flex flex-col">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h2 className={`${passero.className} text-[10px] tracking-[4px] uppercase text-black`}>User Queries</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {allQueries.map(q => (
            <a href={`?id=${q._id}`} key={q._id.toString()}>
              <div className={`p-5 border-b hover:bg-slate-50 transition-all ${selectedId === q._id.toString() ? 'bg-slate-100 border-l-4 border-black' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{q.user?.name || 'Unknown User'}</span>
                  <span className={`text-[7px] font-bold px-2 py-0.5 rounded-full uppercase ${q.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {q.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold uppercase truncate text-black">{q.subject}</h3>
                <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-tighter">ID: {q.user?.loginId}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Column 2: Chat View */}
      {activeQuery ? (
        <AdminChatInterface query={JSON.parse(JSON.stringify(activeQuery))} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-slate-400 uppercase text-[9px] tracking-[5px]">
          Select a user query to respond
        </div>
      )}

      {/* Column 3: Quick User Info (Visible only when chat is open) */}
      {activeQuery && (
        <div className="w-64 bg-slate-50 p-6 hidden xl:block">
          <h4 className={`${passero.className} text-[10px] tracking-widest mb-6`}>User Details</h4>
          <div className="space-y-4">
            <div>
              <p className="text-[8px] text-slate-400 uppercase font-bold">Email</p>
              <p className="text-[10px] break-words font-medium">{activeQuery.user?.email}</p>
            </div>
            <div>
              <p className="text-[8px] text-slate-400 uppercase font-bold">KYC Status</p>
              <p className={`text-[10px] font-bold uppercase ${activeQuery.user?.kycStatus === 'verified' ? 'text-green-600' : 'text-orange-500'}`}>
                {activeQuery.user?.kycStatus || 'Pending'}
              </p>
            </div>
            <hr className="border-slate-200" />
            <div className="pt-4">
              <a href={`/admin/users/${activeQuery.user?._id}`} className="text-[9px] bg-white border border-black text-black px-4 py-2 rounded-lg block text-center font-bold hover:bg-black hover:text-white transition-all">
                VIEW FULL PROFILE
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}