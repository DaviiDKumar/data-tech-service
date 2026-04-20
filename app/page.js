import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  // 1. Cookies fetch karna (Ye Server-side par ho raha hai)
  const cookieStore = await cookies();
  
  // HttpOnly cookies ko server aaram se read kar sakta hai
  const role = cookieStore.get('role')?.value;

  // 2. Agar login nahi hai, toh Login page par bhej do
  if (!role) {
    redirect('/login');
  }

  // 3. Role-Based Redirection logic
  if (role === 'admin') {
    // Admin ko uske control center bhejenge
    redirect('/admin');
  } else if (role === 'user') {
    // Normal operator/user ko uske workspace dashboard par
    redirect('/user');
  } else {
    // Agar role unrecognized hai, toh safety ke liye login
    redirect('/login');
  }
}