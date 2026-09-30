import { useEffect, useRef, useState } from 'react'

const links = [
  ['Residence', 'introduction'],
  ['Architecture', 'architecture'],
  ['Spaces', 'spaces'],
  ['Location', 'location'],
] as const

export function Navigation() {
  const [onHero, setOnHero] = useState(true)
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return
    const observer = new IntersectionObserver(([entry]) => setOnHero(entry.isIntersecting), { threshold: 0.05 })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    if (open) closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('menu-open')
    }
  }, [open])

  const navigate = (id: string) => {
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header className={`site-nav ${onHero && !open ? 'site-nav--hero' : ''}`}>
      <button className="wordmark" onClick={() => navigate('hero')} aria-label="OMNIS, return to top">OMNIS</button>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {links.map(([label, id]) => <button key={id} onClick={() => navigate(id)}>{label}</button>)}
      </nav>
      <button className="enquire-link desktop-enquire" onClick={() => navigate('enquire')}>Enquire</button>
      <button className="menu-toggle" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-menu">
        <span>Menu</span><i aria-hidden="true" />
      </button>
      <div id="mobile-menu" className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="mobile-menu__top">
          <span className="wordmark">OMNIS</span>
          <button ref={closeRef} className="menu-close" onClick={() => setOpen(false)}>Close</button>
        </div>
        <nav aria-label="Mobile navigation">
          {links.map(([label, id], index) => (
            <button key={id} onClick={() => navigate(id)}><span>0{index + 1}</span>{label}</button>
          ))}
          <button onClick={() => navigate('enquire')}><span>05</span>Enquire</button>
        </nav>
      </div>
    </header>
  )
}
