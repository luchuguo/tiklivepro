import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { useTranslation } from 'react-i18next'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export function NewsManagement() {
  const { t } = useTranslation()
  const [newsArticles, setNewsArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchNewsArticles()
  }, [searchQuery])

  const fetchNewsArticles = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .ilike('title', `%${searchQuery}%`)
        .order('published_at', { ascending: false })
      if (error) throw error
      setNewsArticles(data || [])
    } catch (err) {
      setError('获取新闻文章失败')
      console.error('Error fetching news articles:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateNewsJson = async () => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
      if (error) throw error
      const jsonData = JSON.stringify(data, null, 2)
      // 由于我们无法直接写入文件系统，这里只是模拟更新 JSON 文件的过程
      console.log('Updated news.json with data:', jsonData)
      // 在实际环境中，您可能需要通过 API 调用或服务器端脚本来更新静态文件
    } catch (err) {
      console.error('Error updating news.json:', err)
    }
  }

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .insert([{ title, content, is_published: isPublished }])
        .select()
      if (error) throw error
      setNewsArticles([...newsArticles, ...(data || [])])
      resetForm()
      setShowAddForm(false)
      await updateNewsJson()
    } catch (err) {
      setError('添加新闻文章失败')
      console.error('Error adding news article:', err)
    }
  }

  const handleEditArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!currentArticle) return
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .update({ title, content, is_published: isPublished, updated_at: new Date().toISOString() })
        .eq('id', currentArticle.id)
        .select()
      if (error) throw error
      setNewsArticles(newsArticles.map(article => 
        article.id === currentArticle.id ? { ...article, title, content, is_published: isPublished, updated_at: new Date().toISOString() } : article
      ))
      resetForm()
      setShowEditForm(false)
      await updateNewsJson()
    } catch (err) {
      setError('编辑新闻文章失败')
      console.error('Error editing news article:', err)
    }
  }

  const handleDeleteArticle = async (id: string) => {
    setError(null)
    try {
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', id)
      if (error) throw error
      setNewsArticles(newsArticles.filter(article => article.id !== id))
      await updateNewsJson()
    } catch (err) {
      setError('删除新闻文章失败')
      console.error('Error deleting news article:', err)
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setIsPublished(false)
    setCurrentArticle(null)
  }

  const openEditForm = (article: any) => {
    setCurrentArticle(article)
    setTitle(article.title)
    setContent(article.content)
    setIsPublished(article.is_published)
    setShowEditForm(true)
  }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline','strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  }

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">新闻动态管理</h1>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加新闻
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="搜索新闻..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="text-center p-6">加载中...</div>
      ) : newsArticles.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">暂无新闻文章</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {newsArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{article.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(article.published_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${article.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {article.is_published ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditForm(article)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteArticle(article.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add News Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">添加新闻</h2>
            <form onSubmit={handleAddArticle}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <ReactQuill 
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  formats={quillFormats}
                  className="w-full h-64"
                />
              </div>
              <div className="mb-4 mt-8">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">发布</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit News Form */}
      {showEditForm && currentArticle && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">编辑新闻</h2>
            <form onSubmit={handleEditArticle}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <ReactQuill 
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  formats={quillFormats}
                  className="w-full h-64"
                />
              </div>
              <div className="mb-4 mt-8">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">发布</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 