import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const patchSchema = z.object({
  mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]).optional(),
  name: z.string().min(1).optional(),
  calories: z.number().int().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const existing = await prisma.foodLog.findFirst({
    where: { id: params.id, userId: auth.userId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const updated = await prisma.foodLog.update({
    where: { id: params.id },
    data: parsed.data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const existing = await prisma.foodLog.findFirst({
    where: { id: params.id, userId: auth.userId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.foodLog.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
