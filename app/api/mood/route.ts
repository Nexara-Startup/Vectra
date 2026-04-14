import { NextResponse } from "next/server"
import { z } from "zod"
import { startOfDay, endOfDay } from "date-fns"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const createSchema = z.object({
  value: z.number().int().min(1).max(5),
  label: z.string().min(1),
  note: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
})

export async function GET(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const moods = await prisma.mood.findMany({
    where: {
      userId: auth.userId,
      ...(from && to
        ? { date: { gte: new Date(from), lte: new Date(to) } }
        : {}),
    },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(moods)
}

export async function POST(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const day = parsed.data.date ? new Date(parsed.data.date) : new Date()
  const start = startOfDay(day)
  const end = endOfDay(day)
  const existing = await prisma.mood.findFirst({
    where: { userId: auth.userId, date: { gte: start, lte: end } },
  })
  if (existing) {
    const updated = await prisma.mood.update({
      where: { id: existing.id },
      data: {
        value: parsed.data.value,
        label: parsed.data.label,
        note: parsed.data.note ?? null,
        date: day,
      },
    })
    return NextResponse.json(updated)
  }
  const created = await prisma.mood.create({
    data: {
      userId: auth.userId,
      value: parsed.data.value,
      label: parsed.data.label,
      note: parsed.data.note ?? null,
      date: day,
    },
  })
  return NextResponse.json(created)
}
