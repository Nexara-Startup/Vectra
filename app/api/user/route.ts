import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const patchSchema = z.object({
  waterGoal: z.number().int().positive().max(256).optional(),
  calorieGoal: z.number().int().positive().optional(),
  proteinGoal: z.number().int().positive().optional(),
})

export async function GET() {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      waterGoal: true,
      calorieGoal: true,
      proteinGoal: true,
    },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: parsed.data,
  })
  return NextResponse.json(user)
}
