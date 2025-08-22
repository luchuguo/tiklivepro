import React, { useState, useEffect } from 'react'
import { Video, Users, Building2, TrendingUp, Star, Play, ArrowRight, Menu, X, User, LogOut, Calendar, Settings, Shield, UserCheck, Cog, Briefcase } from 'lucide-react'
import { Routes, Route, useNavigate, useLocation, useParams, Link } from 'react-router-dom'

// Google翻译类型声明
declare global {
  interface Window {
    translatePage?: (fromLang: string, toLang: string) => void;
    google?: {
      translate: {
        TranslateElement: {
          new(config: any, elementId: string): any;
          InlineLayout: {
            SIMPLE: any;
          };
        };
      };
    };
  }
}
import { AuthModal } from './components/AuthModal'
import { AdminDashboard } from './components/AdminDashboard'
import { AdminSetup } from './components/AdminSetup'
import { AdminLogin } from './components/AdminLogin'
import { SupabaseSetupGuide } from './components/SupabaseSetupGuide'
import { SupabaseConfigChecker } from './components/SupabaseConfigChecker'
import { Footer } from './components/Footer'
import { AboutPage } from './components/pages/AboutPage'
import { TermsPage } from './components/pages/TermsPage'
import { PrivacyPage } from './components/pages/PrivacyPage'
import { HelpPage } from './components/pages/HelpPage'
import { ContactPage } from './components/pages/ContactPage'
import { InfluencersPage } from './components/pages/InfluencersPage'
import { TasksPage } from './components/pages/TasksPage'
import { useAuthContext } from './hooks/useAuth'
import { InfluencerDataViewer } from './components/InfluencerDataViewer'
import { CompanyProfilePage } from './components/pages/CompanyProfilePage'
import { InfluencerProfilePage } from './components/pages/InfluencerProfilePage'
import { AccountSettingsPage } from './components/pages/AccountSettingsPage'
import { InfluencerTasksPage } from './components/pages/InfluencerTasksPage'
import { CompanyTasksPage } from './components/pages/CompanyTasksPage'
import { AdminLoginPage } from './components/pages/AdminLoginPage'
import InfluencerImageUploadTest from './components/pages/InfluencerImageUploadTest'
import { CompanyDetailPage } from './components/pages/CompanyDetailPage'
import { InfluencerDetailPage } from './components/pages/InfluencerDetailPage'
import { TaskDetailPage } from './components/pages/TaskDetailPage'
import { SmsVerificationTest } from './components/pages/SmsVerificationTest'
import { RouteTestPage } from './components/pages/RouteTestPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { EmailVerificationTest } from './components/pages/EmailVerificationTest'
import { ImageUploadTest } from './components/pages/ImageUploadTest'
import LoginTestPage from './components/pages/LoginTestPage'
import LanguageSwitcher from './components/LanguageSwitcher'
import { EnvironmentChecker } from './components/EnvironmentChecker'
import { ProductionDebugger } from './components/ProductionDebugger'
import { ProductionDataTest } from './components/ProductionDataTest'
import { ApiRouteTester } from './components/ApiRouteTester'


function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authUserType, setAuthUserType] = useState<'influencer' | 'company'>('influencer')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDataViewer, setShowDataViewer] = useState(false)
  // 移除不再需要的状态和函数，使用Google翻译默认控件
  // const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>('zh');
  // const [isTranslating, setIsTranslating] = useState(false);
  // const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, loading, signOut, isAdmin } = useAuthContext()

  // 切换语言下拉菜单
  // const toggleLanguageDropdown = () => {
  //   setShowLanguageDropdown(!showLanguageDropdown)
  // }

  // 选择语言并触发翻译
  // const selectLanguage = (lang: 'zh' | 'en') => {
  //   if (lang === currentLanguage) {
  //     setShowLanguageDropdown(false)
  //     return
  //   }
    
  //   setCurrentLanguage(lang)
  //   setIsTranslating(true)
  //   setShowLanguageDropdown(false)
    
  //   // 使用Google翻译API
  //   const triggerTranslation = () => {
  //     try {
  //       console.log('Starting Google translation process for language:', lang);
        
  //       if (lang === 'en') {
  //         // 切换到英文
  //         if (window.translatePage) {
  //           window.translatePage('zh', 'en');
  //           console.log('Triggered English translation via Google Translate');
  //         } else {
  //           console.log('Google Translate not ready yet');
  //         }
  //       } else {
  //         // 切换到中文
  //         if (window.translatePage) {
  //           window.translatePage('en', 'zh');
  //           console.log('Triggered Chinese translation via Google Translate');
  //         } else {
  //           console.log('Google Translate not ready yet');
  //         }
  //       }
        
  //       // 3秒后重置翻译状态
  //       setTimeout(() => {
  //         setIsTranslating(false);
  //         console.log('Translation timeout completed');
  //       }, 3000);
  //     } catch (error) {
  //       console.error('Google Translate error:', error);
  //       setIsTranslating(false);
  //     }
  //   }
    
  //   // 延迟一点执行，确保Google翻译已加载
  //   setTimeout(triggerTranslation, 1000);
  // }

  // 公司详情页面包装组件
  function CompanyDetailWrapper() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    if (!id) {
      return <div>公司ID不存在</div>
    }
    
    return <CompanyDetailPage companyId={id} onBack={() => navigate(-1)} />
  }

  // 达人详情页面包装组件
  function InfluencerDetailWrapper() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    if (!id) {
      return <div>达人ID不存在</div>
    }
    
    return <InfluencerDetailPage influencerId={id} onBack={() => navigate(-1)} />
  }

  // 任务详情页面包装组件
  function TaskDetailWrapper() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    if (!id) {
      return <div>任务ID不存在</div>
    }
    
    return <TaskDetailPage taskId={id} onBack={() => navigate(-1)} />
  }

  // 检查是否需要显示 Supabase 配置指南
  const needsSupabaseSetup = () => {
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY
    const isValidUrl = hasUrl && import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url'
    const isValidKey = hasKey && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
    
    return !isValidUrl || !isValidKey
  }

  // 监听用户状态变化，重置退出登录状态
  useEffect(() => {
    if (user) {
      // 用户登录时重置退出登录状态
      setIsLoggingOut(false)
      setShowUserMenu(false)
    } else {
      // 用户退出时重置所有状态
      setIsLoggingOut(false)
      setShowUserMenu(false)
      // 只有在用户退出登录时才重置到首页，而不是每次状态变化都重置
      // 移除自动导航逻辑，让用户手动导航
      setIsMobileMenuOpen(false)
    }
  }, [user])

  // 监听Google翻译准备就绪事件
  useEffect(() => {
    const checkGoogleTranslateStatus = () => {
      if (window.translatePage && typeof (window as any).google !== 'undefined' && (window as any).google.translate) {
        console.log('Google翻译准备就绪');
      } else {
        console.log('Google翻译还未加载');
      }
    };

    // 定期检查Google翻译状态
    const interval = setInterval(checkGoogleTranslateStatus, 3000);
    
    // 页面加载完成后立即检查一次
    setTimeout(checkGoogleTranslateStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [])

  // 点击外部关闭语言下拉菜单
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     const target = event.target as Element;
  //     if (!target.closest('.language-switcher')) {
  //       setShowLanguageDropdown(false);
  //     }
  //   };

  //   if (showLanguageDropdown) {
  //     document.addEventListener('click', handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener('click', handleClickOutside);
  //   };
  // }, [showLanguageDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const openAuthModal = (mode: 'signin' | 'signup', userType: 'influencer' | 'company' = 'influencer') => {
    console.log('打开认证模态框:', { mode, userType });
    setAuthMode(mode)
    setAuthUserType(userType)
    setIsAuthModalOpen(true)
  }

  const handleSignOut = async () => {
    if (isLoggingOut) return // 防止重复点击

    try {
      setIsLoggingOut(true)
      setShowUserMenu(false)
      
      console.log('开始退出登录...')
      
      // 执行退出登录
      const { error } = await signOut()
      
      if (error) {
        console.error('退出登录失败:', error)
      } else {
        console.log('退出登录成功')
      }
      
      // 清理本地状态
      navigate('/')
      setIsMobileMenuOpen(false)
      setIsAuthModalOpen(false)
      
    } catch (error) {
      console.error('退出登录时发生错误:', error)
    } finally {
      // 延迟重置退出状态，确保用户看到反馈
      setTimeout(() => {
        setIsLoggingOut(false)
      }, 1000)
    }
  }

  const handlePageChange = (page: string) => {
    let targetPath = '/'
    
    if (page === 'home') {
      targetPath = '/'
    } else if (page === 'profile') {
      // 根据用户类型跳转到不同的个人中心
      if (profile?.user_type === 'influencer') {
        targetPath = '/influencer-profile'
      } else if (profile?.user_type === 'company') {
        targetPath = '/company-profile'
      } else {
        targetPath = '/profile'
      }
    } else {
      targetPath = `/${page}`
    }
    
    navigate(targetPath)
    setIsMobileMenuOpen(false)
    setShowUserMenu(false)
  }

  // 如果需要 Supabase 配置，显示配置指南
  if (needsSupabaseSetup() && location.pathname === '/') {
    return <SupabaseSetupGuide />
  }

  function HomePage() {
    const stats = [
      { label: '注册用户', value: '50,000+', icon: Users },
      { label: '合作品牌', value: '1,200+', icon: Building2 },
      { label: '成功案例', value: '8,500+', icon: Star },
      { label: '直播场次', value: '25,000+', icon: Video },
    ]

    const features = [
      {
        icon: Users,
        title: '专业达人',
        description: '严格筛选的优质TikTok达人，覆盖各个垂直领域，确保内容质量和带货效果'
      },
      {
        icon: Building2,
        title: '品牌保障',
        description: '为品牌方提供全方位服务保障，从达人匹配到效果追踪，一站式解决方案'
      },
      {
        icon: TrendingUp,
        title: '数据驱动',
        description: '基于大数据分析的智能匹配系统，提升合作成功率和ROI表现'
      },
      {
        icon: Star,
        title: '品质保证',
        description: '完善的评价体系和质量监控，确保每一次合作都能达到预期效果'
      }
    ]

    const testimonials = [
      {
        name: '张小美',
        role: '美妆达人',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
        content: '通过tkgo.vip，我找到了很多优质的品牌合作机会，平台的服务很专业，结算也很及时。',
        rating: 5
      },
      {
        name: '李总',
        role: '某知名品牌市场总监',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
        content: '平台的达人质量很高，数据很透明，帮助我们的产品在TikTok上获得了很好的曝光效果。',
        rating: 5
      },
      {
        name: '王小红',
        role: '生活方式博主',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
        content: '平台操作简单，任务匹配度很高，客服响应也很快，是一个值得信赖的合作平台。',
        rating: 5
      }
    ]

    return (
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f472b6' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  一站式
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                    TikTok
                  </span>
                  海外代播平台
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  集达人带货、短视频剪辑、账号托管于一体，助力中国商家轻松出海
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button 
                    onClick={() => openAuthModal('signup', 'influencer')}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg transform hover:scale-105"
                  >
                    <Users className="w-5 h-5" />
                    <span>达人入驻</span>
                  </button>
                  <button 
                    onClick={() => openAuthModal('signup', 'company')}
                    className="border-2 border-gray-300 text-gray-600 px-8 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 opacity-75"
                  >
                    <Building2 className="w-5 h-5" />
                    <span>品牌方入驻</span>
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <div className="relative z-10">
                  <img
                    src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="TikTok直播"
                    className="rounded-2xl shadow-2xl"
                  />
                  <div className="absolute -top-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">正在直播</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600">98.5%</div>
                      <div className="text-sm text-gray-600">满意度</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                为什么选择tkgo.vip
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                平台聚焦“人货匹配”与“高效协作”，通过任务发布、达人接单、沟通协作、结算保障、争议处理五大核心功能，帮助商家高效拓展海外市场。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                简单三步，开始合作
              </h2>
              <p className="text-xl text-gray-600">
                高效的流程设计，让合作变得简单
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">注册认证</h3>
                <p className="text-gray-600">
                  完成平台注册和身份认证，建立可信的合作基础
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">智能匹配</h3>
                <p className="text-gray-600">
                  基于需求和数据的智能匹配，找到最适合的合作伙伴
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">开始合作</h3>
                <p className="text-gray-600">
                  签署合作协议，开始直播带货，实现双方共赢
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                用户好评如潮
              </h2>
              <p className="text-xl text-gray-600">
                听听我们用户的真实反馈
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                  <div className="flex items-center mb-6">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed">"{testimonial.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              准备开始您的TikTok直播带货之旅？
            </h2>
            <p className="text-xl text-pink-100 mb-8">
              加入tkgo.vip，与优质合作伙伴一起创造更大价值
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => openAuthModal('signup', 'influencer')}
                className="bg-white text-pink-600 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                <span>我是达人</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => openAuthModal('signup', 'company')}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-medium hover:bg-white hover:text-pink-600 transition-all duration-200 flex items-center justify-center space-x-2 opacity-75"
              >
                <Building2 className="w-5 h-5" />
                <span>我是品牌方</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* 系统状态检查（默认隐藏，可调试时开启） */}
        {false && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">系统状态检查</h2>
                <p className="text-lg text-gray-600">检查 Supabase 配置和连接状态</p>
              </div>
              <SupabaseConfigChecker />
            </div>
          </section>
        )}
      </div>
    )
  }

  // 只在特定页面显示加载界面
  if (loading && (location.pathname === '/admin' || location.pathname === '/admin-setup')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - 管理后台页面不显示 */}
      {location.pathname !== '/admin' && (
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button 
              onClick={() => handlePageChange('home')}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                tkgo.vip
              </span>
            </button>

            {/* Google翻译控件 - 桌面版 - 确保正确显示 */}
            <div id="google_translate_element" className="mr-6" style={{ display: 'block', visibility: 'visible' }}></div>

            {/* 移除自定义语言切换按钮，使用Google翻译默认控件 */}

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => handlePageChange('home')}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === '/' ? 'text-pink-600 font-medium' : ''}`}
              >
                首页
              </button>
              <button 
                onClick={() => handlePageChange('influencers')}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === '/influencers' ? 'text-pink-600 font-medium' : ''}`}
              >
                达人列表
              </button>
              <button 
                onClick={() => handlePageChange('tasks')}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === '/tasks' ? 'text-pink-600 font-medium' : ''}`}
              >
                任务大厅
              </button>
              <button 
                onClick={() => handlePageChange('about')}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === '/about' ? 'text-pink-600 font-medium' : ''}`}
              >
                关于我们
              </button>
              <button 
                onClick={() => handlePageChange('help')}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === '/help' ? 'text-pink-600 font-medium' : ''}`}
              >
                帮助中心
              </button>
              <button 
                onClick={() => handlePageChange('contact')}
                className={`text-gray-700 hover:text-pink-600 transition-colors ${location.pathname === '/contact' ? 'text-pink-600 font-medium' : ''}`}
              >
                联系我们
              </button>
            </div>

            {/* User Menu / Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              
              {user ? (
                <div className="relative user-menu">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors"
                    disabled={isLoggingOut}
                  >
                    <User className="w-5 h-5" />
                    <span>
                      {isLoggingOut ? '退出中...' : (
                        profile?.user_type === 'admin'
                          ? '超级管理员'
                          : profile?.user_type === 'company'
                          ? '企业用户'
                          : profile?.user_type === 'influencer'
                          ? '达人用户'
                          : '用户中心'
                      )}
                    </span>
                  </button>
                  
                  {showUserMenu && !isLoggingOut && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                      </div>
                      
                      {/* 管理员功能 */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handlePageChange('admin')}
                            className="flex items-center w-full text-left py-2 px-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Shield className="w-4 h-4 mr-3" />
                            管理后台
                          </button>
                          <button
                            onClick={() => handlePageChange('admin-setup')}
                            className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            管理员设置
                          </button>
                        </>
                      )}
                      
                      {/* 普通用户功能 */}
                      {!isAdmin && (
                        <>
                          <button
                            onClick={() => handlePageChange('profile')}
                            className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                          >
                            <UserCheck className="w-4 h-4 mr-3" />
                            个人中心
                          </button>
                          <button
                            onClick={() => handlePageChange('account-settings')}
                            className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                          >
                            <Cog className="w-4 h-4 mr-3" />
                            账号设置
                          </button>
                          {profile?.user_type === 'influencer' && (
                            <button
                              onClick={() => handlePageChange('influencer-tasks')}
                              className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                            >
                              <Briefcase className="w-4 h-4 mr-3" />
                              我的任务
                            </button>
                          )}
                          {profile?.user_type === 'company' && (
                            <button
                              onClick={() => handlePageChange('company-tasks')}
                              className="flex items-center w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                            >
                              <Briefcase className="w-4 h-4 mr-3" />
                              我的任务
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="flex items-center w-full text-left py-2 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {isLoggingOut ? '退出中...' : '退出登录'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="text-gray-700 hover:text-pink-600 transition-colors"
                  >
                    登录
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    注册
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-pink-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              
              {/* 移除移动端自定义语言切换按钮，使用Google翻译默认控件 */}
              <div className="px-4 py-3 border-b border-gray-100">
                {/* 移动端语言选择菜单 */}
                {/* Removed showLanguageDropdown && !isTranslating */}
              </div>
              
              {/* 移除移动端Google翻译控件，避免重复ID */}

              <div className="space-y-2">
                <button 
                  onClick={() => handlePageChange('home')}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  首页
                </button>
                <button 
                  onClick={() => handlePageChange('influencers')}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === '/influencers' ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  达人列表
                </button>
                <button 
                  onClick={() => handlePageChange('tasks')}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === '/tasks' ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  任务大厅
                </button>
                <button 
                  onClick={() => handlePageChange('about')}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === '/about' ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  关于我们
              </button>
                <button 
                  onClick={() => handlePageChange('help')}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === '/help' ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  帮助中心
                </button>
                <button 
                  onClick={() => handlePageChange('contact')}
                  className={`block w-full text-left py-2 px-4 rounded-lg transition-colors ${location.pathname === '/contact' ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  联系我们
                </button>
                
                {/* 管理员后台入口 */}
                <button 
                  onClick={() => handlePageChange('admin-login')}
                  className="block w-full text-left py-2 px-4 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>管理后台</span>
                </button>
                
                {/* 用户菜单 */}
                {user ? (
                  <div className="border-t border-gray-100 pt-2 space-y-2">
                    <div className="px-4 py-2 text-sm text-gray-600">
                      {user.email}
                    </div>
                    
                    {/* 管理员功能 */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handlePageChange('admin')}
                          className="block w-full text-left py-2 px-4 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          管理后台
                        </button>
                        <button
                          onClick={() => handlePageChange('admin-setup')}
                          className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                        >
                          管理员设置
                        </button>
                      </>
                    )}
                    
                    {/* 普通用户功能 */}
                    {!isAdmin && (
                      <>
                        <button
                          onClick={() => handlePageChange('profile')}
                          className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                        >
                          个人中心
                        </button>
                        <button
                          onClick={() => handlePageChange('account-settings')}
                          className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                        >
                          账号设置
                        </button>
                        {profile?.user_type === 'influencer' && (
                          <button
                            onClick={() => handlePageChange('influencer-tasks')}
                            className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                          >
                            我的任务
                          </button>
                        )}
                        {profile?.user_type === 'company' && (
                          <button
                            onClick={() => handlePageChange('company-tasks')}
                            className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                          >
                            我的任务
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="block w-full text-left py-2 px-4 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? '退出中...' : '退出登录'}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-gray-100 pt-2 space-y-2">
                    <button
                      onClick={() => openAuthModal('signin')}
                      className="block w-full text-left py-2 px-4 text-gray-700 hover:text-pink-600 transition-colors"
                    >
                      登录
                    </button>
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="block w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold text-center"
                    >
                      注册
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
      )}

      {/* Main Content */}
      <main>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/influencers" element={<InfluencersPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/influencer-profile" element={<InfluencerProfilePage />} />
            <Route path="/influencer-image-upload-test" element={<InfluencerImageUploadTest />} />        
            <Route path="/company-profile" element={<CompanyProfilePage />} />
            <Route path="/account-settings" element={<AccountSettingsPage />} />
            <Route path="/influencer-tasks" element={<InfluencerTasksPage />} />
            <Route path="/company-tasks" element={<CompanyTasksPage />} />
            <Route path="/company/:id" element={<CompanyDetailWrapper />} />
            <Route path="/influencer/:id" element={<InfluencerDetailWrapper />} />
            <Route path="/task/:id" element={<TaskDetailWrapper />} />
            <Route path="/route-test/:id" element={<RouteTestPage />} />
            <Route path="/sms-test" element={<SmsVerificationTest />} />
            <Route path="/email-test" element={<EmailVerificationTest />} />
            <Route path="/image-upload-test" element={<ImageUploadTest />} />
            <Route path="/login-test" element={<LoginTestPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Footer - 管理后台页面不显示 */}
      {location.pathname !== '/admin' && <Footer onPageChange={handlePageChange} />}

      {/* Auth Modal */}
      {isAuthModalOpen && (
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
        defaultUserType={authUserType}
      />
      )}

      {/* Data Viewer */}
      {showDataViewer && <InfluencerDataViewer />}

      {/* Environment Checker - 只在生产环境显示问题 */}
      <EnvironmentChecker />
      {/* Production Debugger - 生产环境调试工具 */}
      <ProductionDebugger />
      {/* Production Data Test - 生产环境数据测试工具 */}
      <ProductionDataTest />
      {/* API Route Tester - API路由测试工具 */}
      <ApiRouteTester />

    </div>
  )
}

export default App