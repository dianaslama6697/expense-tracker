import sharp from "sharp"
import { writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

const src = resolve(root, "acis-logo.png")
const sizes = [180, 192, 512]
const logoMeta = await sharp(src).metadata()
const logoAspect = logoMeta.width / logoMeta.height

function svgGradient(w, h) {
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1a2e1a" />
        <stop offset="100%" stop-color="#000000" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)" />
  </svg>`
}

for (const size of sizes) {
  const padding = Math.round(size * 0.18)
  const maxDim = size - padding * 2

  let logoW, logoH
  if (logoAspect > 1) {
    logoW = maxDim
    logoH = Math.round(maxDim / logoAspect)
  } else {
    logoH = maxDim
    logoW = Math.round(maxDim * logoAspect)
  }

  const gradientSvg = svgGradient(size, size)

  const buf = await sharp(Buffer.from(gradientSvg))
    .resize(size, size)
    .composite([
      {
        input: await sharp(src).resize(logoW, logoH).png().toBuffer(),
        top: Math.round((size - logoH) / 2),
        left: Math.round((size - logoW) / 2),
      },
    ])
    .png()
    .toBuffer()

  writeFileSync(resolve(root, `public/icons/icon-${size}.png`), buf)
  const kb = (buf.length / 1024).toFixed(1)
  console.log(`✅ icon-${size}.png (${kb} KB)`)
}

writeFileSync(
  resolve(root, "public/icons/icon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1a2e1a" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" />
</svg>`
)
console.log("✅ icon.svg updated")
