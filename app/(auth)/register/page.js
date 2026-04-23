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
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);

      const res = await registerUser(data);

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login?message=Credentials sent to your email!');
        }, 3000);
      } else {
        setError(res.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-white ${ubuntu.className} p-6`}>
        <div className="text-center animate-in fade-in zoom-in duration-500 max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black text-white rounded-full mb-8 shadow-2xl">
            <CheckCircle2 size={40} />
          </div>
          <h2 className={`${robotoSlab.className} text-3xl font-medium text-slate-900 mb-4 uppercase`}>Request Sent!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Check your email for login credentials. <br/> Redirecting to terminal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen grid lg:grid-cols-2 ${ubuntu.className} bg-white text-slate-900`}>
      
      {/* --- Left Side: Artistic/Monochrome Graphic --- */}
      <div className="hidden lg:flex bg-[#09090b] relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center">
          <Shield className="text-white w-24 h-24 mx-auto mb-6 opacity-20" />
          <h2 className={`${robotoSlab.className} text-white text-4xl opacity-10 tracking-widest uppercase`}>
            Secure Gateway
          </h2>
        </div>
      </div>

      {/* --- Right Side: Registration Form --- */}
      <div className="flex flex-col justify-between p-8 lg:p-16 w-full max-w-xl mx-auto">
        
        {/* Logo/Icon */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <UserPlus size={20} className="text-black" />
          </div>
        </div>

        <div className="w-full py-12">
          <h1 className={`${robotoSlab.className} text-4xl font-medium tracking-tight mb-3`}>
            Join DTS
          </h1>
          <p className="text-slate-500 mb-10 text-sm">
            Complete the form to request secure workspace access.
          </p>

          {/* Error Message */}
          <div className="min-h-10">
            {error && (
              <p className="text-rose-600 text-xs font-bold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                {error}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Full Name */}
            <div className="space-y-1 group">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-3 group-focus-within:text-black transition-colors">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                required
                onChange={handleChange}
                className="w-full border-b border-slate-200 px-3 py-3 outline-none focus:border-black transition-all text-sm bg-transparent placeholder:text-slate-200"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1 group">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-3 group-focus-within:text-black transition-colors">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="john@company.com"
                required
                onChange={handleChange}
                className="w-full border-b border-slate-200 px-3 py-3 outline-none focus:border-black transition-all text-sm bg-transparent placeholder:text-slate-200"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1 group">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-3 group-focus-within:text-black transition-colors">
                Phone Number
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="9876543210"
                required
                onChange={handleChange}
                className="w-full border-b border-slate-200 px-3 py-3 outline-none focus:border-black transition-all text-sm bg-transparent placeholder:text-slate-200"
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] mt-10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>Generate Credentials <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Footer Link with Passero One */}
          <div className="mt-12 pt-6 border-t border-slate-100">
            <p className="text-slate-400 text-sm flex items-center gap-3">
              Already have access? 
              <Link href="/login" className={`${passero.className} text-blue-600 text-2xl hover:text-blue-700 transition-colors`}>
                Log in here
              </Link>
            </p>
          </div>
        </div>

        {/* System Labels */}
        <div className="flex gap-8 text-[9px] text-slate-300 uppercase tracking-[0.3em] font-bold">
          <span>Auth_v2.4</span>
          <span>DTS_Secure</span>
        </div>
      </div>
    </div>
  );
}