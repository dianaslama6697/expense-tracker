// Generate PNG icons from source image
import sharp from "sharp"
import { writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

const src = resolve(root, "wangku.png")
const sizes = [180, 192, 512]

for (const size of sizes) {
  const buf = await sharp(src)
    .resize(size, size, { fit: "cover" })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer()
  writeFileSync(resolve(root, `public/icons/icon-${size}.png`), buf)
  const kb = (buf.length / 1024).toFixed(1)
  console.log(`✅ icon-${size}.png (${kb} KB)`)
}
