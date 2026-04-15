import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/** Vercel / copy-paste: trim, BOM, mistaken `DATABASE_URL=` prefix, wrapping quotes. */
function normalizeConnectionUrl(raw: string | undefined, envName: string): string | undefined {
  if (raw == null) return undefined
  let s = raw.trim().replace(/^\uFEFF/, "")
  const prefixed = new RegExp(`^${envName}\\s*=\\s*`, "i")
  s = s.replace(prefixed, "")
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }
  return s || undefined
}

const databaseUrl = normalizeConnectionUrl(process.env.DATABASE_URL, "DATABASE_URL")

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
