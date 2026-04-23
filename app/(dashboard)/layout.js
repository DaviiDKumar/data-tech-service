"use server";

import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import ClientInitializer from "@/components/ClientInitializer";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { passero } from "@/lib/fonts"; // Import your passero font

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  await connectDB();

  // 1. Database se full user data nikalna
  let fullUser = null;
  if (userId) {
    const userDoc = await User.findById(userId).select("-password").lean();
    if (userDoc) {
      fullUser = JSON.parse(JSON.stringify(userDoc));
    }
  }

  // 2. User Data Mapping
  const userData = fullUser ? {
    id: fullUser._id,
    role: fullUser.role,
    name: fullUser.name,
    email: fullUser.email,
    stats: fullUser.stats || {},
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
    <div className="flex min-h-screen bg-gray-200 text-black">
      {/* 1. Bridge: Server data to Zustand */}
      <ClientInitializer user={userData} />

      {/* 2. Sidebar: Width w-54 + left-6 padding = ml-72 for main content */}
      <Sidebar initialUser={userData} />

      {/* 3. Main Content: Margin-left 72 to give room to floating sidebar */}
      <main className="flex-1 ml-54 flex flex-col transition-all duration-500">
        
        {/* Header: Transparent with Blur */}
        <header className="h-20 flex items-center border-b-2 border-slate-300  justify-between px-10 sticky top-0 z-40 backdrop-blur-xl ">
          <div className={`${passero.className} text-[12px] text-black uppercase tracking-[4px]`}>
            DATATECH SERVICE
          </div>

          <div className="flex items-center gap-6">
             {/* Stats Preview: Monochromatic style */}
            

             {/* User Info */}
             <div className="flex items-center gap-3">
               <div className="text-right">
                  <p className={`${passero.className} text-xs text-black leading-none`}>
                    {userData.name}
                  </p>
                  <p className="text-[9px] text-black/40 font-bold uppercase tracking-widest mt-1">
                    {userData.role} Account
                  </p>
               </div>
             
             </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="">
          {children}
        </div>
      </main>
    </div>
  );
}