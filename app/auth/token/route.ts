import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ACCESS_COOKIE } from '@/lib/auth/session';

/**
 * Hands the page the Cognito access token it needs to call the SermonFlow
 * backend. The session cookies are httpOnly, so this is the one way a script
 * gets a token — and it only ever gets the short-lived access token, never the
 * refresh token. proxy.ts has refreshed an expired one before this runs.
 */
export async function GET() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  let expiresAt = 0;
  try {
    expiresAt = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).exp * 1000;
  } catch {
    // Unreadable token: let the backend reject it.
  }

  return NextResponse.json({ accessToken: token, expiresAt }, { headers: { 'Cache-Control': 'no-store' } });
}
