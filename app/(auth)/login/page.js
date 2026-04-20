"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginUser } from '@/app/actions/auth'; 
import Link from 'next/link';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

// 1. Logic Component
function LoginForm() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  useEffect(() => {
    if (error) setError('');
  }, [loginId, password, error]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('loginId', loginId);
      formData.append('password', password);

      const res = await loginUser(formData);

      if (res.success) {
        router.push(res.role === 'admin' ? '/admin' : '/user');
        router.refresh();
      } else {
        setError(res.message || "Invalid credentials provided.");
      }
    } catch (err) {
      setError("Server connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-3xl shadow-xl shadow-blue-500/20 mb-6">
          <ShieldCheck className="text-white w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">
          Data<span className="text-blue-600">Sort</span>
        </h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">
          Secure Terminal Access
        </p>
      </div>

      <div className="min-h-15">
        {message && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-100 flex items-center gap-3">
            <span className="shrink-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-xs font-bold rounded-2xl border border-rose-100 flex items-center gap-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">
            Terminal ID
          </label>
          <input 
            type="text" 
            placeholder="DTS_XXXXXXXXXXXX" 
            required 
            value={loginId}
            className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-bold text-slate-900"
            onChange={(e) => setLoginId(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">
            Access Key
          </label>
          <input 
            type="password" 
            placeholder="••••••••" 
            required 
            value={password}
            className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-bold text-slate-900"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Authenticating...
            </>
          ) : (
            "Establish Connection"
          )}
        </button>
      </form>

      <div className="mt-12 text-center">
        <Link 
          href="/register" 
          className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-blue-600 transition-all"
        >
          Don&apos;t have credentials? <span className="text-blue-600 underline underline-offset-4">Register here</span>
        </Link>
      </div>
    </div>
  );
}

// 2. Final Export with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}