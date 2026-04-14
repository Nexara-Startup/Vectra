import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const logSchema = z.object({
  amount: z.number().int().positive(),
})

const goalSchema = z.object({
  waterGoal: z.number().int().positive().max(256),
})

export async function GET(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const logs = await prisma.waterLog.findMany({
    where: {
      userId: auth.userId,
      ...(from && to
        ? { loggedAt: { gte: new Date(from), lte: new Date(to) } }
        : {}),
    },
    orderBy: { loggedAt: "desc" },
  })
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { waterGoal: true },
  })
  return NextResponse.json({ logs, waterGoal: user?.waterGoal ?? 64 })
}

export async function POST(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = logSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const log = await prisma.waterLog.create({
    data: { userId: auth.userId, amount: parsed.data.amount },
  })
  return NextResponse.json(log)
}

export async function PATCH(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = goalSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  await prisma.user.update({
    where: { id: auth.userId },
    data: { waterGoal: parsed.data.waterGoal },
  })
  return NextResponse.json({ ok: true, waterGoal: parsed.data.waterGoal })
}
