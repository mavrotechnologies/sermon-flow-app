import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID } from './config';
import type { Tokens } from './cognito';

/**
 * The session is three httpOnly cookies holding the Cognito tokens:
 *
 * - `sf_id`      — who you are (name, email, church); read by the server pages.
 * - `sf_access`  — what the SermonFlow backend checks. The browser fetches it
 *                  from `/auth/token` when it needs to call the backend.
 * - `sf_refresh` — 30 days; proxy.ts uses it to mint new tokens when the
 *                  hour-long ones expire.
 *
 * None are readable by page scripts, so an injected script can't lift the
 * refresh token.
 */
export const ID_COOKIE = 'sf_id';
export const ACCESS_COOKIE = 'sf_access';
export const REFRESH_COOKIE = 'sf_refresh';

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  churchName: string | null;
}

// Module scope, so the pool's signing keys are fetched once per server process.
const idVerifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USER_POOL_ID,
  clientId: COGNITO_CLIENT_ID,
  tokenUse: 'id',
});

/** The user an ID token belongs to, or null if it's missing, forged or expired. */
export async function userFromIdToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const claims = await idVerifier.verify(token);
    const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
    return {
      id: claims.sub,
      email: text(claims.email),
      name: text(claims.name),
      churchName: text(claims['custom:church_name']),
    };
  } catch {
    return null;
  }
}

interface CookieWriter {
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
}

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function writeSessionCookies(cookies: CookieWriter, tokens: Tokens) {
  cookies.set(ID_COOKIE, tokens.idToken, { ...baseCookie, maxAge: tokens.expiresIn });
  cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...baseCookie, maxAge: tokens.expiresIn });
  if (tokens.refreshToken) {
    cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...baseCookie, maxAge: REFRESH_MAX_AGE });
  }
}

export function clearSessionCookies(cookies: CookieWriter) {
  for (const name of [ID_COOKIE, ACCESS_COOKIE, REFRESH_COOKIE]) {
    cookies.set(name, '', { ...baseCookie, maxAge: 0 });
  }
}
