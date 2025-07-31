import React from 'react'
import { Video, Users, Building2, Award, Target, Heart, ArrowRight, CheckCircle } from 'lucide-react'

export function AboutPage() {
  const stats = [
    { label: '注册用户', value: '50,000+', icon: Users },
    { label: '合作品牌', value: '1,200+', icon: Building2 },
    { label: '成功案例', value: '8,500+', icon: Award },
    { label: '直播场次', value: '25,000+', icon: Video },
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

  const timeline = [
    {
      year: '2023',
      title: '平台创立',
      description: 'tkgo.vip正式上线，开始为品牌和达人提供专业的直播带货服务'
    },
    {
      year: '2023',
      title: '快速发展',
      description: '用户数量突破1万，成功举办超过1000场直播活动'
    },
    {
      year: '2024',
      title: '规模扩张',
      description: '平台用户突破5万，合作品牌超过1000家，业务覆盖全国'
    },
    {
      year: '2024',
      title: '技术升级',
      description: '推出AI智能匹配系统，大幅提升达人与品牌的匹配效率'
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
                tkgo.vip
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
              <h2 className="text-3xl font-bold text-gray-900 mb-6">我们的使命</h2>
              <p className="text-lg text-gray-600 mb-6">
                在数字化营销时代，我们相信直播带货是连接品牌与消费者最有效的方式之一。
                tkgo.vip致力于构建一个透明、高效、互利共赢的生态平台。
              </p>
              <p className="text-lg text-gray-600 mb-8">
                我们通过先进的技术和专业的服务，帮助品牌找到最适合的达人合作伙伴，
                同时为达人提供优质的商业机会和全方位的支持。
              </p>
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

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">发展历程</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              从创立至今，我们始终专注于为用户创造价值
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-600 rounded-full"></div>
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="text-2xl font-bold text-pink-600 mb-2">{item.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="w-4 h-4 bg-white border-4 border-pink-500 rounded-full"></div>
                  </div>
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}