"use server";

import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import ClientInitializer from "@/components/ClientInitializer";
import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  await connectDB();

  // 1. Database se full user data nikalna
  let fullUser = null;
  if (userId) {
    const userDoc = await User.findById(userId).select("-password").lean();
    if (userDoc) {
      // MongoDB Object ko plain JavaScript object mein convert karna (for Next.js props)
      fullUser = JSON.parse(JSON.stringify(userDoc));
    }
  }

  // 2. Fallback data agar DB fail ho jaye ya user na mile
  const userData = fullUser ? {
    id: fullUser._id,
    role: fullUser.role,
    name: fullUser.name,
    email: fullUser.email,
    stats: fullUser.stats || {}, // Stats ab available honge
    kycStatus: fullUser.kycStatus || 'pending',
    bankDetailsStatus: fullUser.bankDetailsStatus || 'pending',
    kycDetails: fullUser.kycDetails || {},
    bankDetails: fullUser.bankDetails || {},
  } : {
    id: userId || null,
    role: cookieStore.get('role')?.value || 'user',
    name: cookieStore.get('userName')?.value || 'User',
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* 1. Bridge: Server data to Zustand (Ab isme stats bhi hain!) */}
      <ClientInitializer user={userData} />

      {/* 2. Sidebar: Passing initial data as props */}
      <Sidebar initialUser={userData} />

      <main className="flex-1 ml-64 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Growthforge Data Service
          </div>
          <div className="flex items-center gap-4">
             {/* Stats Preview in Header (Optional) */}
             <div className="hidden md:flex items-center gap-4 border-r pr-4 border-slate-100">
                <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Done</p>
                    <p className="text-xs font-bold text-emerald-600">{userData.stats?.approvedCount || 0}</p>
                </div>
             </div>

             <div className="flex items-center gap-3 font-bold text-sm text-slate-800">
               {userData.name}
               <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-black italic">
                 {userData.role === 'admin' ? 'AD' : 'US'}
               </div>
             </div>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}