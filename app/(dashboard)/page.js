"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { passero } from '@/lib/fonts';

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
    <div className="h-screen bg-neutral-50 flex flex-col items-center justify-center gap-6 text-black">
      
      {/* Premium Monochromatic Spinner */}
      <div className="relative w-14 h-14">
        {/* Outer Track Ring */}
        <div className="absolute inset-0 border-[3px] border-black/5 rounded-full" />
        {/* Active Animated Boundary */}
        <div className="absolute inset-0 border-[3px] border-t-black border-transparent rounded-full animate-spin" />
        
        {/* Center Static Reference Point */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className={`${passero.className} text-lg text-black tracking-[0.2em] lowercase animate-pulse`}>
          routing to workspace
        </p>
        <p className="text-[9px] text-black/30 font-mono uppercase tracking-[0.25em]">
          Initializing Secure Session Node
        </p>
      </div>

      {/* Bottom Brutalist Watermark */}
      <div className="absolute bottom-12 opacity-15">
        <div className="w-8 h-8 border-2 border-black rounded-xl flex items-center justify-center font-mono font-bold text-xs">
          D.
        </div>
      </div>
    </div>
  );
}