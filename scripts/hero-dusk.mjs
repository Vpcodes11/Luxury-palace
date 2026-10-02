import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

// AI supplies the lighting; the original film supplies every architectural edge
// and texture. Work at low frequency so independently edited reference details
// never appear or flicker in the camera sequence.
const width = 128, height = 72, channels = 3
const referenceFrames = [0, 10, 20, 30, 40, 50, 60, 70, 79]
const directory = join(process.cwd(), 'assets', 'hero-dusk-lighting')
const filename = frame => `frame_${String(frame).padStart(3, '0')}`
let referencesPromise
const thumbnail = input => sharp(input).resize(width, height, { fit: 'fill' }).removeAlpha().raw().toBuffer()
const smooth = input => sharp(input).resize(width, height, { fit: 'fill' }).blur(1.2).removeAlpha().raw().toBuffer()

export async function duskModifiedTime() {
  const files = [...referenceFrames.map(frame => join(directory, `${filename(frame)}.webp`)), new URL(import.meta.url)]
  return Math.max(...await Promise.all(files.map(async file => (await stat(file)).mtimeMs)))
}

async function references() {
  return referencesPromise ??= Promise.all(referenceFrames.map(async frame => {
    const source = join(process.cwd(), 'public', 'hero-film-02-architecture', `${filename(frame)}.jpg`)
    const [original, daylight, dusk] = await Promise.all([
      thumbnail(source), smooth(source), smooth(join(directory, `${filename(frame)}.webp`)),
    ])
    const lighting = new Float32Array(width * height * channels)
    for (let i = 0; i < lighting.length; i++) {
      lighting[i] = Math.max(-2.8, Math.min(1.8, Math.log((dusk[i] + 18) / (daylight[i] + 18))))
    }
    return { frame, original, lighting }
  }))
}

function sample(buffer, x, y, channel) {
  x = Math.max(0, Math.min(width - 1, x)); y = Math.max(0, Math.min(height - 1, y))
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1)
  const fx = x - x0, fy = y - y0
  const a = buffer[(y0 * width + x0) * channels + channel], b = buffer[(y0 * width + x1) * channels + channel]
  const c = buffer[(y1 * width + x0) * channels + channel], d = buffer[(y1 * width + x1) * channels + channel]
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy
}

// Match original daylight frames to one another, rather than matching an AI
// redraw. This tracks each lighting field through the original moving columns.
async function motion(current, reference) {
  const step = 4, columns = Math.ceil(width / step) + 1, rows = Math.ceil(height / step) + 1
  const vectors = new Float32Array(columns * rows * 2)
  function score(x, y, dx, dy) {
    let error = .025 * dx * dx + .12 * dy * dy, count = 0
    for (let py = -2; py <= 2; py++) for (let px = -2; px <= 2; px++) {
      const ax = x + px, ay = y + py, bx = ax + dx, by = ay + dy
      if (ax < 0 || ay < 0 || bx < 0 || by < 0 || ax >= width || bx >= width || ay >= height || by >= height) continue
      const a = (ay * width + ax) * channels, b = (by * width + bx) * channels
      error += (Math.abs(current[a] - reference[b]) + Math.abs(current[a + 1] - reference[b + 1]) + Math.abs(current[a + 2] - reference[b + 2])) / 3
      count++
    }
    return count < 9 ? Infinity : error / count
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const x = Math.min(width - 1, column * step), y = Math.min(height - 1, row * step)
    let dx = 0, dy = 0, best = score(x, y, 0, 0)
    for (let cy = -4; cy <= 4; cy += 2) for (let cx = -24; cx <= 24; cx += 3) {
      const value = score(x, y, cx, cy)
      if (value < best) { best = value; dx = cx; dy = cy }
    }
    const coarseX = dx, coarseY = dy
    for (let cy = coarseY - 1; cy <= coarseY + 1; cy++) for (let cx = coarseX - 2; cx <= coarseX + 2; cx++) {
      const value = score(x, y, cx, cy)
      if (value < best) { best = value; dx = cx; dy = cy }
    }
    const i = (row * columns + column) * 2
    vectors[i] = dx; vectors[i + 1] = dy
  }
  // A coherent translation of the illumination avoids distorting it around
  // ambiguous matches on plain stone. Use textured doorway edges only;
  // independently tracked foreground occlusion handles the close columns.
  const shifts = []
  for (let row = 4; row < 14; row++) for (let column = 2; column < 27; column++) {
    const x = column * step, y = row * step, i = (row * columns + column) * 2
    const center = (y * width + x) * channels
    const contrast = Math.abs(current[center] - current[center - 2 * channels]) + Math.abs(current[center] - current[center + 2 * channels])
    if (contrast > 20 && Math.abs(vectors[i + 1]) <= 2) shifts.push(vectors[i])
  }
  shifts.sort((a, b) => a - b)
  const shift = shifts.length ? shifts[Math.floor(shifts.length / 2)] : 0
  return () => [shift, 0]
}

// Explicit foreground occlusion follows the two close columns that sweep
// across the camera. Their featureless surfaces must not inherit room light.
const foreground = [
  [[0, 450, 720], [6, 240, 475], [10, 40, 295], [14, -100, 145], [18, -330, -60]],
  [[10, 1980, 2300], [14, 1560, 1960], [16, 1390, 1970], [18, 1120, 1740], [20, 800, 1410], [22, 540, 1150], [24, 290, 910], [26, -60, 680], [28, -180, 435], [30, -290, 260], [32, -470, 80], [34, -700, -60]],
]
function occlusion(frame, x) {
  let opacity = 0
  for (const track of foreground) {
    if (frame < track[0][0] || frame > track.at(-1)[0]) continue
    const right = track.find(point => point[0] >= frame), left = track.filter(point => point[0] <= frame).at(-1)
    const mix = left[0] === right[0] ? 0 : (frame - left[0]) / (right[0] - left[0])
    const start = left[1] + (right[1] - left[1]) * mix, end = left[2] + (right[2] - left[2]) * mix
    opacity = Math.max(opacity, Math.max(0, Math.min(1, (x - start) / 24, (end - x) / 24)))
  }
  return opacity
}

export async function prepareDuskFrame(input, frame) {
  const all = await references()
  const right = all.find(reference => reference.frame >= frame) ?? all.at(-1)
  const left = all.filter(reference => reference.frame <= frame).at(-1) ?? all[0]
  const mix = left.frame === right.frame ? 0 : (frame - left.frame) / (right.frame - left.frame)
  const current = await thumbnail(input)
  const trackLeft = left.frame === frame ? () => [0, 0] : await motion(current, left.original)
  const trackRight = right.frame === frame ? () => [0, 0] : await motion(current, right.original)
  const map = Buffer.alloc(width * height * channels)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = trackLeft(x, y), b = trackRight(x, y)
    for (let channel = 0; channel < channels; channel++) {
      const before = sample(left.lighting, x + a[0], y + a[1], channel)
      const after = sample(right.lighting, x + b[0], y + b[1], channel)
      map[(y * width + x) * channels + channel] = Math.round((before + (after - before) * mix + 3) * 40)
    }
  }
  const { data: original, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const illumination = await sharp(map, { raw: { width, height, channels } }).blur(2).resize(info.width, info.height, { kernel: 'linear' }).raw().toBuffer()
  const output = Buffer.alloc(original.length)
  const cool = [.38, .47, .69]
  const columnMasks = Array.from({ length: info.width }, (_, x) => occlusion(frame, x * 1920 / info.width))
  for (let i = 0; i < output.length; i++) {
    const mask = columnMasks[Math.floor(i / channels) % info.width]
    const gain = Math.exp(illumination[i] / 40 - 3) * (1 - mask) + cool[i % channels] * mask
    output[i] = Math.max(0, Math.min(255, Math.round((original[i] + 18) * gain - 18)))
  }
  return sharp(output, { raw: { width: info.width, height: info.height, channels: info.channels } })
}
