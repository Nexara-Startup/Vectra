/**
 * Rasterize public/icons/vectra-icon.svg → icon-192.png & icon-512.png for PWA.
 * Run: npm run icons
 */
const fs = require("fs")
const path = require("path")

async function main() {
  const sharp = require("sharp")
  const root = path.join(__dirname, "..")
  const svgPath = path.join(root, "public", "icons", "vectra-icon.svg")
  const svg = fs.readFileSync(svgPath)
  const out192 = path.join(root, "public", "icons", "icon-192.png")
  const out512 = path.join(root, "public", "icons", "icon-512.png")
  await sharp(svg).resize(192, 192).png().toFile(out192)
  await sharp(svg).resize(512, 512).png().toFile(out512)
  console.log("Wrote", out192, out512)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
