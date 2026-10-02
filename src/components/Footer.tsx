const footerLinks = [
  ['Residence', 'introduction'], ['Architecture', 'architecture'], ['Spaces', 'spaces'], ['Location', 'location'],
  ['3D tour', 'tour'],
]

export function Footer() {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  return (
    <footer className="footer">
      <div className="footer__brand">OMNIS</div>
      <nav aria-label="Footer navigation">
        {footerLinks.map(([label, id]) => <button key={id} onClick={() => go(id)}>{label}</button>)}
      </nav>
      <button className="footer__enquire" onClick={() => go('enquire')}>Enquire <span>↗</span></button>
      <div className="footer__contact"><p>Contact preview</p><span>+00 000 000 0000</span><small>Dummy number · public contact coming soon</small></div>
      <div className="footer__legal"><span>© {new Date().getFullYear()} OMNIS — Conceptual luxury residence.</span><a href="/privacy.html">Privacy</a><button onClick={() => go('hero')}>Back to top ↑</button></div>
    </footer>
  )
}
