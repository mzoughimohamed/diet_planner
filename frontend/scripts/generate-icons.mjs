import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(iconsDir, { recursive: true })

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="102" fill="#22c55e"/>
  <rect x="120" y="200" width="272" height="48" rx="24" fill="white"/>
  <rect x="120" y="276" width="200" height="36" rx="18" fill="white" opacity="0.75"/>
  <rect x="120" y="132" width="160" height="36" rx="18" fill="white" opacity="0.75"/>
  <circle cx="360" cy="152" r="56" fill="white" opacity="0.2"/>
</svg>`)

for (const size of [192, 512]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(
    join(iconsDir, `icon-${size}.png`)
  )
  console.log(`Generated icon-${size}.png`)
}
