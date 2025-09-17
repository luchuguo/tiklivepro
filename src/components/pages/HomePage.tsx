import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Building2, TrendingUp, Star, Play, ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function HomePage() {
  const [indexVideos, setIndexVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 获取首页视频数据
  useEffect(() => {
    const fetchIndexVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          const response = await fetch("/api/videos?limit=4&sort=latest");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const result = await response.json();
          console.log("API返回数据:", result); // 调试日志
          
          // 检查返回的数据结构
          if (result && result.videos && Array.isArray(result.videos)) {
            setIndexVideos(result.videos);
            console.log("✅ 首页视频数据获取成功:", result.videos.length, "个");
        } else {
            throw new Error("返回的数据格式不正确");
          }
          return;
        } catch (apiError) {
          console.error("API调用失败:", apiError);
          throw apiError;
        }

      } catch (error) {
        console.error("❌ 获取首页视频数据出错:", error);
        setError("获取视频数据失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    
    fetchIndexVideos();
  }, []);

  const stats = [
    { label: "注册用户", icon: Users },
    { label: "合作品牌", icon: Building2 },
    { label: "成功案例", icon: Star },
    { label: "直播场次", icon: Play },
  ];

  const features = [
    {
      icon: Users,
      title: "专业达人",
      description: "严格筛选的优质TikTok达人，覆盖各个垂直领域，确保内容质量和带货效果"
    },
    {
      icon: Building2,
      title: "品牌保障",
      description: "为品牌方提供全方位服务保障，从达人匹配到效果追踪，一站式解决方案"
    },
    {
      icon: TrendingUp,
      title: "数据驱动",
      description: "基于大数据分析的智能匹配系统，提升合作成功率和ROI表现"
    },
    {
      icon: Star,
      title: "品质保证",
      description: "完善的评价体系和质量监控，确保每一次合作都能达到预期效果"
    }
  ];

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
                <Link 
                  to="/signup"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg transform hover:scale-105"
                >
                  <Users className="w-5 h-5" />
                  <span>达人入驻</span>
                </Link>
                <Link 
                  to="/signup"
                  className="border-2 border-gray-300 text-gray-600 px-8 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 opacity-75"
                >
                  <Building2 className="w-5 h-5" />
                  <span>品牌入驻</span>
                </Link>
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
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              精彩视频展示
            </h2>
            <p className="text-xl text-gray-600">
              观看我们的优秀达人直播带货案例
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // 加载状态
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-video bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              // 错误状态
              <div className="col-span-full text-center py-16">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">获取视频失败</h3>
                <p className="text-gray-600">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 text-pink-600 hover:text-pink-700 font-medium"
                >
                  点击重试
                </button>
              </div>
            ) : indexVideos.length > 0 ? (
              // 视频列表
              indexVideos.map((video) => (
                <div 
                  key={video.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/video/${video.id}`, { 
                    state: { 
                      videoInfo: {
                        id: video.id,
                        title: video.title,
                        description: video.description,
                        video_url: video.video_url,
                        poster_url: video.poster_url,
                        views_count: video.views_count || 0,
                        likes_count: video.likes_count || 0,
                        comments_count: video.comments_count || 0,
                        shares_count: video.shares_count || 0,
                        duration: video.duration,
                        category: video.category?.name || "未分类",
                        influencer: {
                          name: video.influencer_name || "未知达人",
                          avatar: video.influencer_avatar || "/default-avatar.png",
                          followers: video.influencer_followers || "0",
                          rating: video.influencer_rating || 0
                        },
                        tags: video.tags || []
                      }
                    }
                  })}
                >
                  <div className="relative aspect-video">
                    <img
                      src={video.poster_url || "/default-thumbnail.png"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-thumbnail.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-800 ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                  </div>
                </div>
              ))
            ) : (
              // 无数据状态
              <div className="col-span-full text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">📹</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">暂无视频</h3>
                <p className="text-gray-600">请稍后再试</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              为什么选择我们
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              平台聚焦"人货匹配"与"高效协作"，通过任务发布、达人接单、沟通协作、结算保障、争议处理五大核心功能，帮助商家高效拓展海外市场。
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            准备开始您的TikTok直播带货之旅？
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            加入tkgogogo.com，与优质合作伙伴一起创造更大价值
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup"
              className="bg-white text-pink-600 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg transform hover:scale-105"
            >
              <Users className="w-5 h-5" />
              <span>我是达人</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/signup"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-medium hover:bg-white hover:text-pink-600 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Building2 className="w-5 h-5" />
              <span>我是品牌方</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
