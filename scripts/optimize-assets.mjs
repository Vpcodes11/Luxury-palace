import { readdir, readFile, mkdir, stat } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import sharp from 'sharp'
import { HERO_SOURCE, HERO_RELEASE, HERO_PROFILES } from './hero-settings.mjs'
import { prepareDuskFrame, duskModifiedTime } from './hero-dusk.mjs'

const root = process.cwd()
const publicRoot = join(root, 'public')
const folders = [HERO_SOURCE]
const jobs = []
for (const file of await readdir(join(publicRoot, 'campaign'))) {
  if (/\.(jpg|jpeg|png)$/i.test(file)) jobs.push(`campaign/${file}`)
}
for (const folder of folders) {
  for (const file of await readdir(join(publicRoot, folder))) {
    const frame = Number(file.match(/\d+/)?.[0])
    if (/\.(jpg|jpeg|png)$/i.test(file) && frame >= 0 && frame <= 79) jobs.push(`${folder}/${file}`)
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
const lightingModified = await duskModifiedTime()
async function worker() {
  while (cursor < unique.length) {
    const relative = unique[cursor++]
    const input = join(publicRoot, relative)
    const inputStat = await stat(input)
    originalBytes += inputStat.size
    const sequence = relative.startsWith(HERO_SOURCE + '/')
    let prepared
    const targetRelative = sequence ? relative.replace(HERO_SOURCE, HERO_RELEASE) : relative
    const base = join(publicRoot, 'optimized', targetRelative.slice(0, -extname(relative).length))
    await mkdir(dirname(base), { recursive: true })
    const variants = sequence ? HERO_PROFILES : [{ suffix: '', width: 1600, quality: 76 }, { suffix: '-mobile', width: 800, quality: 70 }]
    for (const { suffix, width, height, quality } of variants) {
      const output = `${base}${suffix}.webp`
      let fresh = false
      try { fresh = (await stat(output)).mtimeMs >= Math.max(inputStat.mtimeMs, (await stat(new URL(import.meta.url))).mtimeMs, (await stat(new URL('./hero-settings.mjs', import.meta.url))).mtimeMs, sequence ? lightingModified : 0) } catch {}
      if (!fresh) {
        if (sequence && !prepared) prepared = await prepareDuskFrame(input, Number(relative.match(/frame_(\d+)/)?.[1]))
        await (prepared ? prepared.clone() : sharp(input)).rotate().resize({ width, height, fit: 'cover', position: 'centre', withoutEnlargement: true }).webp({ quality, effort: sequence ? 6 : 4 }).toFile(output)
      }
      const size = (await stat(output)).size
      if (suffix) mobileBytes += size; else desktopBytes += size
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker))
console.log(JSON.stringify({ images: unique.length, originalMB: +(originalBytes / 1e6).toFixed(2), desktopMB: +(desktopBytes / 1e6).toFixed(2), mobileMB: +(mobileBytes / 1e6).toFixed(2) }))
