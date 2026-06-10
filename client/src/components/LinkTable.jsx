import { useState } from 'react'

export default function LinkTable({ links, loading, onDeleted, onSelect }) {
  const [qr, setQr] = useState(null)
  const [deleting, setDeleting] = useState(null)

  async function handleDelete(slug) {
    setDeleting(slug)
    await fetch(`/api/links/${slug}`, { method: 'DELETE' })
    setDeleting(null)
    onDeleted()
  }

  async function handleQR(slug) {
    const res = await fetch(`/api/links/${slug}/qr`)
    const data = await res.json()
    setQr({ slug, img: data.qr, url: data.url })
  }

  function downloadQR() {
    const a = document.createElement('a')
    a.href = qr.img
    a.download = `qr-${qr.slug}.png`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!links.length) {
    return (
      <div
        className="rounded-xl px-5 py-12 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No links yet — shorten your first URL above.
        </p>
      </div>
    )
  }

  const expiredStyle = { color: '#f85149' }

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            Your Links
          </p>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {links.length} {links.length === 1 ? 'link' : 'links'}
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                {['Slug', 'Destination', 'Clicks', 'Created', 'Expires', ''].map(h => (
                  <th
                    key={h}
                    className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${h === 'Clicks' ? 'text-center' : 'text-left'}`}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((link, i) => {
                const expired = link.expiresAt && new Date(link.expiresAt) < new Date()
                return (
                  <tr
                    key={link.id}
                    style={{
                      background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
                      borderBottom: i < links.length - 1 ? '1px solid var(--border)' : 'none',
                      opacity: expired ? 0.6 : 1
                    }}
                  >
                    <td className="px-5 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      /{link.slug}
                    </td>
                    <td className="px-5 py-3 max-w-[200px]">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs truncate block hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {link.url}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => onSelect(link.slug)}
                        className="text-sm font-bold hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--foreground)' }}
                        title="View analytics"
                      >
                        {link.clickCount}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-xs whitespace-nowrap" style={expired ? expiredStyle : { color: 'var(--text-muted)' }}>
                      {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => onSelect(link.slug)}
                          className="text-[11px] px-2 py-1 rounded transition-opacity hover:opacity-70"
                          style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          Stats
                        </button>
                        <button
                          onClick={() => handleQR(link.slug)}
                          className="text-[11px] px-2 py-1 rounded transition-opacity hover:opacity-70"
                          style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          QR
                        </button>
                        <button
                          onClick={() => handleDelete(link.slug)}
                          disabled={deleting === link.slug}
                          className="text-[11px] px-2 py-1 rounded transition-opacity hover:opacity-70 disabled:opacity-40"
                          style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.2)' }}
                        >
                          {deleting === link.slug ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden" style={{ background: 'var(--surface)' }}>
          {links.map((link, i) => {
            const expired = link.expiresAt && new Date(link.expiresAt) < new Date()
            return (
              <div
                key={link.id}
                className="p-4 space-y-2.5"
                style={{
                  borderBottom: i < links.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: expired ? 0.6 : 1
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>
                    /{link.slug}
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                    {link.clickCount} clicks
                  </span>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs block truncate"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {link.url}
                </a>
                <div className="flex gap-2 pt-0.5">
                  <button
                    onClick={() => onSelect(link.slug)}
                    className="flex-1 text-xs py-1.5 rounded-lg"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    Stats
                  </button>
                  <button
                    onClick={() => handleQR(link.slug)}
                    className="flex-1 text-xs py-1.5 rounded-lg"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    QR Code
                  </button>
                  <button
                    onClick={() => handleDelete(link.slug)}
                    disabled={deleting === link.slug}
                    className="flex-1 text-xs py-1.5 rounded-lg disabled:opacity-40"
                    style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.2)' }}
                  >
                    {deleting === link.slug ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* QR Modal */}
      {qr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setQr(null)}
        >
          <div
            className="rounded-2xl p-6 space-y-4 w-full max-w-xs"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-center" style={{ color: 'var(--foreground)' }}>QR Code</p>
            <p className="text-xs text-center font-mono" style={{ color: 'var(--accent)' }}>/{qr.slug}</p>
            <img src={qr.img} alt="QR code" className="w-full rounded-xl" />
            <p className="text-[11px] text-center break-all" style={{ color: 'var(--text-muted)' }}>{qr.url}</p>
            <button
              onClick={downloadQR}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              ↓ Download PNG
            </button>
            <button
              onClick={() => setQr(null)}
              className="w-full py-1.5 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
