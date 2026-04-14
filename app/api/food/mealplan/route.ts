import { NextResponse } from "next/server"
import { z } from "zod"
import { startOfWeek } from "date-fns"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const mealSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
})

const daySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  meals: z.record(z.string(), z.array(mealSchema)),
})

const bodySchema = z.object({
  weekOf: z.string().datetime(),
  days: z.array(daySchema),
})

export async function GET(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const { searchParams } = new URL(req.url)
  const week = searchParams.get("weekOf")
  const weekOf = week ? new Date(week) : startOfWeek(new Date(), { weekStartsOn: 1 })
  const plans = await prisma.mealPlan.findMany({
    where: { userId: auth.userId, weekOf },
    orderBy: { weekday: "asc" },
  })
  return NextResponse.json(plans)
}

export async function POST(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const weekOf = new Date(parsed.data.weekOf)
  await prisma.mealPlan.deleteMany({
    where: { userId: auth.userId, weekOf },
  })
  const created = await prisma.$transaction(
    parsed.data.days.map((d) =>
      prisma.mealPlan.create({
        data: {
          userId: auth.userId,
          weekday: d.weekday,
          meals: d.meals as object,
          weekOf,
        },
      }),
    ),
  )
  return NextResponse.json(created)
}
