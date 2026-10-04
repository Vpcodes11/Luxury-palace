// Retain compressed frames; decode only the neighborhood of the camera.
// Drawing and decoding stay off the page's scrolling thread.
type Request = { index?: number; blob?: Blob; canvas?: OffscreenCanvas; width?: number; height?: number; frame?: number; active?: boolean }
const renderer = self as unknown as {
  onmessage: (event: MessageEvent<Request>) => void
  postMessage: (message: { index?: number; loaded?: boolean; failed?: boolean; ready?: boolean; painted?: number; cached?: number }) => void
}
let canvas: OffscreenCanvas | undefined
let context: OffscreenCanvasRenderingContext2D | null = null
const sources = new Map<number, Blob>()
const images = new Map<number, ImageBitmap>()
const decoding = new Set<number>(), failed = new Set<number>()
let current = 0, painted = -1, active = true, drawFrame = 0
const radius = 6

function trim() {
  for (const [index, image] of images) {
    if (index !== painted && (!active || Math.abs(index - current) > radius)) { image.close(); images.delete(index) }
  }
}

function draw() {
  drawFrame = 0
  if (!canvas || !context || !active || !images.size) return
  let index = current
  if (!images.has(index)) index = [...images.keys()].sort((a, b) => Math.abs(a - current) - Math.abs(b - current))[0]
  if (index === painted) return
  const image = images.get(index)!
  const scale = Math.max(canvas.width / image.width, canvas.height / image.height)
  const width = image.width * scale, height = image.height * scale
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
  painted = index; trim()
  renderer.postMessage({ painted: index, cached: images.size })
}

function scheduleDraw() {
  if (!drawFrame && active) drawFrame = requestAnimationFrame(draw)
}
function prepare() {
  trim()
  if (!active) return
  const priority = [current]
  for (let offset = 1; offset <= radius; offset++) priority.push(current + offset, current - offset)
  for (const index of priority) {
    if (decoding.size >= 2) break
    if (!sources.has(index) || images.has(index) || decoding.has(index) || failed.has(index)) continue
    decoding.add(index)
    void createImageBitmap(sources.get(index)!).then(image => {
      if (active && Math.abs(index - current) <= radius) images.set(index, image)
      else image.close()
    }).catch(() => failed.add(index)).finally(() => {
      decoding.delete(index); scheduleDraw(); prepare()
      renderer.postMessage({ cached: images.size })
    })
  }
}

try {
  const probe = new OffscreenCanvas(1, 1)
  renderer.postMessage({ ready: typeof createImageBitmap === 'function' && typeof requestAnimationFrame === 'function' && !!probe.getContext('2d') })
} catch { renderer.postMessage({ ready: false }) }

renderer.onmessage = ({ data }) => {
  if (data.canvas) { canvas = data.canvas; context = canvas.getContext('2d', { alpha: false, desynchronized: true }) }
  if (canvas && data.width && data.height && (canvas.width !== data.width || canvas.height !== data.height)) {
    canvas.width = data.width; canvas.height = data.height; painted = -1
  }
  if (context) { context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'low' }
  if (data.active !== undefined) active = data.active
  if (data.frame !== undefined) current = data.frame
  if (data.blob && data.index !== undefined) {
    sources.set(data.index, data.blob)
    renderer.postMessage({ index: data.index, loaded: true })
  }
  prepare(); scheduleDraw()
  if (!active) renderer.postMessage({ cached: images.size })
}

export {}
