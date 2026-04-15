import type { NextAuthConfig } from "next-auth"

/**
 * Shared auth callbacks. Route protection runs in `middleware.ts` (Edge-safe
 * cookie check) and `app/(app)/layout.tsx` (`auth()` / JWT on Node).
 * Providers are registered in `auth.ts` (Node).
 */
export const authConfig = {
  trustHost: true,
  /** Send OAuth errors (e.g. AccessDenied) to our login page with ?error=… */
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
} satisfies NextAuthConfig
