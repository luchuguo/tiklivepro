/**
 * 聚合 Vercel Serverless 业务处理器，供 api/[...slug].js 按首段 path 分发。
 * 逻辑文件放在 lib/vercel-api，避免 api/ 下多文件触发 Hobby 12 个 Function 上限。
 */
import tasks from './tasks.js'
import categories from './categories.js'
import certifiedCreators from './certified-creators.js'
import influencers from './influencers.js'
import videoDetail from './video-detail.js'
import indexVideos from './index-videos.js'
import videos from './videos.js'
import videoCategories from './video-categories.js'
import videoManagement from './video-management.js'
import companyDetail from './company-detail.js'
import influencerDetail from './influencer-detail.js'
import taskApplications from './task-applications.js'
import taskDetail from './task-detail.js'

export const handlersBySlug = {
  tasks,
  categories,
  'certified-creators': certifiedCreators,
  influencers,
  'video-detail': videoDetail,
  'index-videos': indexVideos,
  videos,
  'video-categories': videoCategories,
  'video-management': videoManagement,
  'company-detail': companyDetail,
  'influencer-detail': influencerDetail,
  'task-applications': taskApplications,
  'task-detail': taskDetail,
}
