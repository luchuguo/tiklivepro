import React, { useState, useEffect } from 'react'
import { Loader, AlertCircle, Video } from 'lucide-react'
import { supabase, TaskApplication, Task } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

// 达人用户专属：我的任务列表（已申请 / 已合作）
export function InfluencerTasksPage() {
  const { user, profile, isInfluencer } = useAuth()

  // 包含任务申请及关联任务对象
  const [applications, setApplications] = useState<(TaskApplication & { task: Task })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && isInfluencer) {
      fetchApplications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isInfluencer])

  // 获取当前达人申请的任务
  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)

      // 先取达人 ID
      const { data: influencerData, error: influencerErr } = await supabase
        .from('influencers')
        .select('id')
        .eq('user_id', user!.id)
        .single()

      if (influencerErr || !influencerData) {
        throw influencerErr || new Error('未找到达人信息，请先完善达人资料')
      }

      const influencerId = influencerData.id

      // 查询申请及关联任务
      const { data: apps, error: appsErr } = await supabase
        .from('task_applications')
        .select(`*, task:tasks(*)`)
        .eq('influencer_id', influencerId)
        .order('applied_at', { ascending: false })

      if (appsErr) throw appsErr

      setApplications((apps || []) as any)
    } catch (err: any) {
      console.error('加载任务申请失败:', err)
      setError(err.message || '加载任务申请失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isInfluencer) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        仅达人用户可访问此页面
      </div>
    )
  }

  const taskStatusMap: Record<string, string> = {
    open: '招募中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }

  const applicationStatusMap: Record<string, string> = {
    pending: '待审核',
    accepted: '已通过',
    refused: '已拒绝',
    withdrawn: '已撤回',
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Video className="w-6 h-6 text-pink-600" />
            <span>我的任务</span>
          </h1>
        </div>

        {/* 内容区域 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center text-gray-500 py-20">暂无任务申请或合作记录</div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-gray-100 shadow-sm rounded-lg p-6 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{app.task?.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">任务状态：{taskStatusMap[app.task?.status]}</p>
                  <p className="text-sm text-gray-500 mt-1">申请状态：{applicationStatusMap[app.status]}</p>
                </div>
                {app.proposed_rate !== null && (
                  <div className="text-sm text-gray-500">报价：¥{app.proposed_rate?.toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 