import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import ClientInitializer from "@/components/ClientInitializer";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { passero, robotoSlab } from "@/lib/fonts";


import Logout from "@/components/Logout";
// 1. Static Shell: Ye instantly render hoga
export default function DashboardLayout({ children }) {




  return (
    <div className="flex min-h-screen bg-white text-black">
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
    endDate: fullUser.endDate || {},
    startDate: fullUser.startDate || {},
    isActive: fullUser.isActive || false,
    
  } : {
    id: userId || null,
    role: (await cookies()).get('role')?.value || 'user',
    name: (await cookies()).get('userName')?.value || 'User',
  };







  return (
    <>
      <ClientInitializer user={userData} />
      <Sidebar initialUser={userData} />

      <main className="flex-1 ml-58 flex flex-col transition-all duration-500">
        <header className="h-20 flex items-center border-b-2 border-slate-300 justify-between px-10 sticky top-0 z-40 backdrop-blur-xl">

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-left">
                <p className={`${passero.className} text-[18px] font-bold text-violet-700 leading-none`}>
                  User ID : <span className={` ${robotoSlab.className} text-[17px] font-bold text-black`}> {userData.id || "N/A"}</span>
                </p>
                <p className={`${passero.className} text-[15px] font-bold text-violet-700 leading-none mt-1`}>
                  Last Date : <span className={` ${robotoSlab.className} text-[13px] font-bold text-black`} > {userData.endDate ? new Date(userData.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}</span>
                </p>
              </div>
            </div>
          </div>

          <Logout />

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