# Vectra

Vectra is a personal self-improvement web app built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, **NextAuth.js v5** (email + dev password), **Google Calendar API** (optional; needs OAuth tokens to work), **Recharts**, **Zustand**, **React Hook Form + Zod**, **date-fns**, **react-hot-toast**, **@hello-pangea/dnd**, and **next-pwa**.

It bundles journaling, mood tracking, water intake, workouts, nutrition, tasks, calendar-aware scheduling, and analytics into one installable PWA.

## Local setup

1. **Clone and install**

```bash
npm install
```

2. **Create `.env.local`**

Copy `.env.example` to `.env.local` and fill in values (see below).

3. **Create the database schema**

```bash
npx prisma migrate dev --name init
```

For a quick prototype against an empty database you can also use:

```bash
npx prisma db push
```

4. **Run the dev server**

```bash
npm run dev
```

Open `http://localhost:3000`, sign in with **email + `AUTH_DEV_PASSWORD`**, then optionally seed demo data tied to your user:

```bash
npm run db:seed
```

The seed script attaches sample rows to the **first user** in the database (created after your first sign-in).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (SSL for Supabase) |
| `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Canonical site URL (local: `http://localhost:3000`). On Vercel, optional for `*.vercel.app`; **set this** if you use a **custom domain** so OAuth matches Google’s redirect list. |
| `AUTH_DEV_PASSWORD` | Local `next dev` only — shared password for email sign-in (not used in production builds). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (sign-in + Calendar). Redirect URI: `https://<your-host>/api/auth/callback/google` |

Legacy: `NEXTAUTH_SECRET` / `NEXTAUTH_URL` still work if `AUTH_SECRET` / `AUTH_URL` are unset.

### Google Calendar

Calendar features need users to sign in with Google so refresh tokens are stored. Enable **Google Calendar API** in Google Cloud and add the OAuth redirect URI above.

## Supabase (free PostgreSQL)

1. Create a project on [Supabase](https://supabase.com/).
2. **Project Settings → Database → Connection string** — choose **URI** and copy the Postgres URL.
3. Replace password placeholder and append SSL if required, e.g. `?sslmode=require`.
4. Set `DATABASE_URL` in `.env.local` (local) and in Vercel project settings (production).
5. Run migrations from your machine against that URL (`npx prisma migrate dev` or `db push`).

## Vercel deployment

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the repo in [Vercel](https://vercel.com/) as a Next.js app.
3. Under **Settings → Environment Variables**, add at least:

| Name | Value / notes |
|------|----------------|
| `DATABASE_URL` | Pooled Postgres URL (e.g. Supabase port **6543** + `?pgbouncer=true`) |
| `AUTH_SECRET` | Output of `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth Web client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client secret |

Optional:

| Name | When to set |
|------|-------------|
| `AUTH_URL` | **Custom domain** (e.g. `https://app.example.com`). If unset, the app uses `https://${VERCEL_URL}` for OAuth callbacks (fine for `*.vercel.app` previews and production). |

You do **not** need `AUTH_DEV_PASSWORD` on Vercel — email/password sign-in is for local development only.

4. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**, edit your OAuth client → **Authorized redirect URIs** — add every host you use, for example `https://your-project.vercel.app/api/auth/callback/google` and, if applicable, your custom-domain callback with the same path.

5. Redeploy so `prisma generate` runs on install (`postinstall` in `package.json`).

6. Run migrations against production from your machine (recommended):

```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

`vercel.json` includes light caching headers for the web manifest and icons.

## PWA

`next-pwa` registers a service worker in production builds. `public/manifest.json` sets the app name **Vectra**, theme color `#0f1117`, and icons under `public/icons/`. Runtime caching prioritizes **NetworkFirst** navigations to `/dashboard` and `/journal` so those views work better offline after the first load.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed sample data for the first user |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:push` | Prisma db push |

## License

Private / personal use unless you add your own license.
