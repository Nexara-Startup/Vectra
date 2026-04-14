const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Keep OAuth / session traffic off Workbox navigation handling (avoids odd
  // iframe / error-page behavior around /api/auth/*).
  navigateFallbackDenylist: [/^\/api(?:\/|$)/i, /^\/_/],
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) =>
        request.mode === "navigate" &&
        (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/journal")),
      handler: "NetworkFirst",
      options: {
        cacheName: "vectra-pages",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

// Only wrap with next-pwa during production builds. In dev, the wrapper can
// interfere with middleware compilation (missing middleware-manifest.json).
module.exports = process.env.NODE_ENV === "production" ? withPWA(nextConfig) : nextConfig
