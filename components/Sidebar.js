"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { logoutUser } from '@/app/actions/auth';
import { passero, robotoSlab, ubuntu } from '@/lib/fonts';
import { useState } from 'react';
import {
  LayoutDashboard, Briefcase, FilePlus, Bookmark,
  CheckCircle, XCircle, MessageSquare, User,
  PlusCircle, Loader2, UploadCloud, Users, RefreshCw,
  ShieldCheck, FileText, LifeBuoy, LogOut,
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
      if (error.message !== 'NEXT_REDIRECT') {
        console.error("Logout failed:", error);
      }
    }
  };

  const handleQuickStart = async () => {
    if (!userId) return alert("Session expired, login again");
    setIsAssigning(true);
    const res = await autoAssignAndGetId(userId);
    if (res.success) {
      router.push(`/user/workspace/${res.resumeId}`);
    } else {
      alert(res.error);
    }
    setIsAssigning(false);
  };

  const userMenu = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/user' },
    // INTEGRATED ACTION BUTTON
    { type: 'action', name: 'New Assignment', icon: <PlusCircle size={18} /> },
    { name: 'Saved Resume', icon: <Bookmark size={18} />, path: '/user/reassigned' },
    { name: 'Submitted Resume', icon: <CheckCircle size={18} />, path: '/user/submitted' },
    { name: 'Rejected Resume', icon: <XCircle size={18} />, path: '/user/rejected' },
    { name: 'Profile', icon: <User size={18} />, path: '/user/profile' },
    { name: 'My Queries', icon: <MessageSquare size={18} />, path: '/user/queries' },
    { name: 'Terms & Conditions', icon: <MessageSquare size={18} />, path: '/user/terms' },
    { name: 'Instructions', icon: <MessageSquare size={18} />, path: '/user/instructions' },
  ];

  const adminMenu = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/admin' },
    { name: 'Upload Resume', icon: <UploadCloud size={18} />, path: '/admin/upload' },
    { name: 'Users', icon: <Users size={18} />, path: '/admin/users' },
    { name: 'Reassign', icon: <RefreshCw size={18} />, path: '/admin/reassign' },
    { name: 'Saved', icon: <FilePlus size={18} />, path: '/admin/savedresume' },
    { name: 'Submitted', icon: <CheckCircle size={18} />, path: '/admin/submitted' },
    { name: 'KYC Center', icon: <Briefcase size={18} />, path: '/admin/kycreview ' },
    { name: 'Role Master', icon: <ShieldCheck size={18} />, path: '/admin/roles' },
    { name: 'Admin Resumes', icon: <FileText size={18} />, path: '/admin/resumes' },
    { name: 'Support', icon: <LifeBuoy size={18} />, path: '/admin/support' },
  ];

  const currentMenu = role === 'admin' ? adminMenu : userMenu;

  return (
    <aside className="fixed inset-y-0 left-0 w-54 bg-black text-slate-200 flex flex-col z-50 border-r border-white/5">

      {/* Brand Logo Section */}
      <div className="h-24 flex items-center px-8 bg-black">
        <span className={`${robotoSlab.className} text-white tracking-tighter text-2xl`}>
          Data Tech.
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 no-scrollbar scroll-smooth px-4">
        {currentMenu.map((item, index) => {
          // --- RENDER ACTION BUTTON ---
          if (item.type === 'action') {
            return (
              <div key="quick-start" className="">
                <button
                  onClick={handleQuickStart}
                  disabled={isAssigning}
                  className={`${passero.className} w-full cursor-pointer flex items-center text-left gap-3 text-slate-400 hover:text-white py-4 px-6 text-sm uppercase tracking-widest transition-all disabled:opacity-50 group`}
                >
                  {/* Corrected Icon: Size 20 and forced alignment */}
                  <PlusCircle
                    size={20}
                    className={`shrink-0 transition-opacity ${isAssigning ? "opacity-50" : "opacity-100 group-hover:text-white"}`}
                  />

                  {/* Text aligned perfectly next to icon */}
                  <span className="leading-none mt-0.5">
                    {isAssigning ? "Processing..." : "New Assignment"}
                  </span>
                </button>
              </div>
            );
          }

          // --- RENDER STANDARD LINKS ---
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path || index}
              href={item.path}
              className={`${passero.className} relative text-slate-400 flex items-center gap-3 px-6 py-3.5 rounded-xl transition-all duration-300 group ${isActive ? 'bg-white/5 text-white' : 'hover:bg-white/5 hover:text-white'
                }`}
            >
              <span className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className="text-sm tracking-wide capitalize">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Logout Section */}
      <div className="px-8 pb-10 mt-auto border-t border-white/5 pt-6">
        <button
          onClick={handleLogout}
          className="flex gap-3 w-full text-slate-400 items-center cursor-pointer transition-all duration-300 group hover:text-red-500"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span className={`${passero.className} text-[13px] tracking-wide`}>
            Log Out
          </span>
        </button>
      </div>
    </aside>
  );
}