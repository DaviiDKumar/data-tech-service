import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// Helper to force a minimum loading time
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function AuthHandler() {
  // 1. Start fetching cookies and wait for our minimum delay
  const [cookieStore] = await Promise.all([
    cookies(),
    delay(5000) // Change this to 800 or 1000 if 1500 feels too slow
  ]);

  const role = cookieStore.get('role')?.value;

  // 2. Perform the logic after the delay
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
    // Note: 'loading.js' automatically acts as the fallback for the page.
    // We use a Server Component with an 'await' to trigger the loading state.
    <AuthHandler />
  );
}