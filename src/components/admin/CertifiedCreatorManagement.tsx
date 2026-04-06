import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Upload,
  Download,
  Loader,
  UserCheck,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

type InfluencerBrief = {
  id: string
  nickname: string
  avatar_url?: string
  followers_count?: number
  is_approved?: boolean
}

export type CertifiedCreatorRow = {
  id: string
  influencer_id: string
  sort_order: number
  notes: string | null
  is_active: boolean
  display_nickname: string | null
  avatar_url: string | null
  country: string | null
  industry_categories: string[] | null
  listing_price: number | null
  tiktok_followers_count: number | null
  display_rating: number | null
  created_at: string
  updated_at: string
  influencers: InfluencerBrief | null
}

/** 下载用模板：含 # 说明行；导入时会自动跳过说明行与占位 UUID */
const PLACEHOLDER_INFLUENCER_ID = '00000000-0000-0000-0000-000000000000'

const CSV_TEMPLATE = `# =============================================================================
# Tkbubu 认证达人 — 批量导入 CSV 模板
# =============================================================================
# 【必填】influencer_id：达人在表 influencers 中的 UUID
# 【选填】sort_order / notes / is_active（同前）
# 【选填】前台展示覆盖（空则使用 influencers 对应字段）：
#   display_nickname, avatar_url, country
#   industry_categories：多个分类用 | 或 ; 分隔，如 beauty|fashion
#   listing_price：标价 USD（数字）
#   tiktok_followers_count：粉丝数（整数）
#   display_rating：展示评分，如 4.8
#
# =============================================================================

influencer_id,sort_order,notes,is_active,display_nickname,avatar_url,country,industry_categories,listing_price,tiktok_followers_count,display_rating
${PLACEHOLDER_INFLUENCER_ID},0,"示例占位，请删除本行",true,,,,,,,
`

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim().replace(/^"|"$/g, ''))
      cur = ''
    } else {
      cur += c
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, ''))
  return result
}

function parseCategoriesCell(s: string | undefined): string[] | null {
  if (!s || !String(s).trim()) return null
  return String(s)
    .split(/[|;]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

async function setInfluencerVerified(influencerId: string, verified: boolean) {
  const { error } = await supabase.from('influencers').update({ is_verified: verified }).eq('id', influencerId)
  if (error) console.warn('更新达人 is_verified 失败:', error)
}

export function CertifiedCreatorManagement() {
  const [rows, setRows] = useState<CertifiedCreatorRow[]>([])
  const [influencers, setInfluencers] = useState<InfluencerBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState<CertifiedCreatorRow | null>(null)
  const [delRow, setDelRow] = useState<CertifiedCreatorRow | null>(null)

  const [addInfluencerId, setAddInfluencerId] = useState('')
  const [addSort, setAddSort] = useState(0)
  const [addNotes, setAddNotes] = useState('')
  const [addActive, setAddActive] = useState(true)
  const [addDisplayName, setAddDisplayName] = useState('')
  const [addAvatarUrl, setAddAvatarUrl] = useState('')
  const [addCountry, setAddCountry] = useState('')
  const [addIndustryCats, setAddIndustryCats] = useState('')
  const [addListingPrice, setAddListingPrice] = useState('')
  const [addTiktokFollowers, setAddTiktokFollowers] = useState('')
  const [addDisplayRating, setAddDisplayRating] = useState('')

  const [editSort, setEditSort] = useState(0)
  const [editNotes, setEditNotes] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editIndustryCats, setEditIndustryCats] = useState('')
  const [editListingPrice, setEditListingPrice] = useState('')
  const [editTiktokFollowers, setEditTiktokFollowers] = useState('')
  const [editDisplayRating, setEditDisplayRating] = useState('')

  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('certified_creators')
        .select(
          `
          id,
          influencer_id,
          sort_order,
          notes,
          is_active,
          display_nickname,
          avatar_url,
          country,
          industry_categories,
          listing_price,
          tiktok_followers_count,
          display_rating,
          created_at,
          updated_at,
          influencers (
            id,
            nickname,
            avatar_url,
            followers_count,
            is_approved
          )
        `
        )
        .order('sort_order', { ascending: true })

      if (err) throw err
      const normalized = ((data as CertifiedCreatorRow[]) || []).map((row) => ({
        ...row,
        display_nickname: row.display_nickname ?? null,
        avatar_url: row.avatar_url ?? null,
        country: row.country ?? null,
        industry_categories: row.industry_categories ?? null,
        listing_price: row.listing_price ?? null,
        tiktok_followers_count: row.tiktok_followers_count ?? null,
        display_rating: row.display_rating ?? null,
        influencers: Array.isArray(row.influencers)
          ? row.influencers[0] ?? null
          : row.influencers ?? null,
      }))
      setRows(normalized)
    } catch (e: unknown) {
      console.error(e)
      setError(e instanceof Error ? e.message : '加载失败，请确认已执行 certified_creators 表 SQL')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInfluencers = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('influencers')
        .select('id, nickname, avatar_url, followers_count, is_approved')
        .eq('is_approved', true)
        .order('nickname', { ascending: true })
      if (err) throw err
      setInfluencers(data || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchRows()
    fetchInfluencers()
  }, [fetchRows, fetchInfluencers])

  const certifiedIds = useMemo(() => new Set(rows.map((r) => r.influencer_id)), [rows])

  const availableToAdd = useMemo(
    () => influencers.filter((i) => !certifiedIds.has(i.id)),
    [influencers, certifiedIds]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const nick = r.influencers?.nickname?.toLowerCase() || ''
      const display = (r.display_nickname || '').toLowerCase()
      const id = r.influencer_id.toLowerCase()
      const country = (r.country || '').toLowerCase()
      return (
        nick.includes(q) ||
        display.includes(q) ||
        id.includes(q) ||
        country.includes(q) ||
        (r.notes || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  const handleAdd = async () => {
    if (!addInfluencerId) {
      setError('请选择达人')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const parseNum = (v: string) => {
        const t = v.trim()
        if (!t) return null
        const n = parseFloat(t)
        return Number.isFinite(n) ? n : null
      }
      const parseIntOpt = (v: string) => {
        const t = v.trim()
        if (!t) return null
        const n = parseInt(t, 10)
        return Number.isFinite(n) ? n : null
      }
      const cats = parseCategoriesCell(addIndustryCats)
      const { error: err } = await supabase.from('certified_creators').insert({
        influencer_id: addInfluencerId,
        sort_order: addSort,
        notes: addNotes || null,
        is_active: addActive,
        display_nickname: addDisplayName.trim() || null,
        avatar_url: addAvatarUrl.trim() || null,
        country: addCountry.trim() || null,
        industry_categories: cats,
        listing_price: parseNum(addListingPrice),
        tiktok_followers_count: parseIntOpt(addTiktokFollowers),
        display_rating: parseNum(addDisplayRating),
      })
      if (err) throw err
      await setInfluencerVerified(addInfluencerId, true)
      setSuccess('已添加认证达人')
      setShowAdd(false)
      setAddInfluencerId('')
      setAddSort(0)
      setAddNotes('')
      setAddActive(true)
      setAddDisplayName('')
      setAddAvatarUrl('')
      setAddCountry('')
      setAddIndustryCats('')
      setAddListingPrice('')
      setAddTiktokFollowers('')
      setAddDisplayRating('')
      await fetchRows()
      await fetchInfluencers()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '添加失败')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (r: CertifiedCreatorRow) => {
    setShowEdit(r)
    setEditSort(r.sort_order)
    setEditNotes(r.notes || '')
    setEditActive(r.is_active)
    setEditDisplayName(r.display_nickname || '')
    setEditAvatarUrl(r.avatar_url || '')
    setEditCountry(r.country || '')
    setEditIndustryCats(r.industry_categories?.join('|') || '')
    setEditListingPrice(r.listing_price != null ? String(r.listing_price) : '')
    setEditTiktokFollowers(r.tiktok_followers_count != null ? String(r.tiktok_followers_count) : '')
    setEditDisplayRating(r.display_rating != null ? String(r.display_rating) : '')
  }

  const handleUpdate = async () => {
    if (!showEdit) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const parseNum = (v: string) => {
        const t = v.trim()
        if (!t) return null
        const n = parseFloat(t)
        return Number.isFinite(n) ? n : null
      }
      const parseIntOpt = (v: string) => {
        const t = v.trim()
        if (!t) return null
        const n = parseInt(t, 10)
        return Number.isFinite(n) ? n : null
      }
      const cats = parseCategoriesCell(editIndustryCats)
      const { error: err } = await supabase
        .from('certified_creators')
        .update({
          sort_order: editSort,
          notes: editNotes || null,
          is_active: editActive,
          display_nickname: editDisplayName.trim() || null,
          avatar_url: editAvatarUrl.trim() || null,
          country: editCountry.trim() || null,
          industry_categories: cats,
          listing_price: parseNum(editListingPrice),
          tiktok_followers_count: parseIntOpt(editTiktokFollowers),
          display_rating: parseNum(editDisplayRating),
        })
        .eq('id', showEdit.id)
      if (err) throw err
      await setInfluencerVerified(showEdit.influencer_id, editActive)
      setSuccess('已保存')
      setShowEdit(null)
      await fetchRows()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!delRow) return
    setSaving(true)
    setError(null)
    try {
      const infId = delRow.influencer_id
      const { error: err } = await supabase.from('certified_creators').delete().eq('id', delRow.id)
      if (err) throw err
      await setInfluencerVerified(infId, false)
      setSuccess('已删除')
      setDelRow(null)
      await fetchRows()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '删除失败')
    } finally {
      setSaving(false)
    }
  }

  const downloadTemplate = () => {
    const bom = '\uFEFF'
    const blob = new Blob([bom + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'certified_creators_import_template.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const runBulkImport = async (text: string) => {
    const raw = text.split(/\r?\n/)
    const lines: string[] = []
    for (const line of raw) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      lines.push(line)
    }
    if (lines.length < 2) {
      setError('CSV 至少需要一行表头（influencer_id,...）+ 一行数据；# 开头的说明行可保留')
      return
    }
    const header = parseCsvLine(lines[0])
      .map((h) => h.replace(/^\uFEFF/, '').trim().toLowerCase())
    const idxId = header.indexOf('influencer_id')
    if (idxId < 0) {
      setError('缺少列 influencer_id')
      return
    }
    const idxSort = header.indexOf('sort_order')
    const idxNotes = header.indexOf('notes')
    const idxActive = header.indexOf('is_active')
    const idxDisplayName = header.indexOf('display_nickname')
    const idxAvatar = header.indexOf('avatar_url')
    const idxCountry = header.indexOf('country')
    const idxIndustry = header.indexOf('industry_categories')
    const idxPrice = header.indexOf('listing_price')
    const idxFollowers = header.indexOf('tiktok_followers_count')
    const idxRating = header.indexOf('display_rating')

    const rowsToUpsert: Record<string, string | number | boolean | string[] | null>[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i])
      if (!cols[idxId]) continue
      const influencer_id = cols[idxId].replace(/^"|"$/g, '').trim()
      if (influencer_id === PLACEHOLDER_INFLUENCER_ID) continue
      const sort_order = idxSort >= 0 ? parseInt(cols[idxSort] || '0', 10) || 0 : 0
      const notes = idxNotes >= 0 ? (cols[idxNotes] || '').replace(/^"|"$/g, '') || null : null
      let is_active = true
      if (idxActive >= 0) {
        const v = (cols[idxActive] || 'true').toLowerCase()
        is_active = v === 'true' || v === '1' || v === 'yes'
      }
      const row: Record<string, string | number | boolean | string[] | null> = {
        influencer_id,
        sort_order,
        notes,
        is_active,
      }
      if (idxDisplayName >= 0) {
        const v = (cols[idxDisplayName] || '').trim()
        row.display_nickname = v || null
      }
      if (idxAvatar >= 0) {
        const v = (cols[idxAvatar] || '').trim()
        row.avatar_url = v || null
      }
      if (idxCountry >= 0) {
        const v = (cols[idxCountry] || '').trim()
        row.country = v || null
      }
      if (idxIndustry >= 0) {
        row.industry_categories = parseCategoriesCell(cols[idxIndustry] || '')
      }
      if (idxPrice >= 0) {
        const t = (cols[idxPrice] || '').trim()
        row.listing_price = t ? parseFloat(t) : null
        if (row.listing_price !== null && !Number.isFinite(row.listing_price as number)) row.listing_price = null
      }
      if (idxFollowers >= 0) {
        const t = (cols[idxFollowers] || '').trim()
        row.tiktok_followers_count = t ? parseInt(t, 10) : null
        if (row.tiktok_followers_count !== null && !Number.isFinite(row.tiktok_followers_count as number)) {
          row.tiktok_followers_count = null
        }
      }
      if (idxRating >= 0) {
        const t = (cols[idxRating] || '').trim()
        row.display_rating = t ? parseFloat(t) : null
        if (row.display_rating !== null && !Number.isFinite(row.display_rating as number)) row.display_rating = null
      }
      rowsToUpsert.push(row)
    }

    if (!rowsToUpsert.length) {
      setError('没有可导入的数据行')
      return
    }

    setImporting(true)
    setError(null)
    setSuccess(null)
    try {
      const { error: err } = await supabase.from('certified_creators').upsert(rowsToUpsert, {
        onConflict: 'influencer_id',
      })
      if (err) throw err
      for (const row of rowsToUpsert) {
        await setInfluencerVerified(row.influencer_id, row.is_active)
      }
      setSuccess(`批量导入完成：${rowsToUpsert.length} 条`)
      setImportText('')
      await fetchRows()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-pink-600" />
              认证达人
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              维护前台「Certified Creator」专区展示名单。批量导入请先下载 CSV 模板（含字段说明与示例），填好后粘贴或上传文件。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAdd(true)
                setError(null)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium hover:opacity-95"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
            <button
              type="button"
              onClick={fetchRows}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {(error || success) && (
            <div
              className={`p-3 rounded-lg text-sm ${error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
            >
              {error || success}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="搜索昵称、达人 ID、备注…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* 批量导入 */}
          <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-sm font-medium text-gray-800">批量导入（CSV）</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700"
                >
                  <Download className="w-4 h-4" />
                  下载模板
                </button>
              </div>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="粘贴 CSV 内容，或从模板文件复制…"
              rows={4}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                选择文件
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const reader = new FileReader()
                    reader.onload = () => setImportText(String(reader.result || ''))
                    reader.readAsText(f)
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                type="button"
                disabled={importing || !importText.trim()}
                onClick={() => runBulkImport(importText)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
              >
                {importing ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                开始导入
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">排序</th>
                  <th className="px-4 py-3 font-medium">前台展示</th>
                  <th className="px-4 py-3 font-medium">国家</th>
                  <th className="px-4 py-3 font-medium">标价</th>
                  <th className="px-4 py-3 font-medium">粉丝</th>
                  <th className="px-4 py-3 font-medium">influencer_id</th>
                  <th className="px-4 py-3 font-medium">启用</th>
                  <th className="px-4 py-3 font-medium">备注</th>
                  <th className="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-pink-500" />
                      加载中…
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      暂无数据，请先执行 SQL 建表并添加记录
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => {
                    const showAvatar = r.avatar_url || r.influencers?.avatar_url
                    const showName = r.display_nickname || r.influencers?.nickname || '—'
                    const showPrice =
                      r.listing_price != null ? `$${r.listing_price}` : '—'
                    const showFollowers =
                      r.tiktok_followers_count != null
                        ? r.tiktok_followers_count
                        : (r.influencers?.followers_count ?? '—')
                    return (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                      <td className="px-4 py-3 whitespace-nowrap">{r.sort_order}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {showAvatar ? (
                            <img
                              src={showAvatar}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-200" />
                          )}
                          <span className="font-medium text-gray-900">{showName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.country || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{showPrice}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{showFollowers}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[200px] truncate">
                        {r.influencer_id}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                            r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.is_active ? '是' : '否'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={r.notes || ''}>
                        {r.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDelRow(r)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 添加 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h4 className="text-lg font-semibold mb-4">添加认证达人</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">选择达人（已审核且未在列表中）</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={addInfluencerId}
                  onChange={(e) => setAddInfluencerId(e.target.value)}
                >
                  <option value="">请选择</option>
                  {availableToAdd.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nickname} ({i.followers_count ?? 0} 粉丝)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">排序（越小越靠前）</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={addSort}
                  onChange={(e) => setAddSort(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <p className="text-xs text-gray-500">以下为前台展示覆盖，留空则使用达人档案中的数据</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">展示昵称</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={addDisplayName}
                  onChange={(e) => setAddDisplayName(e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">头像 URL</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={addAvatarUrl}
                  onChange={(e) => setAddAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">国家/地区</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={addCountry}
                  onChange={(e) => setAddCountry(e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">行业分类（| 或 ; 分隔）</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={addIndustryCats}
                  onChange={(e) => setAddIndustryCats(e.target.value)}
                  placeholder="beauty|fashion"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">标价 USD</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={addListingPrice}
                    onChange={(e) => setAddListingPrice(e.target.value)}
                    placeholder="可选"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">TikTok 粉丝数</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={addTiktokFollowers}
                    onChange={(e) => setAddTiktokFollowers(e.target.value)}
                    placeholder="可选"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">展示评分</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={addDisplayRating}
                  onChange={(e) => setAddDisplayRating(e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">备注</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={addActive} onChange={(e) => setAddActive(e.target.checked)} />
                启用（前台仅展示启用的记录）
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                取消
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm disabled:opacity-50"
              >
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑 */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h4 className="text-lg font-semibold mb-2">编辑认证展示</h4>
            <p className="text-sm text-gray-600 mb-4">
              {showEdit.display_nickname || showEdit.influencers?.nickname || showEdit.influencer_id}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">排序</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={editSort}
                  onChange={(e) => setEditSort(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <p className="text-xs text-gray-500">以下为前台展示覆盖，留空则使用达人档案</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">展示昵称</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">头像 URL</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">国家/地区</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">行业分类（| 或 ; 分隔）</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={editIndustryCats}
                  onChange={(e) => setEditIndustryCats(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">标价 USD</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={editListingPrice}
                    onChange={(e) => setEditListingPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">TikTok 粉丝数</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={editTiktokFollowers}
                    onChange={(e) => setEditTiktokFollowers(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">展示评分</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={editDisplayRating}
                  onChange={(e) => setEditDisplayRating(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">备注</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                启用
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowEdit(null)} className="px-4 py-2 text-sm text-gray-600">
                取消
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleUpdate}
                className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm disabled:opacity-50"
              >
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {delRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h4 className="text-lg font-semibold mb-2">确认删除？</h4>
            <p className="text-sm text-gray-600 mb-4">
              将移除「{delRow.display_nickname || delRow.influencers?.nickname || delRow.influencer_id}」的认证记录，并同步取消达人 is_verified。
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDelRow(null)} className="px-4 py-2 text-sm text-gray-600">
                取消
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50"
              >
                {saving ? '删除中…' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
