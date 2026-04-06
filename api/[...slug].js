import { handlersBySlug } from '../lib/vercel-api/handlers.js'

/**
 * 单一 Serverless Function：Hobby 计划最多 12 个，此前 api/*.js 每文件算 1 个。
 * 所有 /api/<name>?... 仍与原来一致，仅首段路径用于路由。
 */
export default async function handler(req, res) {
  const raw = req.query.slug
  let key = ''
  if (Array.isArray(raw)) key = raw[0] || ''
  else if (typeof raw === 'string') key = raw.split('/').filter(Boolean)[0] || ''

  const h = key ? handlersBySlug[key] : null
  if (!h) {
    res.setHeader('Content-Type', 'application/json')
    return res.status(404).json({ error: 'API route not found', path: key || null })
  }
  return h(req, res)
}
