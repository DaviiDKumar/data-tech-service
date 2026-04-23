"use client";

// ---- Imports ----
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginUser } from '@/app/actions/auth';
import Link from 'next/link';
import { Loader2, Terminal, Eye, EyeOff } from 'lucide-react';
import { passero, ubuntu, robotoSlab } from "@/lib/fonts";

// Inside your component:

// ---- Main Login Form Component ----

export default function LoginForm() {

  // ---- State ----
  const [loginId, setLoginId] = useState('');       // stores terminal ID input
  const [password, setPassword] = useState('');     // stores password input
  const [error, setError] = useState('');           // stores error message to display
  const [loading, setLoading] = useState(false);    // controls loading spinner on button

  // ---- Hooks ----
  const router = useRouter();                        // used to redirect after login
  const searchParams = useSearchParams();            // reads URL query params
  const message = searchParams.get('message');       // e.g. ?message=Registered successfully
  const [showPassword, setShowPassword] = useState(false);

  // ---- Handle Form Submission ----
  const handleSubmit = async (e) => {
    e.preventDefault();       // prevent page reload
    setLoading(true);         // show spinner
    setError('');             // clear any previous error

    try {
      // Build FormData to pass to server action
      const formData = new FormData();
      formData.append('loginId', loginId);
      formData.append('password', password);

      // Call the server action
      const res = await loginUser(formData);

      if (res.success) {
        // Redirect based on role — admin goes to /admin, others go to /user
        router.push(res.role === 'admin' ? '/admin' : '/user');
        router.refresh(); // refresh server components after navigation
      } else {
        // Show error returned from server
        setError(res.message || "Invalid credentials provided.");
      }
    } catch (err) {
      // Network or unexpected error
      setError("Server connection failed. Try again.");
    } finally {
      setLoading(false); // always stop spinner
    }
  };


  return (
    <div className={`min-h-screen min-w-screen grid lg:grid-cols-2 ${ubuntu.className} bg-white text-slate-900`}>

      {/* --- Left Side: Content & Form --- */}
      <div className="flex flex-col justify-between p-8 lg:p-16 max-w-xl mx-auto w-full">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
            <Terminal size={18} className="text-white" />
          </div>
        </div>

        <div className="w-full">
          {/* Roboto Slab Heading */}
          <h1 className={`${robotoSlab.className} text-4xl lg:text-5xl font-medium tracking-tight mb-3`}>
            Welcome back!
          </h1>
          <p className="text-slate-500 mb-10 text-sm">
            Access your secure terminal and data processing tools.
          </p>

          {/* Error/Success Notifications */}
          <div className="min-h-10">
            {error && <p className="text-red-500 text-xs font-bold mb-4">!! {error}</p>}
            {message && <p className="text-emerald-500 text-xs font-bold mb-4">{message}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Terminal ID */}
            <div className="space-y-1 group">
              {/* Label: Using Ubuntu font, bold, and aligned with input text */}
              <label className={`${ubuntu.className} block text-[11px] font-bold  tracking-widest text-slate-500 ml-3 transition-colors group-focus-within:text-slate-700 `}>
                LoginID
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="DTS_ADMIN_01"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  /* Balanced padding and border logic to match the password field */
                  className="w-full border border-slate-300 px-3 py-3 outline-none focus:border-slate-400 transition-all text-sm placeholder:text-slate-300 text-slate-500 bg-transparent rounded-2xl"
                />
              </div>
            </div>

            {/* Password with Toggle */}
            <div className="space-y-1 relative group">
              {/* Label: Aligned with the input padding and colored to match the theme */}
              <label className={`${ubuntu.className} block text-[11px] font-bold  tracking-widest text-slate-500 ml-3 transition-colors group-focus-within:text-slate-700 rounded-2xl `}>
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-3 outline-none focus:border-slate-400 transition-all text-sm text-slate-500 placeholder:text-slate-300 rounded-2xl"
                />

                {/* Eye Toggle: Positioned perfectly at the end of the line */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 bottom-2 p-1 text-slate-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-full font-bold text-sm mt-8 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign in to Dashboard"}
            </button>
          </form>

          {/* Passero One Link */}
          <div className="mt-12 pt-6 border-t border-slate-100">
            <p className="text-slate-400 text-sm flex items-center gap-2">
              {/* Standard Ubuntu text */}
              Don&apos;t have an account?

              {/* Stylized Passero link */}
              <Link
                href="/register"
                className={`${passero.className} text-blue-600 text-xl hover:text-blue-700 hover:underline underline-offset-4 transition-colors tracking-wide`}
              >
                Create here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex gap-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <button>Help</button>
          <button>Terms</button>
          <button>Privacy</button>
        </div>
      </div>

      {/* --- Right Side: The Graphic (Hidden on mobile) --- */}
      <div className="hidden lg:block bg-[#f3f3f3] relative overflow-hidden">
        {/* You can replace this div with an actual <img> or a patterned canvas */}
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
            backgroundColor: '#111'
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-white/20 font-black text-9xl select-none">DTS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
