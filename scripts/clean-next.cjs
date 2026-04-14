/* Remove stale .next output (fixes missing middleware-manifest.json / chunk errors). */
const fs = require("fs")
const path = require("path")

const dir = path.join(__dirname, "..", ".next")
try {
  fs.rmSync(dir, { recursive: true, force: true })
  console.log("[clean-next] removed .next")
} catch (e) {
  console.warn("[clean-next]", e.message)
}
