/**
 * Regenerates every raster icon from the single source of truth: src/app/icon.svg
 * (the Nautilus shell mark). Run with `node scripts/generate-icons.mjs` after
 * changing the mark so the favicon, PWA icons and social cards stay in sync.
 */
import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"
import sharp from "sharp"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const markSvg = await readFile(path.join(root, "src/app/icon.svg"))

const render = (size) =>
  sharp(markSvg, { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

/** Packs PNG frames into a multi-resolution .ico container. */
function buildIco(frames) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(frames.length, 4)

  let offset = 6 + frames.length * 16
  const entries = frames.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // palette size
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...frames.map((f) => f.data)])
}

const icoSizes = [16, 32, 48, 64]
const icoFrames = await Promise.all(
  icoSizes.map(async (size) => ({ size, data: await render(size) }))
)
await writeFile(path.join(root, "src/app/favicon.ico"), buildIco(icoFrames))

const pngTargets = [
  ["src/app/apple-icon.png", 180],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
]
for (const [target, size] of pngTargets) {
  await writeFile(path.join(root, target), await render(size))
}

// Social card: the mark on the same near-black the landing page uses.
const mark = await render(220)
const card = await sharp({
  create: { width: 1200, height: 630, channels: 4, background: "#000000" },
})
  .composite([
    { input: mark, top: 128, left: 110 },
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
           <text x="110" y="418" font-family="Helvetica,Arial,sans-serif" font-size="104"
                 font-weight="700" letter-spacing="-4" fill="#fafafa">nautilus</text>
           <text x="114" y="476" font-family="Helvetica,Arial,sans-serif" font-size="34"
                 fill="#a1a1aa">Design, simulate and explain software architecture.</text>
         </svg>`
      ),
      top: 0,
      left: 0,
    },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer()

await writeFile(path.join(root, "src/app/opengraph-image.png"), card)
await writeFile(path.join(root, "src/app/twitter-image.png"), card)

console.log("icons written")
