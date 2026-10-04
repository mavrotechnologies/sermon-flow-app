import { NextResponse, type NextRequest } from 'next/server';
import { refresh } from '@/lib/auth/cognito';
import {
  ID_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  userFromIdToken,
  writeSessionCookies,
} from '@/lib/auth/session';

/**
 * Keeps the Cognito session fresh, gates the signed-in app, and bounces
 * signed-in visitors away from the auth screens.
 *
 * The ID and access tokens last an hour. When the ID token has expired but the
 * 30-day refresh token is still there, new tokens are minted here and written
 * both to the response (for the browser) and to the request (so the page being
 * rendered sees them).
 *
 * `/admin` (Account Home) and `/admin/session` (the live room) require an
 * account; visitors are sent to /login with a `next` param. app/admin/layout.tsx
 * repeats the check as a backstop.
 */
export async function proxy(request: NextRequest) {
  let user = await userFromIdToken(request.cookies.get(ID_COOKIE)?.value);
  let refreshed: Awaited<ReturnType<typeof refresh>> | null = null;
  let refreshFailed = false;

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!user && refreshToken) {
    try {
      refreshed = await refresh(refreshToken);
      // Request cookies take no options — only the page being rendered reads these.
      writeSessionCookies({ set: (name: string, value: string) => request.cookies.set(name, value) }, refreshed);
      user = await userFromIdToken(refreshed.idToken);
    } catch {
      // Revoked or expired refresh token: treat as signed out and drop the cookies.
      refreshFailed = true;
    }
  }

  const finish = (response: NextResponse) => {
    if (refreshed) writeSessionCookies(response.cookies, refreshed);
    if (refreshFailed) clearSessionCookies(response.cookies);
    return response;
  };

  const { pathname } = request.nextUrl;
  const isSignedInApp = pathname === '/admin' || pathname.startsWith('/admin/');

  if (!user && isSignedInApp) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', pathname);
    return finish(NextResponse.redirect(url));
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return finish(NextResponse.redirect(url));
  }

  return finish(NextResponse.next({ request }));
}

export const config = {
  matcher: ['/', '/admin', '/admin/:path*', '/login', '/register', '/auth/token'],
};
