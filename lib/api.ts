import { API_URL } from '@/lib/auth/config';

/**
 * Talking to the SermonFlow backend (sermon-flow-backend on the ChristChurch
 * Server). Every call carries the signed-in user's Cognito access token, which
 * the page gets from /auth/token — the session cookies themselves are httpOnly.
 */

/** Refetch this long before the token actually expires. */
const EXPIRY_MARGIN_MS = 60_000;

let cached: { token: string; expiresAt: number } | null = null;
let inFlight: Promise<string | null> | null = null;

export async function getAccessToken(): Promise<string | null> {
  if (cached && cached.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return cached.token;
  // Many verse lookups start at once; they share one /auth/token request.
  inFlight ??= fetch('/auth/token', { cache: 'no-store', credentials: 'same-origin' })
    .then(async (response) => {
      if (!response.ok) return null;
      const { accessToken, expiresAt } = await response.json();
      cached = { token: accessToken, expiresAt: expiresAt || Date.now() + 5 * 60_000 };
      return accessToken as string;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Drop the cached token, e.g. on sign-out. */
export function forgetAccessToken() {
  cached = null;
}

/** fetch() against the backend, with the bearer token attached. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  // A rejected token is stale — make the next call fetch a fresh one.
  if (response.status === 401) forgetAccessToken();
  return response;
}

/** The backend's error message from a failed response, whichever key it used. */
export async function apiError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) return 'Your session has ended. Log in again to keep detecting.';
  return body.error || body.detail || `Request failed (${response.status})`;
}

/** WebSocket URL for live transcription. */
export function transcribeSocketUrl(): string {
  return `${API_URL.replace(/^http/, 'ws')}/api/v1/transcribe`;
}
