import { cookies } from "next/headers";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import ClientInitializer from "@/components/ClientInitializer";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { passero } from "@/lib/fonts";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white text-black antialiased font-sans">
      {/* Structural Suspense ensures initial static shell elements load without blocking */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardAsyncContent>{children}</DashboardAsyncContent>
      </Suspense>
    </div>
  );
}

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
    loginId: fullUser.loginId || null,
  } : {
    id: userId || null,
    role: cookieStore.get('role')?.value || 'user',
    name: cookieStore.get('userName')?.value || 'User',
  };

  return (
    <>
      <ClientInitializer user={userData} />
      <Sidebar initialUser={userData} />

      {/* Structured Margin Offset aligns clean with sidebar grids */}
      <main className="flex-1 ml-64 flex flex-col min-w-0 transition-all duration-500 overflow-x-hidden">
        <div className="w-full">{children}</div>
      </main>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-white gap-4 text-black">
      <Loader2 className="animate-spin text-neutral-800" size={36} />
      <span className={`${passero.className} text-xs uppercase tracking-[0.4em] text-neutral-400`}>
        Initializing Workspace Node...
      </span>
    </div>
  );
}