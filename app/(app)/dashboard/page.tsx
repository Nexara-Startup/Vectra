import { auth } from "@/auth"
import { DashboardClient } from "@/components/dashboard/DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  return <DashboardClient defaultName={session?.user?.name ?? null} />
}
