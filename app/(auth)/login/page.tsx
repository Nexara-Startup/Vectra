import { LoginForm } from "./LoginForm"
import { isEmailDevLoginEnabled } from "@/lib/auth-env"

export const dynamic = "force-dynamic"

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string | string[] }
}) {
  const isLocalDev = process.env.NODE_ENV === "development"
  const emailCredentialsActive = isEmailDevLoginEnabled()
  const googleAuthConfigured =
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim())

  const raw = searchParams.error
  const authError = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined

  return (
    <LoginForm
      googleAuthConfigured={googleAuthConfigured}
      emailCredentialsActive={emailCredentialsActive}
      showEmailLoginFields={isLocalDev}
      authError={authError}
    />
  )
}
