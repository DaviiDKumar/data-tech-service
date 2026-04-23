// app/(dashboard)/page.js
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { passeroOne } from '@/lib/fonts';

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
    <div className={`h-screen bg-gray-200 flex flex-col items-center justify-center gap-6 ${passeroOne.className}`}>
      
      {/* Premium Monochromatic Loader */}
      <div className="relative w-16 h-16">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-[3px] border-white/10 rounded-full"></div>
        {/* Spinning Top Border */}
        <div className="absolute inset-0 border-[3px] border-t-white border-transparent rounded-full animate-spin"></div>
        
        {/* Center Static Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="text-center">
        {/* Main Text - Lowercase as per your style preference */}
        <p className="text-sm text-white tracking-[0.2em] animate-pulse">
          routing to workspace
        </p>
        
        {/* Subtext */}
        <p className="text-[10px] text-white/40 font-sans uppercase tracking-widest mt-3">
          Initializing Secure Session
        </p>
      </div>

      {/* Decorative "F." Logo style watermark at bottom */}
      <div className="absolute bottom-12 opacity-20">
        <div className="w-8 h-8 border border-white rounded-lg flex items-center justify-center">
          <span className="text-white text-xs">D.</span>
        </div>
      </div>
    </div>
  );
}