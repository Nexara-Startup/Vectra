import type { NextRequest } from "next/server"
import { handlers } from "@/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const { GET: authGET, POST: authPOST } = handlers

export async function GET(req: NextRequest) {
  try {
    return await authGET(req)
  } catch (err) {
    console.error("[api/auth GET]", err)
    throw err
  }
}

export async function POST(req: NextRequest) {
  try {
    return await authPOST(req)
  } catch (err) {
    console.error("[api/auth POST]", err)
    throw err
  }
}
