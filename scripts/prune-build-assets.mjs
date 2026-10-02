import { readdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
const root = resolve('dist')
// Vite copies all public files. Only optimized imagery belongs in the release.
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isDirectory() && /^(hero-|campaign$|palace-details$|variations$)/.test(entry.name)) {
    const target = resolve(join(root, entry.name))
    if (!target.startsWith(root + '\\') && !target.startsWith(root + '/')) throw new Error('Invalid release path')
    await rm(target, { recursive: true })
  }
}
console.log('Release contains optimized imagery; original source assets remain in public.')
