import { useState, useEffect } from 'react'
import CreateForm from './components/CreateForm'
import LinkTable from './components/LinkTable'
import ClickChart from './components/ClickChart'

export default function App() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSlug, setSelectedSlug] = useState(null)

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/links')
      const data = await res.json()
      setLinks(Array.isArray(data) ? data : [])
    } catch {
      setLinks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLinks() }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-8 py-4"
        style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}
      >
        <span className="font-bold font-mono text-sm" style={{ color: 'var(--accent)' }}>🔗 snip.</span>
        <div className="flex items-center gap-4">
          <span className="text-xs hidden sm:inline" style={{ color: 'var(--border)' }}>url-shortener-freed.railway.app</span>
          <a
            href="https://freedprojects.vercel.app"
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Portfolio
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            URL Shortener
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Shorten long URLs, track clicks by country, and generate QR codes.
          </p>
        </div>

        <CreateForm onCreated={fetchLinks} />
        <LinkTable
          links={links}
          loading={loading}
          onDeleted={fetchLinks}
          onSelect={setSelectedSlug}
        />
      </div>

      {selectedSlug && (
        <ClickChart slug={selectedSlug} onClose={() => setSelectedSlug(null)} />
      )}
    </div>
  )
}
