import { readdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { HERO_RELEASE } from './hero-settings.mjs'
const root = resolve('dist')
// Vite copies all public files. Only optimized imagery belongs in the release.
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isDirectory() && /^(hero-|campaign$|palace-details$|variations$)/.test(entry.name)) {
    const target = resolve(join(root, entry.name))
    if (!target.startsWith(root + '\\') && !target.startsWith(root + '/')) throw new Error('Invalid release path')
    await rm(target, { recursive: true })
  }
}
// Existing local generated files can outlive a previous film selection. Release
// only the active Film 02 sequence; keep still images used by spatial galleries.
const optimizedRoot = resolve(join(root, 'optimized'))
for (const entry of await readdir(optimizedRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith('hero-')) continue
  const target = resolve(join(optimizedRoot, entry.name))
  if (!target.startsWith(optimizedRoot + '\\') && !target.startsWith(optimizedRoot + '/')) throw new Error('Invalid optimized release path')
  if (entry.name !== HERO_RELEASE && entry.name !== 'hero-film-09-craft') await rm(target, { recursive: true })
  else for (const file of await readdir(target)) {
    const frame = Number(file.match(/\d+/)?.[0])
    const used = entry.name === HERO_RELEASE ? frame >= 0 && frame <= 79 : frame === 108
    if (!used) await rm(join(target, file))
  }
}
console.log('Release contains optimized imagery; original source assets remain in public.')
