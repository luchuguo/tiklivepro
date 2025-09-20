import React from 'react'
import { Video, Users, Building2, Award, Target, Heart, ArrowRight, CheckCircle } from 'lucide-react'

export function AboutPage() {
  const stats = [
    { label: '注册用户', value: '持续增长', icon: Users },
    { label: '合作品牌', value: '不断扩大', icon: Building2 },
    { label: '成功案例', value: '快速积累', icon: Award },
    { label: '直播场次', value: '稳步提升', icon: Video },
  ]

  const values = [
    {
      icon: Target,
      title: '专业专注',
      description: '专注TikTok直播带货领域，提供最专业的服务和解决方案'
    },
    {
      icon: Heart,
      title: '用户至上',
      description: '始终将用户体验放在首位，持续优化产品和服务质量'
    },
    {
      icon: CheckCircle,
      title: '诚信可靠',
      description: '建立透明、公正的平台机制，保障各方权益和交易安全'
    },
    {
      icon: Award,
      title: '追求卓越',
      description: '不断创新技术和服务模式，引领行业发展趋势'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              关于
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                tkbubu.com
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              我们致力于打造最专业的TikTok直播带货平台，连接优质品牌与专业达人，
              为商家提供高效的营销解决方案，为达人创造更多变现机会。
            </p>
            <div className="flex justify-center">
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2">
                <span>了解更多</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
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

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">服务对象</h2>
              <ul className="list-disc pl-6 text-lg text-gray-600 mb-8 space-y-2">
                <li>中国商家 / 工厂 / 品牌方：希望在TikTok国际市场拓展销量。</li>
                <li>海外TikTok达人 / 华人主播 / 工作室：具备带货能力、希望接单变现。</li>
              </ul>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700">专业的达人筛选和认证体系</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700">智能化的匹配推荐算法</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700">完善的交易保障机制</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="团队协作"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="text-2xl font-bold text-pink-600">99.8%</div>
                <div className="text-gray-600">客户满意度</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">我们的价值观</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              这些核心价值观指导着我们的每一个决策，塑造着我们的企业文化
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}