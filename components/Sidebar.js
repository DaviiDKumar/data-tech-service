"use client";

import Link from 'next/link';
import { usePathname, } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { logoutUser } from '@/app/actions/auth';

import {
  LayoutDashboard, Briefcase, FilePlus, Bookmark,
  CheckCircle, XCircle, MessageSquare, User,
  UploadCloud, Layers, Users, RefreshCw,
  ShieldCheck, FileText, LifeBuoy, LogOut,
} from 'lucide-react';

export default function Sidebar({ initialUser }) {
  const pathname = usePathname();


  // Zustand Store se data lo
  const storeUser = useUserStore((state) => state.user);
  const logoutStore = useUserStore((state) => state.logout);

  // Priority: Zustand Store -> then Initial Props (Server se aaya hua data)
  const user = storeUser || initialUser;
  const role = user?.role || 'user';
  const userName = user?.name || 'Session User';


  const handleLogout = async () => {
    try {

      // 1. Zustand Store reset karo (Client side state saaf karne ke liye)
      logoutStore();

      // 2. Server Action call karo
      // Ye cookies delete karega aur redirect handle karega
      await logoutUser();
    } catch (error) {
      // Next.js redirect internally "NEXT_REDIRECT" error throw karta hai
      // Toh agar normal error ho tabhi console karein
      if (error.message !== 'NEXT_REDIRECT') {
        console.error("Logout failed:", error);
      }
    }
  };

  // --- MENU CONFIGURATION ---
  const userMenu = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/user' },
    { name: 'Workspace', icon: <Briefcase size={18} />, path: '/user/workspace' },
    { name: 'New Resume', icon: <FilePlus size={18} />, path: '/user/allresumesavailable' },
    { name: 'In Progress', icon: <Layers size={18} />, path: '/user/inprogress' },
    { name: 'Saved Resume', icon: <Bookmark size={18} />, path: '/user/reassigned' },
    { name: 'Submitted Resume', icon: <CheckCircle size={18} />, path: '/user/submitted' },
    { name: 'Rejected Resume', icon: <XCircle size={18} />, path: '/user/rejected' },
    { name: 'My Queries', icon: <MessageSquare size={18} />, path: '/user/queries' },
    { name: 'Profile', icon: <User size={18} />, path: '/user/profile' },
  ];

  const adminMenu = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/admin' },
    { name: 'Upload Resume', icon: <UploadCloud size={18} />, path: '/admin/upload' },
    { name: 'Users', icon: <Users size={18} />, path: '/admin/users' },
    { name: 'Reassign', icon: <RefreshCw size={18} />, path: '/admin/reassign' },
    { name: 'Submitted', icon: <CheckCircle size={18} />, path: '/admin/submitted' },
    { name: 'KYC Center', icon: <Briefcase size={18} />, path: '/admin/kycreview ' },
    { name: 'Role Master', icon: <ShieldCheck size={18} />, path: '/admin/roles' },
    { name: 'Admin Resumes', icon: <FileText size={18} />, path: '/admin/resumes' },
    { name: 'Support', icon: <LifeBuoy size={18} />, path: '/admin/support' },
  ];

  const currentMenu = role === 'admin' ? adminMenu : userMenu;

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#f8fafc] text-slate-600 flex flex-col border-r border-slate-200 shadow-sm z-50">

      {/* Brand Logo Section */}
      <div className="h-20 flex items-center px-8 border-b border-slate-100 bg-white">
        <span className="text-slate-900 font-black tracking-tighter text-2xl flex items-center gap-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
          </div>
          DATa<span className="text-blue-600">TECH</span>
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1 no-scrollbar scroll-smooth">
        {currentMenu.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex items-center gap-3 px-8 py-3.5 cursor-pointer transition-all duration-300 group ${isActive
                ? 'bg-blue-600 text-white'
                : 'hover:bg-blue-600 hover:text-white'
                }`}
            >
              {/* Left Active Indicator Span */}
              <span className={`absolute left-0 top-0 bottom-0 w-1.5 bg-blue-300 transition-transform duration-300 ${isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'
                }`} />

              {/* Icon */}
              <span className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}>
                {item.icon}
              </span>

              {/* Name */}
              <span className="text-sm font-bold tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Logout Section */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-3 mb-6 px-2">
          {/* Dynamic Avatar Color based on Role */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border shadow-sm transition-transform duration-500 ${role === 'admin'
            ? 'bg-purple-50 text-purple-600 border-purple-100'
            : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="truncate">
            <p className="text-sm font-black text-slate-900 truncate leading-tight">
              {userName}
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${role === 'admin' ? 'text-purple-500' : 'text-blue-500'
              }`}>
              {role} Account
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black bg-slate-100 text-slate-500 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 cursor-pointer group shadow-sm"
        >
          <LogOut size={14} className="group-hover:-translate-x-1 transition-transform duration-300" />
          LOGOUT SYSTEM
        </button>
      </div>
    </aside>
  );
}