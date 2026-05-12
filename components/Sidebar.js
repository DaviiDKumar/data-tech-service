"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { logoutUser } from '@/app/actions/auth';
import { robotoSlab, ubuntu, passero } from '@/lib/fonts';
import { useState } from 'react';
import {
  LayoutDashboard, Briefcase, FilePlus, Bookmark,
  CheckCircle,  MessageSquare, User,
  Loader2, UploadCloud, Users, RefreshCw,
  FileText, LifeBuoy, LogOut ,Newspaper , X ,  ListPlus , Activity
} from 'lucide-react';
import { autoAssignAndGetId } from '@/app/actions/userWork';

export default function Sidebar({ initialUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const storeUser = useUserStore((state) => state.user);
  const logoutStore = useUserStore((state) => state.logout);

  const user = storeUser || initialUser;
  const role = user?.role || 'user';
  const userId = user?.id || user?._id;
  const [isAssigning, setIsAssigning] = useState(false);

  const handleLogout = async () => {
    try {
      logoutStore();
      await logoutUser();
    } catch (error) {
      if (error.message !== 'NEXT_REDIRECT') console.error("Logout failed:", error);
    }
  };

  const handleQuickStart = async () => {
    if (!userId) return alert("Session expired, please login again.");
    setIsAssigning(true);
    try {
      const res = await autoAssignAndGetId(userId);
      if (res.success) {
        router.push(`/user/workspace/${res.resumeId}`);
      } else {
        alert(res.error || "Unable to start assignment.");
      }
    } catch (error) {
      console.error("Assignment Error:", error);
      alert("A system error occurred.");
    } finally {
      setIsAssigning(false);
    }
  };

  const userMenu = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/user' },
    { type: 'action', name: 'New Resume', icon: <Newspaper size={20} /> },
    { name: 'Saved Resume', icon: <Bookmark size={20} />, path: '/user/reassigned' },
    { name: 'Submitted', icon: <CheckCircle size={20} />, path: '/user/submitted' },
    { name: 'Rejected', icon: <X size={20} />, path: '/user/rejected' },
    { name: 'Profile', icon: <User size={20} />, path: '/user/profile' },
    { name: 'My Queries', icon: <MessageSquare size={20} />, path: '/user/queries' },
    { name: 'Terms', icon: <FileText size={20} />, path: '/user/terms' },
    { name: 'Instructions', icon: <ListPlus size={20} />, path: '/user/instructions' },
  ];

  const adminMenu = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin' },
    { name: 'Upload', icon: <UploadCloud size={20} />, path: '/admin/upload' },
    { name: 'Users', icon: <Users size={20} />, path: '/admin/users' },
    { name: 'Reassign', icon: <RefreshCw size={20} />, path: '/admin/reassign' },
    { name: 'Saved', icon: <FilePlus size={20} />, path: '/admin/savedresume' },
    { name: 'Submitted', icon: <CheckCircle size={20} />, path: '/admin/submitted' },
    { name: 'KYC Center', icon: <Briefcase size={20} />, path: '/admin/kycreview' },
    { name: 'Resumes', icon: <FileText size={20} />, path: '/admin/resumes' },
    { name: 'Queries', icon: <LifeBuoy size={20} />, path: '/admin/queries' },
  ];

  const currentMenu = role === 'admin' ? adminMenu : userMenu;

  return (
    <aside className="fixed inset-y-0 left-0 bg-white text-black flex flex-col z-50 border-r border-slate-300 shadow-lg w-58">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100 gap-2">
        <Activity size={20} className="text-violet-600 " />
        <span className={`${robotoSlab.className} text-violet-600 tracking-tighter text-xl font-bold truncate`}>
          Data Tech.
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1.5 no-scrollbar px-4">
        {currentMenu.map((item, index) => {
          const isActive = pathname === item.path;

          if (item.type === 'action') {
            return (
              <button
                key="action-btn"
                onClick={handleQuickStart}
                disabled={isAssigning}
                className={`${ubuntu.className} cursor-pointer w-full flex items-center gap-4 py-3 px-4 rounded-2xl transition-all group ${
                  isAssigning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-violet-200 text-black hover:text-violet-600'
                }`}
              >
                <span className="text-black group-hover:text-violet-600">
                  {isAssigning ? <Loader2 size={20} className="animate-spin" /> : item.icon}
                </span>
                <span className="text-[13px] font-semibold tracking-wide whitespace-nowrap">
                  {isAssigning ? "Processing..." : item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.path || index}
              href={item.path}
              className={`${ubuntu.className} flex items-center gap-4 py-3 px-4 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                  : 'text-black hover:bg-violet-200 hover:text-violet-600'
              }`}
            >
              <span className={`transition-colors ${isActive ? 'text-white' : 'text-black group-hover:text-violet-600'}`}>
                {item.icon}
              </span>
              <span className="text-[13px] font-semibold tracking-wide whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 pb-8 mt-auto border-t border-slate-100 pt-6">
        <button
          onClick={handleLogout}
          className="flex gap-4 py-3 px-4 rounded-2xl text-red-600  w-full hover:bg-red-600 hover:text-white items-center cursor-pointer transition-all  group"
        >
          <LogOut size={20} className="transition-transform duration-300 group-hover:text-white text-red-600 group-hover:translate-x-1" />
          <span className={`${passero.className} text-[16px] font-semibold`}>
            Log Out
          </span>
        </button>
      </div>
    </aside>
  );
}