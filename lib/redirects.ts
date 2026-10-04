/**
 * Only allow same-origin relative paths as post-auth redirect targets, so a
 * `next` query param can't be used to bounce someone off-site.
 */
export function safeInternalPath(value: string | null | undefined, fallback = '/admin'): string {
  if (!value) return fallback;
  // Reject protocol-relative ("//evil.com") and absolute URLs.
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
