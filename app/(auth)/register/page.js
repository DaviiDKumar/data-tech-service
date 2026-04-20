"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions/auth';
import Link from 'next/link';
import { Loader2, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
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
        // 3 second baad login page par bhej denge success message ke saath
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
      <div className="text-center animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase italic">Request Sent!</h2>
        <p className="text-slate-500 mt-2 text-sm font-medium">
          Check your email for login credentials. <br/> Redirecting to terminal...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/20 mb-6 group-hover:bg-blue-600 transition-all">
          <UserPlus className="text-white w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">
          Join <span className="text-blue-600">DTS</span>
        </h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
          Request Secure Workspace Access
        </p>
      </div>

      {/* Error Alert */}
      <div className="min-h-12.5">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-2xl border border-rose-100 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Full Name</label>
          <input 
            name="name"
            type="text" 
            placeholder="John Doe" 
            required 
            className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-bold text-slate-900"
            onChange={handleChange}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Email Address</label>
          <input 
            name="email"
            type="email" 
            placeholder="john@company.com" 
            required 
            className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-bold text-slate-900"
            onChange={handleChange}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Phone Number</label>
          <input 
            name="phone"
            type="tel" 
            placeholder="9876543210" 
            required 
            className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-bold text-slate-900"
            onChange={handleChange}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Processing...
            </>
          ) : (
            <>
              Generate Credentials
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-10 text-center">
        <Link 
          href="/login" 
          className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-blue-600 transition-all"
        >
          Already have access? <span className="text-blue-600 underline underline-offset-4">Log in here</span>
        </Link>
      </div>
    </div>
  );
}