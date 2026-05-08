import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// REMOVED: export const dynamic = 'force-dynamic'; 

async function AuthHandler() {
  const cookieStore = await cookies();
  const role = cookieStore.get('role')?.value;

  if (!role) redirect('/login');
  
  if (role === 'admin') {
    redirect('/admin');
  } else if (role === 'user') {
    redirect('/user');
  } else {
    redirect('/login');
  }

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <AuthHandler />
    </Suspense>
  );
}