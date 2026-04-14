import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const logSchema = z.object({
  mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
  name: z.string().min(1),
  calories: z.number().int().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
})

const goalsSchema = z.object({
  calorieGoal: z.number().int().positive().optional(),
  proteinGoal: z.number().int().positive().optional(),
})

export async function GET(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const logs = await prisma.foodLog.findMany({
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
    select: { calorieGoal: true, proteinGoal: true },
  })
  return NextResponse.json({
    logs,
    calorieGoal: user?.calorieGoal ?? 2000,
    proteinGoal: user?.proteinGoal ?? 150,
  })
}

export async function POST(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = logSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const log = await prisma.foodLog.create({
    data: { userId: auth.userId, ...parsed.data },
  })
  return NextResponse.json(log)
}

export async function PATCH(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = goalsSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      ...(parsed.data.calorieGoal !== undefined
        ? { calorieGoal: parsed.data.calorieGoal }
        : {}),
      ...(parsed.data.proteinGoal !== undefined
        ? { proteinGoal: parsed.data.proteinGoal }
        : {}),
    },
  })
  return NextResponse.json({ ok: true })
}
