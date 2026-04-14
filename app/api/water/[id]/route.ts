import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireSessionUserId } from "@/lib/api-auth"

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSessionUserId()
  if ("response" in auth) return auth.response
  const log = await prisma.waterLog.findFirst({
    where: { id: params.id, userId: auth.userId },
  })
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.waterLog.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
