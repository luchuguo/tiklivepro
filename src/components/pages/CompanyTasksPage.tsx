import React, { useState, useEffect } from 'react'
import { Loader, AlertCircle, Plus, Building2, XCircle } from 'lucide-react'
import { supabase, Task, Company } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { CreateTaskPage } from './CreateTaskPage'
import { TaskDetailPage } from './TaskDetailPage'

// Company User Exclusive: My Tasks List
export function CompanyTasksPage() {
  const { user, profile } = useAuth()

  const [company, setCompany] = useState<Company | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  // Task ID being processed, used to disable buttons
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null)

  // Update task status
  const updateTaskStatus = async (task: Task, newStatus: Task['status']) => {
    try {
      // If status is already the same, return directly
      if (task.status === newStatus) return
      setProcessingTaskId(task.id)

      // Optimistically update local list
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))

      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', task.id)

      if (error) {
        // Revert state and show error message
        console.error('Failed to update task status:', error)
        alert('Failed to update task status, please try again')
        // Refetch to maintain consistency
        fetchCompanyAndTasks()
      }
    } finally {
      setProcessingTaskId(null)
    }
  }

  useEffect(() => {
    if (profile?.user_type === 'company' && user) {
      fetchCompanyAndTasks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  // Fetch company and tasks
  const fetchCompanyAndTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      // Company profile
      const { data: comp, error: compErr } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (compErr) throw compErr
      if (!comp) throw new Error('Company information not found')
      setCompany(comp as Company)

      // Tasks
      const { data: taskList, error: taskErr } = await supabase
        .from('tasks')
        .select('*, selected_influencer:influencers(nickname)')
        .eq('company_id', comp.id)
        .order('created_at', { ascending: false })

      if (taskErr) throw taskErr
      setTasks(taskList as Task[])
    } catch (err: any) {
      console.error('Failed to load tasks:', err)
      setError(err.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  // Non-company user interception
  if (profile && profile.user_type !== 'company') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Only company users can access this page</div>
  }

  // Create task form
  if (showCreate) {
    return (
      <CreateTaskPage
        company={company}
        onBack={() => {
          setShowCreate(false)
          fetchCompanyAndTasks()
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>My Tasks</span>
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Task</span>
          </button>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-20">暂无任务，点击“发布新任务”开始吧！</div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="bg-white border border-gray-100 shadow-sm rounded-lg p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-500">Live Date: {task.live_date ? new Date(task.live_date).toLocaleDateString() : 'Not Set'}</p>
                </div>
                <div className="text-sm text-gray-500 text-right space-y-1">
                  <p>Status: {
                    {
                      open: 'Open',
                      in_progress: 'In Progress',
                      completed: 'Completed',
                      cancelled: 'Cancelled',
                    }[task.status]
                  }</p>
                  {task.selected_influencer && (
                    <p className="text-green-600">Selected: {task.selected_influencer.nickname}</p>
                  )}
                  <p>Applications: {(task.current_applicants ?? 0)}/{task.max_applicants}</p>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    {/* Cancel button: visible only in open or in_progress status */}
                    {(task.status === 'open' || task.status === 'in_progress') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateTaskStatus(task, 'cancelled') }}
                        disabled={processingTaskId === task.id}
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs disabled:opacity-50"
                      >Cancel</button>
                    )}
                    {/* Complete button: visible only in in_progress status */}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateTaskStatus(task, 'completed') }}
                        disabled={processingTaskId === task.id}
                        className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-xs disabled:opacity-50"
                      >Complete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail modal */}
        {selectedTaskId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Task Details</h3>
                <button onClick={() => setSelectedTaskId(null)} className="text-gray-500 hover:text-gray-900">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <TaskDetailPage taskId={selectedTaskId} onBack={() => setSelectedTaskId(null)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 