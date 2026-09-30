const footerLinks = [
  ['Residence', 'introduction'], ['Architecture', 'architecture'], ['Spaces', 'spaces'], ['Location', 'location'],
]

export function Footer() {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <footer className="footer">
      <div className="footer__brand">OMNIS</div>
      <nav aria-label="Footer navigation">
        {footerLinks.map(([label, id]) => <button key={id} onClick={() => go(id)}>{label}</button>)}
      </nav>
      <button className="footer__enquire" onClick={() => go('enquire')}>Enquire <span>↗</span></button>
      <div className="footer__legal"><span>© OMNIS — Conceptual luxury residence.</span><button onClick={() => go('hero')}>Back to top ↑</button></div>
    </footer>
  )
}
