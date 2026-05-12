"use client";

import { LogOut } from "lucide-react";
import { passero } from "@/lib/fonts";
import { logoutUser } from '@/app/actions/auth';
import { useUserStore } from '@/store/useUserStore';

export default function Logout() {
  const logoutStore = useUserStore((state) => state.logout);

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

  return (
    <button
      onClick={handleLogout}
      className="flex cursor-pointer items-center gap-3 px-5 py-2 rounded-xl border-2  text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 group active:scale-95"
    >
      <span className={`${passero.className} text-[14px] uppercase tracking-widest font-bold`}>
        LogOut
      </span>
      <div className="bg-red-50 p-1 rounded-md group-hover:bg-white/20 transition-colors">
        <LogOut 
          size={14} 
          className="transition-transform duration-300 group-hover:rotate-12" 
        />
      </div>
    </button>
  );
}