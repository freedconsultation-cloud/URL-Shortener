import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ClickChart({ slug, onClose }) {
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/links/${slug}/clicks`)
      .then(r => r.json())
      .then(data => { setClicks(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  // Group by day
  const byDay = clicks.reduce((acc, c) => {
    const day = new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})
  const chartData = Object.entries(byDay).map(([date, count]) => ({ date, count }))

  // Group by country
  const byCountry = clicks.reduce((acc, c) => {
    const country = c.country || 'Unknown'
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {})
  const countryData = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxCountry = countryData[0]?.[1] || 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Analytics
            </p>
            <p className="font-mono text-sm mt-0.5" style={{ color: 'var(--foreground)' }}>/{slug}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-black leading-none" style={{ color: 'var(--foreground)' }}>
                {clicks.length}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>total clicks</p>
            </div>
            <button
              onClick={onClose}
              className="text-sm px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : clicks.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
            No clicks yet.
          </p>
        ) : (
          <>
            {/* Clicks per day bar chart */}
            {chartData.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                  Clicks per day
                </p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: -24 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#8b949e' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8b949e' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#21262d',
                        border: '1px solid #30363d',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                      labelStyle={{ color: '#e6edf3' }}
                      itemStyle={{ color: '#F88379' }}
                      cursor={{ fill: 'rgba(248,131,121,0.08)' }}
                    />
                    <Bar dataKey="count" name="Clicks" fill="#F88379" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Country breakdown */}
            {countryData.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                  Top countries
                </p>
                <div className="space-y-2">
                  {countryData.map(([country, count]) => (
                    <div key={country} className="flex items-center gap-3">
                      <span
                        className="text-xs w-28 truncate shrink-0"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {country}
                      </span>
                      <div
                        className="flex-1 rounded-full h-1.5 overflow-hidden"
                        style={{ background: 'var(--surface-2)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(count / maxCountry) * 100}%`,
                            background: 'var(--accent)'
                          }}
                        />
                      </div>
                      <span
                        className="text-xs w-6 text-right shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
