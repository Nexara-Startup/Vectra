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

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  exercises: z.array(exerciseSchema).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const existing = await prisma.workout.findFirst({
    where: { id: params.id, userId: auth.userId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (parsed.data.exercises) {
    await prisma.workoutExercise.deleteMany({ where: { workoutId: params.id } })
  }

  const updated = await prisma.workout.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name,
      ...(parsed.data.exercises
        ? {
            exercises: {
              create: parsed.data.exercises.map((e) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                order: e.order,
              })),
            },
          }
        : {}),
    },
    include: { exercises: { orderBy: { order: "asc" } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const existing = await prisma.workout.findFirst({
    where: { id: params.id, userId: auth.userId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.workout.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
