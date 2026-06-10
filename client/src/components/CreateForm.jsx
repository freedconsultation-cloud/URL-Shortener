import { useState } from 'react'

export default function CreateForm({ onCreated }) {
  const [url, setUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setCreated(null)

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          slug: slug.trim() || undefined,
          expiresAt: expiresAt || undefined
        })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setCreated(data)
      setUrl('')
      setSlug('')
      setExpiresAt('')
      onCreated()
    } catch {
      setError('Network error — is the server running?')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(created.shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-xl p-5 sm:p-6 space-y-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
        Shorten a URL
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="url"
          placeholder="https://your-long-url.com/..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono select-none"
              style={{ color: 'var(--text-muted)' }}
            >
              /
            </span>
            <input
              type="text"
              placeholder="custom-slug (optional)"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full pl-6 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
          <div className="flex-1 space-y-0.5">
            <label className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Expires (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {loading ? 'Shortening…' : 'Shorten URL'}
        </button>
      </form>

      {error && (
        <p
          className="text-sm px-4 py-3 rounded-lg"
          style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149' }}
        >
          {error}
        </p>
      )}

      {created && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)' }}
        >
          <a
            href={created.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-sm font-medium truncate hover:opacity-70 transition-opacity"
            style={{ color: '#3fb950' }}
          >
            {created.shortUrl}
          </a>
          <button
            onClick={copy}
            className="text-xs px-3 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-70"
            style={{
              background: 'var(--surface-2)',
              color: copied ? '#3fb950' : 'var(--text-muted)',
              border: '1px solid var(--border)'
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}
