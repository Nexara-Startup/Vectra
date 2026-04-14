import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const existing = await prisma.journal.findFirst({
    where: { id: params.id, userId: auth.userId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const updated = await prisma.journal.update({
    where: { id: params.id },
    data: parsed.data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const existing = await prisma.journal.findFirst({
    where: { id: params.id, userId: auth.userId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.journal.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
