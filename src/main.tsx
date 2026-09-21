import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics } from './lib/analytics'

// Analytics is worth having but never worth a slower first paint, so it waits
// for the browser to be idle. Events fired before it is ready are queued.
if (typeof window.requestIdleCallback === 'function') {
  window.requestIdleCallback(() => initAnalytics(), { timeout: 5000 })
} else {
  window.setTimeout(() => initAnalytics(), 2000)
}

// Registered after load so it never competes with the first render. In dev the
// worker would serve stale modules straight past Vite's HMR, so it only runs in
// a real build — and any previously registered one is torn down.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline support is a bonus; the app works without it */
      })
    } else {
      void navigator.serviceWorker
        .getRegistrations()
        .then(rs => rs.forEach(r => void r.unregister()))
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
