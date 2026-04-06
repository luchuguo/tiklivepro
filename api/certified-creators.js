import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

function mergeCertifiedCreatorDisplay(row) {
  const inf = Array.isArray(row.influencers) ? row.influencers[0] : row.influencers
  const base = inf || {}
  const categories =
    row.industry_categories && row.industry_categories.length > 0
      ? row.industry_categories
      : base.categories ?? []

  const listing =
    row.listing_price != null && row.listing_price !== '' ? Number(row.listing_price) : null
  const ratingOverride =
    row.display_rating != null && row.display_rating !== '' ? Number(row.display_rating) : null

  return {
    id: row.influencer_id,
    nickname: row.display_nickname ?? base.nickname ?? 'Creator',
    real_name: base.real_name ?? null,
    avatar_url: row.avatar_url ?? base.avatar_url ?? null,
    rating: ratingOverride != null ? ratingOverride : Number(base.rating ?? 0),
    total_reviews: base.total_reviews ?? null,
    hourly_rate: listing != null ? listing : Number(base.hourly_rate ?? 0),
    followers_count:
      row.tiktok_followers_count != null
        ? row.tiktok_followers_count
        : Number(base.followers_count ?? 0),
    bio: base.bio ?? null,
    is_verified: base.is_verified ?? null,
    is_approved: base.is_approved ?? null,
    location: row.country != null && row.country !== '' ? row.country : base.location ?? null,
    categories,
    experience_years: base.experience_years ?? null,
    created_at: base.created_at ?? null,
    updated_at: base.updated_at ?? null,
  }
}

/**
 * GET: 认证达人列表（certified_creators 展示字段 + influencers 回退，仅 is_active 且达人已审核）
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase 配置错误' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: certs, error: certError } = await supabase
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

    if (certError) {
      console.error('certified_creators query:', certError)
      throw certError
    }

    if (!certs?.length) {
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate, public')
      return res.status(200).json([])
    }

    const orderMap = new Map(certs.map((c, i) => [c.influencer_id, i]))
    const list = []
    for (const row of certs) {
      const inf = Array.isArray(row.influencers) ? row.influencers[0] : row.influencers
      if (!inf?.is_approved) continue
      list.push(mergeCertifiedCreatorDisplay(row))
    }
    list.sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate, public')
    return res.status(200).json(list)
  } catch (error) {
    console.error('certified-creators API:', error)
    return res.status(500).json({
      error: error.message || 'Internal Server Error',
      message: '获取认证达人失败',
    })
  }
}
