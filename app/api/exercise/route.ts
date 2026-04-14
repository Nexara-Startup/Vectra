import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const exerciseSchema = z.object({
  name: z.string(),
  sets: z.number().int().positive(),
  reps: z.string(),
  order: z.number().int(),
})

const workoutSchema = z.object({
  name: z.string().min(1).max(120),
  exercises: z.array(exerciseSchema).min(1),
})

export async function GET() {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const workouts = await prisma.workout.findMany({
    where: { userId: auth.userId },
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  })
  const logs = await prisma.workoutLog.findMany({
    where: { userId: auth.userId },
    orderBy: { completedAt: "desc" },
    take: 60,
    include: { workout: true },
  })
  return NextResponse.json({ workouts, logs })
}

export async function POST(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = workoutSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const w = await prisma.workout.create({
    data: {
      userId: auth.userId,
      name: parsed.data.name,
      exercises: {
        create: parsed.data.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          order: e.order,
        })),
      },
    },
    include: { exercises: { orderBy: { order: "asc" } } },
  })
  return NextResponse.json(w)
}
