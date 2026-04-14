import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  tags: z.array(z.string()).optional(),
})

export async function GET() {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const entries = await prisma.journal.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(entries)
}

export async function POST(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const entry = await prisma.journal.create({
    data: {
      userId: auth.userId,
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags ?? [],
    },
  })
  return NextResponse.json(entry)
}
