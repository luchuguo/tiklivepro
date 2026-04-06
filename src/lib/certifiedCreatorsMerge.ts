/** 与 Supabase 返回的 certified_creators + influencers 嵌套结构合并为前台卡片数据 */

export type InfluencerCardFields = {
  id: string
  nickname?: string | null
  real_name?: string | null
  avatar_url?: string | null
  rating?: number | null
  total_reviews?: number | null
  hourly_rate?: number | null
  followers_count?: number | null
  bio?: string | null
  is_verified?: boolean | null
  is_approved?: boolean | null
  location?: string | null
  categories?: string[] | null
  experience_years?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export type CertifiedRowNested = {
  influencer_id: string
  sort_order: number
  display_nickname?: string | null
  avatar_url?: string | null
  country?: string | null
  industry_categories?: string[] | null
  listing_price?: number | string | null
  tiktok_followers_count?: number | null
  display_rating?: number | string | null
  influencers?: InfluencerCardFields | InfluencerCardFields[] | null
}

function normalizeInf(
  nested: InfluencerCardFields | InfluencerCardFields[] | null | undefined
): InfluencerCardFields | null {
  if (!nested) return null
  return Array.isArray(nested) ? nested[0] ?? null : nested
}

export function mergeCertifiedCreatorDisplay(row: CertifiedRowNested): InfluencerCardFields {
  const base = normalizeInf(row.influencers) || {}
  const categories =
    row.industry_categories && row.industry_categories.length > 0
      ? row.industry_categories
      : base.categories ?? []

  const listing =
    row.listing_price != null && row.listing_price !== ''
      ? Number(row.listing_price)
      : null
  const ratingOverride =
    row.display_rating != null && row.display_rating !== ''
      ? Number(row.display_rating)
      : null

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
