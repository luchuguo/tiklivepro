import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import newsData from '../../data/news.json'

export function NewsDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState(i18n.language)

  useEffect(() => {
    fetchArticle()
  }, [id])

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(i18n.language)
      // 强制重新获取数据以确保内容更新
      fetchArticle()
    }
    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  const fetchArticle = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = newsData.find(article => article.id === id && article.is_published)
      if (!data) throw new Error('文章未找到')
      setArticle(data)
    } catch (err) {
      setError('获取新闻文章失败')
      console.error('Error fetching news article:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTitle = (id: string) => {
    try {
      return t(`news.${id}.title`, { defaultValue: '' }) || getDefaultTitle(id, i18n.language);
    } catch (e) {
      console.error('Translation error for title:', e)
      return getDefaultTitle(id, i18n.language);
    }
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

  const getContent = (id: string) => {
    try {
      return t(`news.${id}.content`, { defaultValue: '' }) || getDefaultContent(id, i18n.language);
    } catch (e) {
      console.error('Translation error for content:', e)
      return getDefaultContent(id, i18n.language);
    }
  }

  const getDefaultContent = (id: string, lang: string) => {
    if (lang === 'zh') {
      const defaultContentsZh: { [key: string]: string } = {
        '1': '<p>TikTok 直播带货正在成为电商的新风口，越来越多的品牌和达人加入其中。本文将为您解析最新的直播带货趋势和成功案例。</p>',
        '2': '<p>成为一名成功的 TikTok 主播需要掌握多种技能，包括内容创作、粉丝互动和直播带货技巧。本文将分享一些实用建议，帮助您在 TikTok 上脱颖而出。</p>',
        '3': '<p>选择合适的 TikTok 达人进行合作是品牌成功的关键。本文将介绍如何根据品牌定位和目标受众选择合适的达人，以及如何评估合作效果。</p>',
        '4': '<p>通过分析几个成功的 TikTok 直播带货案例，我们可以学习到一些有效的策略和技巧。本文将深入剖析这些案例，帮助您更好地理解直播带货的成功之道。</p>'
      };
      return defaultContentsZh[id] || '<p>这是新闻文章的完整内容。如果您看到此消息，说明当前文章的具体内容不可用。</p>';
    } else {
      const defaultContentsEn: { [key: string]: string } = {
        '1': '<p>TikTok live streaming e-commerce is becoming a new frontier for online shopping, with more and more brands and influencers joining in. This article will analyze the latest trends and successful case studies in live streaming e-commerce.</p>',
        '2': '<p>Becoming a successful TikTok live streamer requires mastering various skills, including content creation, fan interaction, and live streaming e-commerce techniques. This article shares practical tips to help you stand out on TikTok.</p>',
        '3': '<p>Choosing the right TikTok influencer for collaboration is key to a brand\'s success. This article explains how to select influencers based on brand positioning and target audience, and how to evaluate collaboration results.</p>',
        '4': '<p>By analyzing several successful TikTok live streaming e-commerce cases, we can learn effective strategies and techniques. This article provides an in-depth analysis of these cases to help you better understand the path to success in live streaming e-commerce.</p>'
      };
      return defaultContentsEn[id] || '<p>This is the full content of the news article. If you see this message, the specific content for this article is not available.</p>';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">{t('加载中...', { defaultValue: '加载中...' })}</p>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('错误', { defaultValue: '错误' })}</h2>
        <p className="text-gray-600 mb-6">{error || t('文章未找到', { defaultValue: '文章未找到' })}</p>
        <button
          onClick={() => navigate('/news')}
          className="flex items-center bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('返回新闻列表', { defaultValue: '返回新闻列表' })}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" key={language}>
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/news')}
            className="flex items-center text-gray-700 hover:text-pink-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('返回新闻列表', { defaultValue: '返回新闻列表' })}
          </button>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{getTitle(article.id)}</h1>
            <p className="text-gray-500 text-sm">
              {new Date(article.published_at).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-6 rounded-lg shadow-sm">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: getContent(article.id) }}
          />
        </div>
      </section>
    </div>
  )
} 