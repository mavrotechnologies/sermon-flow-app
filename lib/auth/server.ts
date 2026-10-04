import 'server-only';
import { cookies } from 'next/headers';
import { ID_COOKIE, userFromIdToken, type SessionUser } from './session';

/** The signed-in user, or null. proxy.ts has already refreshed an expired session. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return userFromIdToken(store.get(ID_COOKIE)?.value);
}
