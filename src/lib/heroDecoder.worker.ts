// Keep decoding and painting off the scrolling thread. The canvas stays here,
// avoiding a large image-surface copy into the page on every animation frame.
type Request = { index?: number; blob?: Blob; canvas?: OffscreenCanvas; width?: number; height?: number; frame?: number; active?: boolean }
const renderer = self as unknown as {
  onmessage: (event: MessageEvent<Request>) => void
  postMessage: (message: { index?: number; loaded?: boolean; failed?: boolean; ready?: boolean; painted?: number }) => void
}
let canvas: OffscreenCanvas | undefined
let context: OffscreenCanvasRenderingContext2D | null = null
const images = new Map<number, ImageBitmap>()
let current = 0, painted = -1, active = true

function draw() {
  if (!canvas || !context || !active || !images.size) return
  let index = current
  if (!images.has(index)) index = [...images.keys()].sort((a, b) => Math.abs(a - current) - Math.abs(b - current))[0]
  if (index === painted) return
  const image = images.get(index)!
  const scale = Math.max(canvas.width / image.width, canvas.height / image.height)
  const width = image.width * scale, height = image.height * scale
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
  painted = index
  renderer.postMessage({ painted: index })
}

try {
  const probe = new OffscreenCanvas(1, 1)
  renderer.postMessage({ ready: typeof createImageBitmap === 'function' && !!probe.getContext('2d') })
} catch { renderer.postMessage({ ready: false }) }

renderer.onmessage = async ({ data }) => {
  if (data.canvas) { canvas = data.canvas; context = canvas.getContext('2d', { alpha: false, desynchronized: true }) }
  if (canvas && data.width && data.height && (canvas.width !== data.width || canvas.height !== data.height)) {
    canvas.width = data.width; canvas.height = data.height; painted = -1
  }
  if (context) { context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'low' }
  if (data.active !== undefined) active = data.active
  if (data.frame !== undefined) current = data.frame
  if (data.blob && data.index !== undefined) {
    try {
      const image = await createImageBitmap(data.blob)
      images.set(data.index, image)
      renderer.postMessage({ index: data.index, loaded: true })
    } catch { renderer.postMessage({ index: data.index, failed: true }) }
  }
  draw()
}

export {}
