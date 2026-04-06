import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Star, Loader2, Users, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  mergeCertifiedCreatorDisplay,
  type InfluencerCardFields,
  type CertifiedRowNested,
} from '../../lib/certifiedCreatorsMerge'

function formatFollowers(n: number): string {
  if (n == null || Number.isNaN(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(n))
}

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

/** Match against category label text (substring, case-insensitive) */
const CONTENT_TYPES = [
  { id: 'all', name: 'All' },
  { id: 'beauty', name: 'Beauty & Skincare' },
  { id: 'fashion', name: 'Fashion & Apparel' },
  { id: 'food', name: 'Food & Lifestyle' },
  { id: 'digital', name: 'Digital & Tech' },
  { id: 'fitness', name: 'Fitness & Sports' },
  { id: 'maternal', name: 'Maternal & Baby' },
  { id: 'home', name: 'Home & Decor' },
  { id: 'books', name: 'Books & Education' },
]

const FOLLOWER_BUCKETS = [
  { id: 'all', label: 'All' },
  { id: 'lt10k', label: '< 10k' },
  { id: '10k100k', label: '10k – 100k' },
  { id: '100k1m', label: '100k – 1M' },
  { id: '1mplus', label: '1M+' },
]

const PRICE_BUCKETS = [
  { id: 'all', label: 'All' },
  { id: 'lt500', label: 'Under $500' },
  { id: '5002000', label: '$500 – $2,000' },
  { id: '2000plus', label: '$2,000+' },
]

function matchesFollowers(count: number, bucket: string): boolean {
  if (bucket === 'all') return true
  if (bucket === 'lt10k') return count < 10_000
  if (bucket === '10k100k') return count >= 10_000 && count < 100_000
  if (bucket === '100k1m') return count >= 100_000 && count < 1_000_000
  if (bucket === '1mplus') return count >= 1_000_000
  return true
}

function matchesPrice(rate: number, bucket: string): boolean {
  if (bucket === 'all') return true
  if (bucket === 'lt500') return rate < 500
  if (bucket === '5002000') return rate >= 500 && rate <= 2000
  if (bucket === '2000plus') return rate > 2000
  return true
}

export function CertifiedCreatorPage() {
  const [raw, setRaw] = useState<InfluencerCardFields[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set())

  const [contentType, setContentType] = useState('all')
  const [followers, setFollowers] = useState('all')
  const [locationQ, setLocationQ] = useState('')
  const [price, setPrice] = useState('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (import.meta.env.PROD) {
        const res = await fetch('/api/certified-creators', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setRaw(Array.isArray(data) ? data : [])
      } else {
        const { data: certs, error: certErr } = await supabase
          .from('certified_creators')
          .select(
            `
            influencer_id,
            sort_order,
            display_nickname,
            avatar_url,
            country,
            industry_categories,
            listing_price,
            tiktok_followers_count,
            display_rating,
            influencers (
              id,
              nickname,
              real_name,
              avatar_url,
              rating,
              total_reviews,
              hourly_rate,
              followers_count,
              bio,
              is_verified,
              is_approved,
              location,
              categories,
              experience_years,
              created_at,
              updated_at
            )
          `
          )
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (certErr) throw certErr
        if (!certs?.length) {
          setRaw([])
          return
        }

        const orderMap = new Map(certs.map((c, i) => [c.influencer_id, i]))
        const list: InfluencerCardFields[] = []
        for (const row of certs as CertifiedRowNested[]) {
          const inf = Array.isArray(row.influencers) ? row.influencers[0] : row.influencers
          if (!inf?.is_approved) continue
          list.push(mergeCertifiedCreatorDisplay(row))
        }
        list.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
        setRaw(list)
      }
    } catch (e: unknown) {
      console.error(e)
      setError('Failed to load certified creators')
      setRaw([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = useMemo(() => {
    const loc = locationQ.trim().toLowerCase()
    return raw.filter((inf) => {
      if (contentType !== 'all') {
        const q = contentType.toLowerCase()
        const ok = inf.categories?.some((c) => c.toLowerCase().includes(q))
        if (!ok) return false
      }
      if (!matchesFollowers(inf.followers_count || 0, followers)) return false
      if (!matchesPrice(inf.hourly_rate || 0, price)) return false
      if (loc && !(inf.location || '').toLowerCase().includes(loc)) return false
      return true
    })
  }, [raw, contentType, followers, price, locationQ])

  const clearAll = () => {
    setContentType('all')
    setFollowers('all')
    setLocationQ('')
    setPrice('all')
  }

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectClass =
    'w-full min-w-[148px] sm:min-w-[168px] appearance-none rounded-xl border border-gray-200/90 bg-gradient-to-b from-white to-gray-50/90 pl-4 pr-10 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-all duration-200 cursor-pointer hover:border-pink-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500/35 focus:border-pink-300'

  const inputClass =
    'w-full min-w-0 sm:min-w-[200px] rounded-xl border border-gray-200/90 bg-gradient-to-b from-white to-gray-50/90 px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-all duration-200 placeholder:text-gray-400 placeholder:font-normal hover:border-pink-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500/35 focus:border-pink-300'

  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-gray-500'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner — aligned with /influencers */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 via-purple-100/20 to-indigo-100/20" />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-pink-200 rounded-full opacity-20 animate-pulse" />
          <div
            className="absolute top-20 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute bottom-10 left-1/4 w-20 h-20 bg-indigo-200 rounded-full opacity-20 animate-pulse"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Certified{' '}
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Creator
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover platform-verified TikTok talent for live selling, campaigns, and long-term brand partnerships
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Verified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>High Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-gray-100 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-end gap-4 lg:gap-5">
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Content Type</span>
              <div className="relative group">
                <select
                  className={selectClass}
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                >
                  {CONTENT_TYPES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-pink-500"
                  aria-hidden
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Followers</span>
              <div className="relative group">
                <select className={selectClass} value={followers} onChange={(e) => setFollowers(e.target.value)}>
                  {FOLLOWER_BUCKETS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-pink-500"
                  aria-hidden
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:max-w-xs">
              <span className={labelClass}>Location</span>
              <input
                type="text"
                placeholder="City, state, country…"
                value={locationQ}
                onChange={(e) => setLocationQ(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Price</span>
              <div className="relative group">
                <select className={selectClass} value={price} onChange={(e) => setPrice(e.target.value)}>
                  {PRICE_BUCKETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-pink-500"
                  aria-hidden
                />
              </div>
            </div>
            <div className="flex-1 min-w-[1rem]" />
            <button
              type="button"
              onClick={clearAll}
              className="mb-0.5 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:border-pink-200 hover:bg-pink-50/80 hover:text-pink-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500/30 whitespace-nowrap"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <p className="text-red-600 text-sm mb-4" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">No certified creators match your filters.</p>
            <button type="button" onClick={clearAll} className="text-pink-600 font-medium hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
            {filtered.map((inf) => {
              const img =
                inf.avatar_url ||
                'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600'
              const categoriesLabel = inf.categories?.length
                ? inf.categories.slice(0, 3).join(', ')
                : 'Creator'
              const rate = inf.hourly_rate ?? 0
              const fav = favorites.has(inf.id)

              return (
                <Link
                  key={inf.id}
                  to={`/certified-creator/${inf.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-200">
                    {/* 裁掉图片底部约 1/8（不显示） */}
                    <img
                      src={img}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-top [clip-path:inset(0_0_12.5%_0)]"
                    />
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, inf.id)}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/35 text-white hover:bg-black/50 transition-colors"
                      aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-5 h-5 ${fav ? 'fill-red-500 text-red-500' : ''}`} strokeWidth={fav ? 0 : 2} />
                    </button>
                    {/* 渐变贴在「可见图片」下沿（与 clip 对齐） */}
                    <div className="absolute inset-x-0 bottom-[12.5%] bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-3 px-3 text-white">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TikTokGlyph className="w-4 h-4 shrink-0 text-white" />
                        <span>{formatFollowers(inf.followers_count || 0)}</span>
                      </div>
                      <div className="font-semibold text-base leading-tight mt-1 line-clamp-1">{inf.nickname}</div>
                      <div className="flex items-center gap-1 mt-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                        <span>{(inf.rating ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between gap-2 items-start">
                      <p className="text-xs text-gray-800 line-clamp-2 leading-snug flex-1 min-w-0">{categoriesLabel}</p>
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        ${rate.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-1">{inf.location || '—'}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
