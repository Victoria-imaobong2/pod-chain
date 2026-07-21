// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes per role
  if (pathname.startsWith('/dashboard') && userRole !== 'sender') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/scan') && userRole !== 'courier') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/scan/:path*', '/receiver/:path*'],
};