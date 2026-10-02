import { FormEvent, useEffect, useRef, useState } from 'react'

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'message', string>>

export function Enquiry() {
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)
  const wasSent = useRef(false)

  useEffect(() => {
    if (sent) confirmationRef.current?.focus()
    else if (wasSent.current) nameRef.current?.focus()
    wasSent.current = sent
  }, [sent])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const values = Object.fromEntries(data) as Record<string, string>
    const next: Errors = {}
    if (values.name.trim().length < 2) next.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Please enter a valid email address.'
    const phoneDigits = values.phone.replace(/\D/g, '')
    if (values.phone && (!/^\+?[\d\s()-]+$/.test(values.phone.trim()) || phoneDigits.length < 7 || phoneDigits.length > 15)) next.phone = 'Please enter a valid phone number.'
    if (values.message.trim().length < 10) next.message = 'Please share a little more about your enquiry.'
    setErrors(next)
    if (Object.keys(next).length === 0) {
      setSent(true)
      event.currentTarget.reset()
    } else event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus()
  }

  return (
    <section id="enquire" className="enquiry section-dark">
      <img className="enquiry__image" src="/optimized/campaign/blue-hour-enquiry.webp" srcSet="/optimized/campaign/blue-hour-enquiry-mobile.webp 800w, /optimized/campaign/blue-hour-enquiry.webp 1600w" sizes="(max-width: 760px) 100vw, 80vw" alt="OMNIS illuminated and reflected across the water at blue hour" loading="lazy" />
      <div className="enquiry__veil" />
      <div className="enquiry__heading">
        <p className="eyebrow eyebrow--light">Private enquiries</p>
        <h2>A place<br />beyond the<br /><em>ordinary.</em></h2>
        <p>Private enquiries for OMNIS.</p>
      </div>
      <div className="enquiry__form-wrap">
        {sent ? (
          <div ref={confirmationRef} className="form-success" role="status" tabIndex={-1}>
            <span>Enquiry preview</span>
            <h3>Details checked.</h3>
            <p>Your details passed validation. This demo does not send or store enquiries.</p>
            <button onClick={() => setSent(false)}>Try another enquiry</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p>Request a private viewing</p>
            <p className="enquiry__demo">Demo form · enquiries are not sent or stored.</p>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input ref={nameRef} id="name" name="name" autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
              {errors.name && <span id="name-error" className="field__error">{errors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
              {errors.email && <span id="email-error" className="field__error">{errors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="phone">Phone <span>Optional</span></label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} />
              {errors.phone && <span id="phone-error" className="field__error">{errors.phone}</span>}
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={3} required aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : undefined} />
              {errors.message && <span id="message-error" className="field__error">{errors.message}</span>}
            </div>
            <button className="form-submit" type="submit"><span>Send enquiry</span><i aria-hidden="true">↗</i></button>
          </form>
        )}
      </div>
    </section>
  )
}
