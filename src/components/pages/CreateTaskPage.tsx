import React, { useState, useEffect } from 'react'
import { ArrowLeft, Loader, Save } from 'lucide-react'
import { supabase, Company, TaskCategory } from '../../lib/supabase'

interface CreateTaskPageProps {
  company: Company | null
  onBack: () => void
}

export function CreateTaskPage({ company, onBack }: CreateTaskPageProps) {
  /* 表单状态 */
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    product_name: '',
    requirements: '',
    budget_min: 0,
    budget_max: 0,
    max_applicants: 5,
    live_date: '',
    is_urgent: false,
    is_advance_paid: false,
    paid_amount: 0
  })

  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /* 获取任务分类 */
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('task_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      setCategories(data || [])
    })()
  }, [])

  /* 通用文本/数字输入 */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const numeric = ['budget_min', 'budget_max', 'max_applicants', 'paid_amount']
    setForm(prev => ({
      ...prev,
      [name]: numeric.includes(name) ? Number(value) : value
    }))
  }

  /* 复选框输入 */
  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setForm(prev => ({ ...prev, [name]: checked }))
  }

  /* 提交 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) {
      setError('无法获取企业信息')
      return
    }

    /* 简单校验 */
    if (form.is_advance_paid && form.paid_amount <= 0) {
      setError('请填写有效的预付金额')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const { error: insertErr } = await supabase.from('tasks').insert([
        {
          company_id: company.id,
          title: form.title,
          description: form.description,
          category_id: form.category_id || null,
          product_name: form.product_name || null,
          requirements: form.requirements
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean),
          budget_min: form.budget_min,
          budget_max: form.budget_max,
          max_applicants: form.max_applicants,
          live_date: form.live_date || null,
          duration_hours: 2,
          status: 'open',
          is_urgent: form.is_urgent,
          current_applicants: 0,
          views_count: 0,
          /* 预付 / 结算字段 */
          is_advance_paid: form.is_advance_paid,
          paid_amount: form.is_advance_paid ? form.paid_amount : null,
          is_settled: false,
          settlement_amount: null
        }
      ])

      if (insertErr) throw insertErr

      setSuccess('任务已创建')
      setTimeout(() => {
        onBack()
      }, 1200)
    } catch (err: any) {
      console.error(err)
      setError(err.message || '创建任务失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">发布新任务</h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100"
        >
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">任务标题</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">任务描述</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">任务分类</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择分类</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 产品名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">产品名称</label>
            <input
              type="text"
              name="product_name"
              value={form.product_name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="可选，填写后便于达人了解"
            />
          </div>

          {/* 要求 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务要求（每行一条）
            </label>
            <textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 预算 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">预算最小值 (¥)</label>
              <input
                type="number"
                name="budget_min"
                value={form.budget_min}
                onChange={handleChange}
                min={0}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">预算最大值 (¥)</label>
              <input
                type="number"
                name="budget_max"
                value={form.budget_max}
                onChange={handleChange}
                min={0}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 申请人数 & 日期 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最大申请人数</label>
              <input
                type="number"
                name="max_applicants"
                value={form.max_applicants}
                onChange={handleChange}
                min={1}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">直播日期</label>
              <input
                type="date"
                name="live_date"
                value={form.live_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 紧急任务标记 */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_urgent"
              checked={form.is_urgent}
              onChange={handleCheckbox}
              className="h-4 w-4 text-red-600 border-gray-300 rounded"
            />
            <span className="text-sm text-red-700">紧急任务</span>
          </label>

          {/* 预付 */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_advance_paid"
                checked={form.is_advance_paid}
                onChange={handleCheckbox}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">预付</span>
            </label>
            {form.is_advance_paid && (
              <input
                type="number"
                name="paid_amount"
                value={form.paid_amount}
                onChange={handleChange}
                min={0}
                placeholder="预付金额 (¥)"
                required
                className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>

          {/* 错误 / 成功提示 */}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>发布任务</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}