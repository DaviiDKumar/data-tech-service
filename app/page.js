import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Helper to force a fast, optimal loading state delay window
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function AuthHandler() {
  // Wait for an optimal execution block (~1 second) instead of a heavy 5-second lock
  const [cookieStore] = await Promise.all([
    cookies(),
    delay(3000) 
  ]);

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
  return <AuthHandler />;
}