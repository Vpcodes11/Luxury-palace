import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '.', '')
  return {
  plugins: [react(), {
    name: 'site-domain',
    transformIndexHtml(html) {
      const site = environment.SITE_URL || environment.URL || (environment.VERCEL_PROJECT_PRODUCTION_URL ? `https://${environment.VERCEL_PROJECT_PRODUCTION_URL}` : '')
      if (!site) return html
      const origin = new URL(site).origin
      return html.replace('content="/optimized/campaign/blue-hour-enquiry.webp"', `content="${origin}/optimized/campaign/blue-hour-enquiry.webp"`).replace('</head>', `<link rel="canonical" href="${origin}/" /><meta property="og:url" content="${origin}/" /></head>`)
    },
  }],
  build: { target: 'es2020' },
  }
})
