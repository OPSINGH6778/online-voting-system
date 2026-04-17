import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function verifySessionEdge(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const parts = decoded.split('.');
    if (parts.length < 3) return null;
    const userId = parts[0];
    if (!/^[a-f\d]{24}$/i.test(userId)) return null;
    return userId;
  } catch { return null; }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  // Public pages
  const publicPages = ['/', '/login', '/signup', '/admin-login', '/forgot-password', '/reset-password'];
  const isPublicPage = publicPages.some(p => pathname === p || pathname.startsWith(p + '?'));

  // Public API routes (auth + captcha + vote verification)
  const isPublicAPI = pathname.startsWith('/api/auth/') ||
    pathname === '/api/captcha' ||
    pathname.startsWith('/api/votes/verify');

  if (isPublicPage || isPublicAPI) return NextResponse.next();

  // Session check
  const session = request.cookies.get('session');
  if (!session?.value) {
    const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
    return NextResponse.redirect(new URL(isAdmin ? '/admin-login' : '/login', request.url));
  }

  const userId = verifySessionEdge(session.value);
  if (!userId) {
    const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
    const res = NextResponse.redirect(new URL(isAdmin ? '/admin-login' : '/login', request.url));
    res.cookies.set('session', '', { maxAge: 0, path: '/' });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
