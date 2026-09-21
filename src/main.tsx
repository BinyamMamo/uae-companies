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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
