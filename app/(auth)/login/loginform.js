"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginUser } from '@/app/actions/auth';
import { Loader2, Terminal, Eye, EyeOff } from 'lucide-react';
import { robotoSlab, ubuntu } from "@/lib/fonts";

export default function LoginForm() {
  const [loginId, setLoginId] = useState('');       
  const [password, setPassword] = useState('');     
  const [error, setError] = useState('');           
  const [loading, setLoading] = useState(false);    
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();                    
  const searchParams = useSearchParams();            
  const message = searchParams.get('message');       

  const handleSubmit = async (e) => {
    e.preventDefault();       
    if (!loginId.trim() || !password) {
      setError("Please fill in all security fields.");
      return;
    }

    setLoading(true);         
    setError('');             

    try {
      const formData = new FormData();
      formData.append('loginId', loginId.trim());
      formData.append('password', password);

      const res = await loginUser(formData);

      if (res.success) {
        router.push(res.role === 'admin' ? '/admin' : '/user');
        router.refresh(); 
      } else {
        setError(res.message || "Invalid credentials provided.");
      }
    } catch (err) {
      setError("Server connection failed. Please check your network and retry.");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className={`min-h-screen min-w-screen grid lg:grid-cols-2 ${ubuntu.className} bg-white text-slate-900`}>

      {/* --- Left Side: Content & Form --- */}
      <div className="flex flex-col justify-between p-8 lg:p-16 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
            <Terminal size={18} className="text-white" />
          </div>
        </div>

        <div className="w-full my-auto py-8">
          <h1 className={`${robotoSlab.className} text-4xl lg:text-5xl font-medium tracking-tight mb-3`}>
            Welcome back!
          </h1>
          <p className="text-slate-500 mb-8 text-sm">
            Access your secure terminal and data processing tools.
          </p>

          {/* Notifications Desk */}
          <div className="min-h-12 flex flex-col justify-center">
            {error && <p className="text-red-500 text-xs font-bold bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">⚠️ {error}</p>}
            {message && <p className="text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl">{message}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Terminal ID */}
            <div className="space-y-1.5 group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within:text-black">
                Terminal Login ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="loginId"
                  autoComplete="username"
                  placeholder="DTS_ADMIN_01"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full border border-slate-200 px-5 py-4 outline-none focus:border-black transition-all text-xs font-bold text-slate-800 placeholder:text-slate-300 bg-slate-50 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within:text-black">
                Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 px-5 py-4 outline-none focus:border-black transition-all text-xs font-bold text-slate-800 placeholder:text-slate-300 bg-slate-50 rounded-xl focus:bg-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest mt-6 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : "Sign in to Dashboard"}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="flex gap-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <button type="button" className="hover:text-black transition-colors">Help</button>
          <button type="button" className="hover:text-black transition-colors">Terms</button>
          <button type="button" className="hover:text-black transition-colors">Privacy</button>
        </div>
      </div>

      {/* --- Right Side: Brutalist Aesthetic Graphic Space --- */}
      <div className="hidden lg:block bg-neutral-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
          }}
        />
        <div className="flex flex-col items-center justify-center h-full text-center p-12 select-none relative z-10">
          <div className="text-white/10 font-black text-9xl tracking-tighter italic">DTS</div>
          <p className="text-neutral-500 font-mono text-[9px] uppercase tracking-[0.4em] mt-4">GrowthForge Processing Terminal v2</p>
        </div>
      </div>
    </div>
  );
}