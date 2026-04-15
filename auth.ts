import NextAuth from "next-auth"
import type { Account, User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { authConfig } from "@/auth.config"
import { isEmailDevLoginEnabled, resolveAuthSecret } from "@/lib/auth-env"
import prisma from "@/lib/prisma"

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim())

function normalizeExpiresAt(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value)
  if (typeof value === "bigint") return Number(value)
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}

async function persistGoogleUser(user: User, account: Account) {
  const email = user.email?.trim().toLowerCase()
  if (!email) throw new Error("Google sign-in returned no email")
  if (!account.provider?.trim()) throw new Error("Google account missing provider")
  if (!account.providerAccountId?.trim()) throw new Error("Google account missing subject (providerAccountId)")

  const expiresAt = normalizeExpiresAt(account.expires_at)
  const sessionState =
    account.session_state != null ? String(account.session_state) : null

  await prisma.$transaction(async (tx) => {
    const dbUser = await tx.user.upsert({
      where: { email },
      create: {
        email,
        name: user.name ?? email.split("@")[0] ?? "User",
        image: user.image ?? null,
      },
      update: {
        name: user.name ?? undefined,
        image: user.image ?? undefined,
      },
    })

    await tx.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      create: {
        userId: dbUser.id,
        type: account.type ?? "oidc",
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token ?? null,
        access_token: account.access_token ?? null,
        expires_at: expiresAt,
        token_type: account.token_type ?? null,
        scope: account.scope ?? null,
        id_token: account.id_token ?? null,
        session_state: sessionState,
      },
      update: {
        userId: dbUser.id,
        refresh_token: account.refresh_token ?? undefined,
        access_token: account.access_token ?? undefined,
        expires_at: expiresAt ?? undefined,
        token_type: account.token_type ?? undefined,
        scope: account.scope ?? undefined,
        id_token: account.id_token ?? undefined,
        session_state: sessionState ?? undefined,
      },
    })
  })
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: resolveAuthSecret(),
  session: { strategy: "jwt" },
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(isEmailDevLoginEnabled()
      ? [
          Credentials({
            id: "credentials",
            name: "Email",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              const email = credentials?.email as string | undefined
              const password = credentials?.password as string | undefined
              if (!email?.trim()) return null

              const expected = process.env.AUTH_DEV_PASSWORD?.trim()
              if (!expected || password !== expected) return null

              const normalized = email.trim().toLowerCase()
              let user = await prisma.user.findUnique({ where: { email: normalized } })
              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email: normalized,
                    name: normalized.split("@")[0] || "User",
                  },
                })
              }
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              }
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true
      if (!user?.email?.trim()) return false
      if (!account.providerAccountId?.trim()) return false
      try {
        await persistGoogleUser(user, account as Account)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error("[auth] Google persist failed:", msg, e)
        return false
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google" && user.email?.trim()) {
        const email = user.email.trim().toLowerCase()
        const dbUser = await prisma.user.findUnique({ where: { email } })
        if (dbUser) {
          token.sub = dbUser.id
        } else {
          console.error("[auth] jwt: no DB user after Google signIn for", email)
        }
        return token
      }
      if (user?.id) {
        token.sub = user.id
      }
      return token
    },
  },
})
