import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import ClientInitializer from "@/components/ClientInitializer";
import connectDB from "@/lib/db";
import User from "@/models/User";

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
        
        <div>{children}</div>
      </main>
    </>
  );
}

// 3. Simple Loading State
function DashboardSkeleton() {
  return <div className="flex items-center justify-center w-full h-screen">Loading...</div>;
}