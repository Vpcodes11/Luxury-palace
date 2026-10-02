// Prepare pixels away from the scrolling thread, including deferred raster work.
const decoder = self as unknown as {
  onmessage: (event: MessageEvent<{ index: number; blob: Blob }>) => void
  postMessage: (message: { index?: number; bitmap?: ImageBitmap; failed?: boolean; ready?: boolean }, transfer?: Transferable[]) => void
}

decoder.postMessage({ ready: typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function' })

decoder.onmessage = async ({ data: { index, blob } }) => {
  let source: ImageBitmap | undefined
  try {
    source = await createImageBitmap(blob)
    const surface = new OffscreenCanvas(source.width, source.height)
    const context = surface.getContext('2d', { alpha: false, willReadFrequently: true })
    if (!context) throw new Error('Background canvas unavailable')
    context.drawImage(source, 0, 0)
    context.getImageData(0, 0, 1, 1) // Flush deferred decoding/rasterization here.
    source.close(); source = undefined
    const bitmap = surface.transferToImageBitmap()
    decoder.postMessage({ index, bitmap }, [bitmap])
  } catch {
    source?.close()
    decoder.postMessage({ index, failed: true })
  }
}

export {}
