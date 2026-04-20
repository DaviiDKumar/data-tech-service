// No "use client" here — this stays a server component
// It simply wraps LoginForm in Suspense to handle useSearchParams safely

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginForm from './loginform'; // import client component from same folder

export default function LoginPage() {
  return (
    // Suspense is required because LoginForm uses useSearchParams()
    // Without this, Next.js build will fail during static page generation
    <Suspense fallback={
      // Fallback shown while LoginForm is loading on client
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}