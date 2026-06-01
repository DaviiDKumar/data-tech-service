"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions/auth';
import Link from 'next/link';
import { Loader2, UserPlus, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { robotoSlab, ubuntu, passero } from "@/lib/fonts";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError("All tracking field nodes must be populated.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('email', formData.email.trim().toLowerCase());
      data.append('phone', formData.phone.trim());

      const res = await registerUser(data);

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login?message=Secure credentials dispatched to your mail endpoint!');
        }, 3000);
      } else {
        setError(res.error || "Registration request failed validation.");
      }
    } catch (err) {
      setError("Server pipeline connection dropped. Check link status.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-white ${ubuntu.className} p-6`}>
        <div className="text-center animate-in fade-in zoom-in duration-500 max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black text-white rounded-full mb-8 shadow-2xl">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h2 className={`${robotoSlab.className} text-3xl font-medium text-slate-900 mb-4 uppercase tracking-tight`}>Request Sent!</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Check your email for custom secure credentials. <br/>
            Redirecting to secure system gate...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen grid lg:grid-cols-2 ${ubuntu.className} bg-white text-slate-900`}>
      
      {/* --- Left Side: Artistic/Monochrome Secure Graphic --- */}
      <div className="hidden lg:flex bg-[#09090b] relative items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '40px 40px' }} 
        />
        <div className="relative z-10 text-center select-none">
          <Shield className="text-white w-24 h-24 mx-auto mb-6 opacity-20 animate-pulse" />
          <h2 className={`${robotoSlab.className} text-white text-4xl opacity-10 tracking-widest uppercase`}>
            Secure Gateway
          </h2>
        </div>
      </div>

      {/* --- Right Side: Registration Inputs --- */}
      <div className="flex flex-col justify-between p-8 lg:p-16 w-full max-w-xl mx-auto">
        
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
            <UserPlus size={20} className="text-black" />
          </div>
        </div>

        <div className="w-full py-8">
          <h1 className={`${robotoSlab.className} text-4xl font-medium tracking-tight mb-3`}>
            Join DTS
          </h1>
          <p className="text-slate-500 mb-8 text-sm">
            Complete the parameters to authorize secure terminal workspace access.
          </p>

          {/* Notifications Desk */}
          <div className="min-h-12 flex flex-col justify-center">
            {error && (
              <p className="text-rose-600 text-xs font-bold bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                {error}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Full Name */}
            <div className="space-y-1.5 group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within:text-black">
                Full Legal Name
              </label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-slate-200 px-5 py-4 streamline-none focus:border-black transition-all text-xs font-bold text-slate-800 placeholder:text-slate-300 bg-slate-50 rounded-xl focus:bg-white"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5 group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within:text-black">
                Email Address Endpoint
              </label>
              <input
                name="email"
                type="email"
                placeholder="john@company.com"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-slate-200 px-5 py-4 streamline-none focus:border-black transition-all text-xs font-bold text-slate-800 placeholder:text-slate-300 bg-slate-50 rounded-xl focus:bg-white"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5 group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 transition-colors group-focus-within:text-black">
                Secure Phone Node (10 Digits)
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-slate-200 px-5 py-4 streamline-none focus:border-black transition-all text-xs font-bold text-slate-800 placeholder:text-slate-300 bg-slate-50 rounded-xl focus:bg-white"
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] mt-8 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none shadow-md animate-pulse-none"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <>Generate System Credentials <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          {/* Redirection Link Strip */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-400 text-xs">Already have terminal access?</span> 
            <Link href="/login" className={`${passero.className} text-blue-600 text-2xl hover:text-blue-700 transition-colors`}>
              Log in here
            </Link>
          </div>
        </div>

        {/* System Footprints */}
        <div className="flex gap-8 text-[9px] text-slate-400 uppercase tracking-[0.3em] font-bold">
          <span>Auth_v2.4</span>
          <span>DTS_Secure_Core</span>
        </div>
      </div>
    </div>
  );
}