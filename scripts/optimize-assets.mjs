import { readdir, readFile, mkdir, stat } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const publicRoot = join(root, 'public')
const folders = ['hero-film-02-architecture']
const jobs = []
for (const file of await readdir(join(publicRoot, 'campaign'))) {
  if (/\.(jpg|jpeg|png)$/i.test(file)) jobs.push(`campaign/${file}`)
}
for (const folder of folders) {
  for (const file of await readdir(join(publicRoot, folder))) {
    const frame = Number(file.match(/\d+/)?.[0])
    if (/\.(jpg|jpeg|png)$/i.test(file) && (frame % 2 === 0 || frame === 79)) jobs.push(`${folder}/${file}`)
  }
}
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await scan(path)
    else if (/\.(tsx?|css)$/.test(entry.name) && !entry.name.includes('generated')) {
      const source = await readFile(path, 'utf8')
      for (const match of source.matchAll(/['"`]\/(?:optimized\/)?([\w/-]+)\.(?:jpg|jpeg|png|webp)['"`]/g)) {
        const base = match[1].replace(/-mobile$/, '')
        for (const ext of ['.jpg', '.jpeg', '.png']) {
          try { await stat(join(publicRoot, base + ext)); jobs.push(base + ext); break } catch {}
        }
      }
    }
  }
}
await scan(join(root, 'src'))
const unique = [...new Set(jobs)]
let originalBytes = 0, desktopBytes = 0, mobileBytes = 0
let cursor = 0
async function worker() {
  while (cursor < unique.length) {
    const relative = unique[cursor++]
    const input = join(publicRoot, relative)
    const inputStat = await stat(input)
    originalBytes += inputStat.size
    const base = join(publicRoot, 'optimized', relative.slice(0, -extname(relative).length))
    await mkdir(dirname(base), { recursive: true })
    const sequence = relative.startsWith('hero-film-02-architecture/')
    const variants = sequence ? [['', 1280, 68], ['-mobile', 768, 64]] : [['', 1600, 76], ['-mobile', 800, 70]]
    for (const [suffix, width, quality] of variants) {
      const output = `${base}${suffix}.webp`
      let fresh = false
      try { fresh = (await stat(output)).mtimeMs >= Math.max(inputStat.mtimeMs, (await stat(new URL(import.meta.url))).mtimeMs) } catch {}
      if (!fresh) await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 4 }).toFile(output)
      const size = (await stat(output)).size
      if (suffix) mobileBytes += size; else desktopBytes += size
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker))
console.log(JSON.stringify({ images: unique.length, originalMB: +(originalBytes / 1e6).toFixed(2), desktopMB: +(desktopBytes / 1e6).toFixed(2), mobileMB: +(mobileBytes / 1e6).toFixed(2) }))
