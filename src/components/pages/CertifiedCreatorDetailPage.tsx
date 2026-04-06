import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  MapPin,
  Lock,
  Award,
  Loader2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import {
  mergeCertifiedCreatorDisplay,
  type CertifiedRowNested,
  type InfluencerCardFields,
} from '../../lib/certifiedCreatorsMerge'

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

function formatFollowers(n: number): string {
  if (n == null || Number.isNaN(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(n))
}

type ReviewRow = { id: string; rating: number; comment?: string | null; created_at?: string }

/** 暂时隐藏 Portfolio；接入 certified_creator_portfolio 后改为 true */
const SHOW_PORTFOLIO = false

export function CertifiedCreatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [display, setDisplay] = useState<InfluencerCardFields | null>(null)
  const [bio, setBio] = useState<string | null>(null)
  const [realName, setRealName] = useState<string | null>(null)
  const [totalReviews, setTotalReviews] = useState(0)
  const [reviews, setReviews] = useState<ReviewRow[]>([])

  const load = useCallback(async () => {
    if (!id) {
      setError('Invalid creator')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: row, error: qErr } = await supabase
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
        .eq('influencer_id', id)
        .eq('is_active', true)
        .maybeSingle()

      if (qErr) throw qErr
      if (!row) {
        setError('not_found')
        setDisplay(null)
        return
      }

      const nested = row as unknown as CertifiedRowNested
      const inf = Array.isArray(nested.influencers) ? nested.influencers[0] : nested.influencers
      if (!inf?.is_approved) {
        setError('not_found')
        setDisplay(null)
        return
      }

      setDisplay(mergeCertifiedCreatorDisplay(nested))
      setBio(inf.bio ?? null)
      setRealName(inf.real_name ?? null)
      setTotalReviews(inf.total_reviews ?? 0)

      const { data: revs, error: rErr } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('influencer_id', id)
        .order('created_at', { ascending: false })
        .limit(12)

      if (!rErr && revs) {
        setReviews(revs as ReviewRow[])
      } else {
        if (rErr) console.warn('reviews:', rErr)
        setReviews([])
      }
    } catch (e: unknown) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to load')
      setDisplay(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const tiktokLivePrice = useMemo(
    () => Math.round(Math.max(0, display?.hourly_rate ?? 0)),
    [display?.hourly_rate]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    )
  }

  if (error === 'not_found' || !display) {
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex flex-col items-center justify-center px-4">
        <p className="text-gray-700 mb-4">This creator is not available in Certified Creator.</p>
        <Link to="/certified-creator" className="text-pink-600 font-medium hover:underline">
          Back to Certified Creators
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex flex-col items-center justify-center px-4">
        <p className="text-red-600 mb-4">{error}</p>
        <button type="button" onClick={() => load()} className="text-pink-600 font-medium">
          Retry
        </button>
      </div>
    )
  }

  const avatar =
    display.avatar_url ||
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
  const locationLine = display.location || '—'
  const categories = display.categories ?? []
  const headerName = display.nickname || 'Creator'

  return (
    <div className="min-h-screen bg-[#f7f7f8] pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          type="button"
          onClick={() => navigate('/certified-creator')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Certified Creators
        </button>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
          {/* —— Left column —— */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <img
                src={avatar}
                alt=""
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{headerName}</h1>
                {realName && realName !== display?.nickname && (
                  <p className="text-sm text-gray-500 mt-1">{realName}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-gray-900">{(display.rating ?? 0).toFixed(1)}</span>
                    <span className="text-gray-400">·</span>
                    <span>{totalReviews} Reviews</span>
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                    {locationLine}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-gray-800">
                    <TikTokGlyph className="w-4 h-4" />
                    {formatFollowers(display.followers_count || 0)} followers
                  </span>
                </div>
              </div>
            </div>

            {/* Top Creator badge */}
            <div className="mt-8 rounded-xl border border-pink-100 bg-gradient-to-r from-pink-50/90 to-purple-50/80 px-4 py-3 flex items-start gap-3">
              <Award className="w-6 h-6 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">
                  {display.nickname} is a <span className="text-pink-600">Top Creator</span>
                </p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Verified by Tkbubu for consistent performance, professional collaboration, and audience quality in
                  live commerce and branded content.
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-10">
              <h2 className="sr-only">About</h2>
              <div className="prose prose-gray max-w-none text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                {bio ||
                  `${display.nickname} creates engaging short-form content across TikTok and other platforms, with a focus on authentic storytelling and conversion-focused live sessions. Book a package to get started.`}
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-12 relative">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{totalReviews} Reviews</h2>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${s <= Math.round(display.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="relative min-h-[200px] rounded-xl border border-gray-100 bg-white overflow-hidden">
                <div className={`p-4 space-y-4 ${!user ? 'blur-sm pointer-events-none select-none' : ''}`}>
                  {reviews.length === 0 ? (
                    <p className="text-sm text-gray-500">No reviews yet.</p>
                  ) : (
                    reviews.slice(0, 4).map((r) => (
                      <div key={r.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-900">{r.rating.toFixed(1)}</span>
                          <span className="text-gray-400 text-xs">{r.created_at?.slice(0, 10)}</span>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                      </div>
                    ))
                  )}
                </div>

                {!user && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/55 text-center px-6">
                    <Lock className="w-10 h-10 text-white/90 mb-3" />
                    <p className="text-white text-sm font-medium max-w-sm">
                      Create a free account to unlock reviews for certified creators.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/signup')}
                      className="mt-4 rounded-full bg-white text-gray-900 text-sm font-semibold px-5 py-2 hover:bg-gray-100"
                    >
                      Sign up free
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Related categories */}
            {categories.length > 0 && (
              <div className="mt-12">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Related categories</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 8).map((c) => (
                    <Link
                      key={c}
                      to="/certified-creator"
                      className="inline-flex items-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium px-3 py-1.5 transition-colors"
                    >
                      Find {c} creators
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* —— Right column —— */}
          <aside className="w-full lg:w-[380px] shrink-0 space-y-8 lg:sticky lg:top-6">
            {SHOW_PORTFOLIO && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Portfolio</h2>
                <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="aspect-[4/5] bg-gray-200 overflow-hidden">
                      <img
                        src={`https://picsum.photos/seed/cert-${id}-${i}/600/750`}
                        alt=""
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-4xl font-bold text-gray-900 tracking-tight">${tiktokLivePrice.toLocaleString()}</p>

              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">TikTok Live (1 hour)</p>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Live selling session with product showcase and audience engagement.
                </p>
              </div>

              <Link
                to="/contact"
                className="mt-4 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold text-white shadow-md hover:opacity-95 transition-opacity"
                style={{
                  background: 'linear-gradient(to right, #ff5e92, #d13abd)',
                }}
              >
                Continue to book
              </Link>

              <Link
                to="/contact"
                className="mt-4 block w-full text-center text-sm font-medium text-pink-600 underline underline-offset-2 hover:text-pink-700"
              >
                Negotiate a package
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
