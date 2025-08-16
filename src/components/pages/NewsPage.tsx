import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity } from 'lucide-react'
import newsData from '../../data/news.json'

export function NewsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [newsArticles, setNewsArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState(i18n.language)

  useEffect(() => {
    fetchNewsArticles()
  }, [])

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(i18n.language)
      // 强制重新获取数据以确保内容更新
      fetchNewsArticles()
    }
    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  const fetchNewsArticles = async () => {
    setLoading(true)
    setError(null)
    try {
      // 直接使用 newsData 作为数据源，但内容将通过 i18n 获取
      const data = newsData.filter(article => article.is_published)
      setNewsArticles(data || [])
    } catch (err) {
      setError(t('获取新闻文章失败'))
      console.error('Error fetching news articles:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTitle = (id: string) => {
    return t(`news.${id}.title`, { defaultValue: '' }) || getDefaultTitle(id, i18n.language);
  }

  const getDefaultTitle = (id: string, lang: string) => {
    if (lang === 'zh') {
      const defaultTitlesZh: { [key: string]: string } = {
        '1': 'TikTok 直播带货新趋势',
        '2': '如何成为一名成功的 TikTok 主播',
        '3': '品牌如何选择合适的 TikTok 达人合作',
        '4': 'TikTok 直播带货案例分析'
      };
      return defaultTitlesZh[id] || `新闻文章 ${id}`;
    } else {
      const defaultTitlesEn: { [key: string]: string } = {
        '1': 'New Trends in TikTok Live Streaming E-commerce',
        '2': 'How to Become a Successful TikTok Live Streamer',
        '3': 'How Brands Choose the Right TikTok Influencers for Collaboration',
        '4': 'Case Study Analysis of TikTok Live Streaming E-commerce'
      };
      return defaultTitlesEn[id] || `News Article ${id}`;
    }
  }

  const getContentPreview = (id: string) => {
    const content = t(`news.${id}.content`, { defaultValue: '' });
    if (content) {
      const div = document.createElement('div');
      div.innerHTML = content;
      return div.textContent?.substring(0, 150) + '...' || (i18n.language === 'zh' ? '暂无内容预览。' : 'No content preview available.');
    }
    return getDefaultContentPreview(id, i18n.language);
  }

  const getDefaultContentPreview = (id: string, lang: string) => {
    if (lang === 'zh') {
      const defaultPreviewsZh: { [key: string]: string } = {
        '1': 'TikTok 直播带货正在成为电商的新风口，越来越多的品牌和达人加入其中。本文将为您解析最新的直播带货趋势和成功案例。',
        '2': '成为一名成功的 TikTok 主播需要掌握多种技能，包括内容创作、粉丝互动和直播带货技巧。本文将分享一些实用建议。',
        '3': '选择合适的 TikTok 达人进行合作是品牌成功的关键。本文将介绍如何根据品牌定位和目标受众选择合适的达人。',
        '4': '通过分析几个成功的 TikTok 直播带货案例，我们可以学习到一些有效的策略和技巧。本文将深入剖析这些案例。'
      };
      return defaultPreviewsZh[id] ? defaultPreviewsZh[id].substring(0, 150) + '...' : '暂无内容预览。';
    } else {
      const defaultPreviewsEn: { [key: string]: string } = {
        '1': 'TikTok live streaming e-commerce is becoming a new frontier for online shopping, with more brands and influencers joining in.',
        '2': 'Becoming a successful TikTok live streamer requires mastering various skills, including content creation and fan interaction.',
        '3': 'Choosing the right TikTok influencer for collaboration is key to a brand\'s success. This article explains how to select influencers.',
        '4': 'By analyzing successful TikTok live streaming e-commerce cases, we can learn effective strategies and techniques.'
      };
      return defaultPreviewsEn[id] ? defaultPreviewsEn[id].substring(0, 150) + '...' : 'No content preview available.';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" key={language}>
      {/* Banner */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('新闻中心', { defaultValue: '新闻中心' })}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('了解最新的 TikTok 直播带货趋势和平台动态', { defaultValue: '了解最新的 TikTok 直播带货趋势和平台动态' })}
            </p>
          </div>
        </div>
      </section>

      {/* News List */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('加载中...', { defaultValue: '加载中...' })}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : newsArticles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600">{t('暂无数据', { defaultValue: '暂无数据' })}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/news/${article.id}`)}
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{getTitle(article.id)}</h2>
                  <p className="text-gray-500 text-sm mb-4">
                    {new Date(article.published_at).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-600">{getContentPreview(article.id)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// 确保同时支持默认导出和命名导出
export default NewsPage 