import { NextResponse } from 'next/server';

// Renamed from 'middleware' to 'proxy' for Next.js 16 compatibility
export function proxy(request) {
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
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  // 4. User Protection: If role is NOT user, block /user routes
  if (pathname.startsWith('/user')) {
    if (role !== 'user') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

// The config remains the same, ensuring this logic only runs on protected routes
export const config = {
  matcher: [
    '/admin/:path*', 
    '/user/:path*',
  ],
};