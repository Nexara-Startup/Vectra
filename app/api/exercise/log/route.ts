import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const logSchema = z.object({
  workoutId: z.string().min(1),
  notes: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = logSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const workout = await prisma.workout.findFirst({
    where: { id: parsed.data.workoutId, userId: auth.userId },
  })
  if (!workout) return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  const log = await prisma.workoutLog.create({
    data: {
      userId: auth.userId,
      workoutId: parsed.data.workoutId,
      notes: parsed.data.notes ?? null,
    },
  })
  return NextResponse.json(log)
}
