/**
 * Shared auth-related environment reads for NextAuth / Google OAuth.
 */

/** Empty strings in env UIs count as set but break Auth.js `secret.length` checks. */
export function resolveAuthSecret(): string | undefined {
  const s = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  return s || undefined
}

/**
 * Base URL for OAuth redirect URIs (e.g. Google Calendar token refresh).
 * Prefer explicit AUTH_URL / NEXTAUTH_URL (required for custom domains on Vercel).
 * On Vercel, `VERCEL_URL` is set per deployment so previews work without extra env.
 */
export function getAuthBaseUrl(): string {
  const explicit = process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, "")

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")
    return `https://${host}`
  }

  return "http://localhost:3000"
}

/** Shared dev password — only honored in local `next dev` (not Vercel production). */
export function isEmailDevLoginEnabled(): boolean {
  return Boolean(process.env.AUTH_DEV_PASSWORD?.trim()) && process.env.NODE_ENV !== "production"
}
