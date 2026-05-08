import connectDB from "@/lib/db";
import Query from "@/models/Queries";
import { cookies } from "next/headers";
import { passero } from "@/lib/fonts";
import ChatInterface from "@/components/ChatInterface";
import { createTicket } from "@/app/actions/queries";

export default async function QueriesPage({ searchParams }) {
  await connectDB();
  const userId = (await cookies()).get('userId')?.value;
  
  // Fixed: Query by 'user' field to match your Schema
  const userQueries = await Query.find({ user: userId }).sort({ updatedAt: -1 }).lean();
  
  const params = await searchParams;
  const selectedId = params.id;
  const isCreating = params.new === 'true';
  const activeQuery = userQueries.find(q => q._id.toString() === selectedId);

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-300 overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className={`${passero.className} text-[10px] tracking-[3px] uppercase`}>Support</h2>
          <a href="?new=true" className="text-[10px] bg-black text-white px-3 py-1 rounded-full">+ Ticket</a>
        </div>
        {userQueries.map(q => (
          <a href={`?id=${q._id}`} key={q._id.toString()}>
            <div className={`p-5 border-b hover:bg-slate-50 transition-all ${selectedId === q._id.toString() ? 'bg-slate-100 border-l-4 border-black' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-slate-400">#{q._id.toString().slice(-6)}</span>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${q.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{q.status}</span>
              </div>
              <h3 className="text-xs font-bold uppercase truncate">{q.subject}</h3>
            </div>
          </a>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-gray-100 flex flex-col">
        {isCreating ? (
          <form action={createTicket} className="max-w-xl mx-auto mt-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <h2 className={`${passero.className} text-lg mb-6 uppercase tracking-widest`}>Open Ticket</h2>
            <div className="space-y-4">
              <input name="subject" placeholder="SUBJECT" className="w-full border-b py-2 outline-none focus:border-black uppercase text-xs font-bold" required />
              <select name="category" className="w-full border-b py-2 outline-none text-[10px] font-bold uppercase">
                <option value="General">General</option>
                <option value="KYC">KYC Help</option>
                <option value="Payment">Payment</option>
              </select>
              <textarea name="message" placeholder="DESCRIBE ISSUE..." rows="4" className="w-full bg-slate-50 p-4 rounded-xl outline-none text-[11px] uppercase" required></textarea>
              <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold text-[10px] tracking-widest hover:bg-zinc-800 transition-all uppercase">Send Request</button>
            </div>
          </form>
        ) : activeQuery ? (
          <ChatInterface query={JSON.parse(JSON.stringify(activeQuery))} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <p className="uppercase text-[9px] tracking-[5px]">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}