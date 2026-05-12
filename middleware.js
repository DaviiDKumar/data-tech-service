import { NextResponse } from 'next/server';

export function middleware(request) {
  // 1. Get cookies from the browser
  const role = request.cookies.get('role')?.value;
  const userId = request.cookies.get('userId')?.value;
  const { pathname } = request.nextUrl;

  // 2. If trying to access dashboard but NOT logged in -> Redirect to Login
  if (!userId && (pathname.startsWith('/admin') || pathname.startsWith('/user'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Admin Protection: If role is NOT admin, block /admin routes
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      // Send them to their own user dashboard if they try to sneak into admin
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  // 4. User Protection: If role is NOT user, block /user routes
  if (pathname.startsWith('/user')) {
    if (role !== 'user') {
      // Send them to admin dashboard if they are an admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

// 5. Tell Next.js which routes to run this on
export const config = {
  matcher: [
    '/admin/:path*', 
    '/user/:path*',
  ],
};