"use client"

import { useState, type SVGProps } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { VectraMark } from "@/components/icons/VectraMark"

export function LoginForm({
  googleAuthConfigured,
  emailCredentialsActive,
  showEmailLoginFields,
  authError,
}: {
  googleAuthConfigured: boolean
  /** Credentials provider is registered (local `next dev` + AUTH_DEV_PASSWORD). */
  emailCredentialsActive: boolean
  /** Show email/password inputs (local development only; production uses Google). */
  showEmailLoginFields: boolean
  /** Set by Auth.js when redirecting to `/login?error=…` (e.g. after Google OK but app denied). */
  authError?: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      toast.error("Invalid email or password.")
      return
    }
    toast.success("Signed in")
    router.push("/dashboard")
    router.refresh()
  }

  async function onGoogleSignIn() {
    setGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0f1117] px-4">
      <Card className="max-w-md w-full space-y-6 p-8">
        <div className="text-center">
          <h1 className="font-display flex flex-col items-center gap-3 text-4xl tracking-tight text-white">
            <VectraMark className="h-16 w-16 rounded-2xl shadow-lg" />
            Vectra
          </h1>
          {authError === "AccessDenied" ? (
            <div className="mt-4 rounded-xl border border-rose-500/35 bg-rose-500/10 p-4 text-left text-sm text-rose-100/95">
              <p className="font-medium text-rose-200">Sign-in did not finish</p>
              <p className="mt-2 text-xs leading-relaxed text-rose-100/85">
                Google worked, but the app could not save your account. This is usually the{" "}
                <strong className="font-medium text-rose-100">database</strong> on the server: wrong or
                missing <code className="rounded bg-black/30 px-1">DATABASE_URL</code>, tables not
                migrated, or Supabase not reachable from Vercel (use the{" "}
                <strong className="font-medium text-rose-100">pooler</strong> URL on port{" "}
                <code className="rounded bg-black/30 px-1">6543</code> with{" "}
                <code className="rounded bg-black/30 px-1">?pgbouncer=true</code>). Check Vercel
                function logs for{" "}
                <code className="rounded bg-black/30 px-1">[auth] Google persist failed</code>, fix
                env / run <code className="rounded bg-black/30 px-1">npx prisma migrate deploy</code>,
                then try again.
              </p>
            </div>
          ) : null}
          <p className="mt-2 text-sm text-zinc-400">
            {googleAuthConfigured && !showEmailLoginFields
              ? "Sign in with Google to continue."
              : googleAuthConfigured && showEmailLoginFields
                ? "Sign in with Google, or use email and dev password below."
                : "Sign in with your email and dev password. Add Google OAuth env vars to enable “Continue with Google.”"}
          </p>
        </div>

        {googleAuthConfigured ? (
          <>
            <Button
              type="button"
              variant="ghost"
              className="w-full py-3 text-base"
              disabled={googleLoading}
              onClick={() => void onGoogleSignIn()}
            >
              <GoogleMark className="h-5 w-5 shrink-0" aria-hidden />
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </Button>
            {showEmailLoginFields ? (
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                  <span className="bg-[#151923] px-2 text-zinc-500">or</span>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {!googleAuthConfigured && !showEmailLoginFields ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-sm text-amber-100/90">
            <p className="font-medium text-amber-200">Sign-in is not configured</p>
            <p className="mt-2 text-xs leading-relaxed text-amber-100/80">
              Add <code className="rounded bg-black/30 px-1">GOOGLE_CLIENT_ID</code> and{" "}
              <code className="rounded bg-black/30 px-1">GOOGLE_CLIENT_SECRET</code> in Vercel, and
              set <code className="rounded bg-black/30 px-1">AUTH_SECRET</code>. Use the Google
              redirect URI <code className="rounded bg-black/30 px-1">…/api/auth/callback/google</code>.
            </p>
          </div>
        ) : null}

        {showEmailLoginFields && !googleAuthConfigured && !emailCredentialsActive ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-sm text-amber-100/90">
            <p className="font-medium text-amber-200">Set a dev password</p>
            <p className="mt-2 text-xs leading-relaxed text-amber-100/80">
              Add <code className="rounded bg-black/30 px-1">AUTH_DEV_PASSWORD</code> to{" "}
              <code className="rounded bg-black/30 px-1">.env.local</code>, restart{" "}
              <code className="rounded bg-black/30 px-1">npm run dev</code>, then sign in below.
            </p>
          </div>
        ) : null}

        {showEmailLoginFields ? (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-xs text-zinc-500" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Matches AUTH_DEV_PASSWORD in .env.local"
              />
            </div>
            <Button
              type="submit"
              className="w-full py-3 text-base"
              disabled={!emailCredentialsActive || loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : null}
      </Card>
    </div>
  )
}

function GoogleMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
