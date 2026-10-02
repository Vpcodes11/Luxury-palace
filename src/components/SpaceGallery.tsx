import { useEffect, useRef, useState } from 'react'

const collections = [
  { title: 'The Courtyard', images: ['courtyard-signature', 'courtyard-gallery', 'courtyard-dining'], captions: ['Olive trees and arcades', 'A room beneath the sky', 'Dining beside still water'] },
  { title: 'The Craft', images: ['craft-signature', 'craft-gallery', 'salon-gallery'], captions: ['Stone, bronze and oak', 'A study of material', 'Craftsmanship in the grand salon'] },
  { title: 'The Water Court', images: ['blue-hour-gallery', 'aerial-estate', 'blue-hour-enquiry'], captions: ['Reflections at blue hour', 'The estate and its landscape', 'Architecture after sunset'] },
]

export function SpaceGallery({ collection, onClose }: { collection: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [slide, setSlide] = useState(0)
  const space = collections[collection]
  const move = (step: number) => setSlide(current => (current + step + space.images.length) % space.images.length)
  useEffect(() => {
    const element = dialog.current!
    const previousFocus = document.activeElement as HTMLElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => { element.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus() }
  }, [])
  return <dialog ref={dialog} className="gallery-dialog" aria-labelledby="gallery-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }} onKeyDown={event => {
    if (event.key === 'ArrowRight') move(1)
    if (event.key === 'ArrowLeft') move(-1)
    if (event.key === 'Tab') {
      const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button')
      const first = buttons[0], last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
  }}>
    <div className="gallery-dialog__header"><div><p className="eyebrow">Private spatial studies</p><h2 id="gallery-title">{space.title}</h2></div><button autoFocus onClick={onClose} aria-label="Close gallery">Close ×</button></div>
    <figure><img src={`/optimized/campaign/${space.images[slide]}.webp`} alt={space.captions[slide]} /><figcaption aria-live="polite">{space.captions[slide]} · {slide + 1} / {space.images.length}</figcaption></figure>
    <div className="gallery-dialog__controls"><button onClick={() => move(-1)} aria-label="Previous image">← Previous</button><span>Use arrows to explore</span><button onClick={() => move(1)} aria-label="Next image">Next →</button></div>
  </dialog>
}
