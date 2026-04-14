import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Edge-safe gate: Auth.js v5 default middleware pulls `jose` paths that use
 * `CompressionStream`, which can crash Vercel Edge (MIDDLEWARE_INVOCATION_FAILED).
 * We only check for session cookies here; `auth()` in the app layout validates JWT.
 *
 * Cookie names match @auth/core `defaultCookies` (secure prefix on HTTPS).
 */
function hasSessionCookie(request: NextRequest): boolean {
  for (const { name, value } of request.cookies.getAll()) {
    if (!value) continue
    if (
      name === "__Secure-authjs.session-token" ||
      name === "authjs.session-token" ||
      name.startsWith("__Secure-authjs.session-token.") ||
      name.startsWith("authjs.session-token.")
    ) {
      return true
    }
    // Legacy NextAuth v4 cookie names (if any session still uses them)
    if (
      name === "__Secure-next-auth.session-token" ||
      name === "next-auth.session-token" ||
      name.startsWith("__Secure-next-auth.session-token.") ||
      name.startsWith("next-auth.session-token.")
    ) {
      return true
    }
  }
  return false
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith("/login") || path.startsWith("/api/auth")) {
    return NextResponse.next()
  }
  if (
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    path === "/manifest.json" ||
    path.startsWith("/icons") ||
    path === "/sw.js" ||
    path.startsWith("/workbox")
  ) {
    return NextResponse.next()
  }
  if (/\.(?:svg|png|jpg|jpeg|gif|webp)$/i.test(path)) {
    return NextResponse.next()
  }

  if (!hasSessionCookie(request)) {
    const signIn = new URL("/login", request.url)
    signIn.searchParams.set("callbackUrl", request.nextUrl.href)
    return NextResponse.redirect(signIn)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|icons|sw\\.js|workbox|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
