import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function requireSessionUserId(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { userId: id }
}
