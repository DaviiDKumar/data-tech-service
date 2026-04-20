// app/(dashboard)/page.js
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

export default function RootDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getCookie('role');

    if (!role) {
      router.push('/login');
    } else if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'user') {
      router.push('/user');
    }
  }, [router]);

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="text-center">
        <p className="text-[10px] font-black text-white uppercase tracking-[5px] animate-pulse">
          Routing to Workspace
        </p>
        <p className="text-[8px] text-slate-500 font-bold uppercase mt-2">Initializing Secure Session...</p>
      </div>
    </div>
  );
}