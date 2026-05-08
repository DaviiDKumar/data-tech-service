import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import ClientInitializer from "@/components/ClientInitializer";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { passero } from "@/lib/fonts";

// 1. Static Shell: Ye instantly render hoga
export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-200 text-black">
      {/* Wrap everything that needs DB/Cookies in Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardAsyncContent>{children}</DashboardAsyncContent>
      </Suspense>
    </div>
  );
}

// 2. Async Content: Saari logic yahan shift kar di
async function DashboardAsyncContent({ children }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  await connectDB();

  let fullUser = null;
  if (userId) {
    const userDoc = await User.findById(userId).select("-password").lean();
    if (userDoc) {
      fullUser = JSON.parse(JSON.stringify(userDoc));
    }
  }

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
    role: (await cookies()).get('role')?.value || 'user',
    name: (await cookies()).get('userName')?.value || 'User',
  };

  return (
    <>
      <ClientInitializer user={userData} />
      <Sidebar initialUser={userData} />
      
      <main className="flex-1 ml-54 flex flex-col transition-all duration-500">
        <header className="h-20 flex items-center border-b-2 border-slate-300 justify-between px-10 sticky top-0 z-40 backdrop-blur-xl">
          <div className={`${passero.className} text-[12px] text-black uppercase tracking-[4px]`}>
            DATATECH SERVICE
          </div>
          <div className="flex items-center gap-6">
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
        <div>{children}</div>
      </main>
    </>
  );
}

// 3. Simple Loading State
function DashboardSkeleton() {
  return <div className="flex items-center justify-center w-full h-screen">Loading...</div>;
}