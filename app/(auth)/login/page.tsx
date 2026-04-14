import { LoginForm } from "./LoginForm"
import { isEmailDevLoginEnabled } from "@/lib/auth-env"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  const isLocalDev = process.env.NODE_ENV === "development"
  const emailCredentialsActive = isEmailDevLoginEnabled()
  const googleAuthConfigured =
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim())

  return (
    <LoginForm
      googleAuthConfigured={googleAuthConfigured}
      emailCredentialsActive={emailCredentialsActive}
      showEmailLoginFields={isLocalDev}
    />
  )
}
