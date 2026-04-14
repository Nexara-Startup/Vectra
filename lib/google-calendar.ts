import { google } from "googleapis"
import { getAuthBaseUrl } from "@/lib/auth-env"
import prisma from "@/lib/prisma"

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${getAuthBaseUrl()}/api/auth/callback/google`,
  )
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")

  const nowSec = Math.floor(Date.now() / 1000)
  const expiry = user.googleTokenExpiry
  if (user.googleAccessToken && expiry && expiry > nowSec + 90) {
    return user.googleAccessToken
  }

  const refresh = user.googleRefreshToken
  if (!refresh) {
    throw new Error("Google Calendar not connected. Sign out and sign in again to grant access.")
  }

  const auth = oauthClient()
  auth.setCredentials({ refresh_token: refresh })
  const { credentials } = await auth.refreshAccessToken()
  const access = credentials.access_token
  if (!access) throw new Error("Failed to refresh Google access token")

  const newExpiry = credentials.expiry_date
    ? Math.floor(credentials.expiry_date / 1000)
    : nowSec + 3600

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: access,
      googleTokenExpiry: newExpiry,
    },
  })

  return access
}

export async function listCalendarEvents(
  userId: string,
  timeMin: Date,
  timeMax: Date,
) {
  const accessToken = await getValidAccessToken(userId)
  const auth = oauthClient()
  auth.setCredentials({ access_token: accessToken })
  const cal = google.calendar({ version: "v3", auth })
  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  })
  return res.data.items ?? []
}

export async function createCalendarEvent(
  userId: string,
  params: { summary: string; description?: string; start: Date; end: Date },
) {
  const accessToken = await getValidAccessToken(userId)
  const auth = oauthClient()
  auth.setCredentials({ access_token: accessToken })
  const cal = google.calendar({ version: "v3", auth })
  const created = await cal.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: params.start.toISOString() },
      end: { dateTime: params.end.toISOString() },
    },
  })
  return created.data
}
