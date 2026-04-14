import type { Metadata, Viewport } from "next"
import { Syne, DM_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Vectra",
  description: "Personal self-improvement — habits, health, and clarity in one place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Vectra",
    statusBarStyle: "black-translucent",
  },
}

export const viewport: Viewport = {
  themeColor: "#0f1117",
}

const devSwNuke =
  process.env.NODE_ENV === "development"
    ? `
(function () {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (r) {
    r.forEach(function (x) { x.unregister(); });
  });
  try {
    if (typeof caches !== "undefined" && caches.keys) {
      caches.keys().then(function (k) {
        return Promise.all(k.map(function (x) { return caches.delete(x); }));
      }).catch(function () {});
    }
  } catch (e) {}
})();
`.trim()
    : null

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh bg-[#0f1117] font-sans antialiased">
        {devSwNuke ? (
          <script
            // Runs before React chunks: clears stale PWA SW/cache that breaks layout chunk loads in dev
            dangerouslySetInnerHTML={{ __html: devSwNuke }}
          />
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
