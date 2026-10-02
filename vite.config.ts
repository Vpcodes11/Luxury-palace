import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), {
    name: 'site-domain',
    transformIndexHtml(html) {
      const site = process.env.SITE_URL || process.env.URL
      if (!site) return html
      const origin = new URL(site).origin
      return html.replace('content="/optimized/campaign/blue-hour-enquiry.webp"', `content="${origin}/optimized/campaign/blue-hour-enquiry.webp"`).replace('</head>', `<link rel="canonical" href="${origin}/" /><meta property="og:url" content="${origin}/" /></head>`)
    },
  }],
  build: { target: 'es2020' },
})
