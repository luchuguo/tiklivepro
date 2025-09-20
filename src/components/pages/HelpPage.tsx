import React, { useState } from 'react'
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  MessageCircle, 
  Phone, 
  Mail,
  Book,
  Video,
  Users,
  Building2,
  CreditCard,
  Shield,
  Settings,
  Lightbulb
} from 'lucide-react'

export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const categories = [
    { icon: Users, title: '达人主播', description: '注册认证、任务申请、直播管理' },
    { icon: Building2, title: '企业用户', description: '任务发布、达人选择、效果评估' },
    { icon: CreditCard, title: '支付结算', description: '费用说明、支付方式、发票开具' },
    { icon: Shield, title: '安全保障', description: '账户安全、交易保护、争议处理' },
    { icon: Settings, title: '平台功能', description: '功能使用、设置管理、技术支持' },
    { icon: Video, title: '直播相关', description: '直播设备、推流设置、数据统计' }
  ]

  const faqs = [
    {
      category: '达人主播',
      question: '如何成为认证达人？',
      answer: '您需要完成以下步骤：1) 完善个人资料，包括真实姓名、联系方式等；2) 绑定TikTok账号并验证粉丝数量；3) 上传身份证明文件；4) 等待平台审核（通常1-3个工作日）。审核通过后，您将获得认证标识，可以申请更多优质任务。'
    },
    {
      category: '达人主播',
      question: '如何申请直播任务？',
      answer: '在任务大厅中浏览适合的任务，点击"立即申请"按钮，填写申请信息包括：预期直播时间、报价、个人优势等。企业方会根据您的资料和申请信息进行筛选，如果被选中会收到通知。'
    },
    {
      category: '企业用户',
      question: '如何发布直播任务？',
      answer: '登录企业账户后，点击"发布任务"，填写详细信息：产品介绍、直播要求、预算范围、时间安排等。发布后任务会在达人大厅展示，达人可以申请您的任务。您可以查看申请者资料并选择合适的达人。'
    },
    {
      category: '企业用户',
      question: '如何选择合适的达人？',
      answer: '建议从以下几个维度考虑：1) 粉丝数量和质量；2) 历史直播数据和转化率；3) 内容风格是否匹配产品；4) 报价是否在预算范围内；5) 档期是否符合要求。平台提供智能推荐功能，帮助您快速找到匹配的达人。'
    },
    {
      category: '支付结算',
      question: '平台如何收费？',
      answer: '平台采用佣金制收费模式：达人完成直播任务后，平台从总费用中收取10%的服务费。企业方支付的费用包含达人费用和平台服务费。具体费用在任务确认时会明确显示。'
    },
    {
      category: '支付结算',
      question: '什么时候结算费用？',
      answer: '直播结束后24小时内，如无争议，系统会自动结算。达人费用会在3-5个工作日内到账。如有争议，会暂停结算直到争议解决。企业方可以申请开具发票。'
    },
    {
      category: '安全保障',
      question: '如何保障交易安全？',
      answer: '平台提供多重保障：1) 实名认证确保用户身份真实；2) 资金托管，先付款到平台再结算给达人；3) 完整的评价体系和信用记录；4) 专业客服团队处理争议；5) 保险保障覆盖交易风险。'
    },
    {
      category: '安全保障',
      question: '遇到争议如何处理？',
      answer: '如果发生争议，请及时联系客服并提供相关证据。我们会在24小时内介入调解，根据合同条款、聊天记录、直播录像等证据进行公正裁决。严重违约行为会影响信用记录。'
    }
  ]

  const contactMethods = [
    {
      icon: MessageCircle,
      title: '在线客服',
      description: '7×24小时在线服务',
      action: '立即咨询',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: Phone,
      title: '客服热线',
      description: '中国025-84799999 美国610-8577777',
      action: '拨打电话',
      color: 'from-green-500 to-blue-600'
    },
    {
      icon: Mail,
      title: '邮件支持',
              description: 'contact@tkbubu.com',
      action: '发送邮件',
      color: 'from-pink-500 to-red-600'
    }
  ]

  const resources = [
    {
      icon: Book,
      title: '新手指南',
      description: '详细的平台使用教程',
      items: ['注册流程', '功能介绍', '操作指南']
    },
    {
      icon: Video,
      title: '视频教程',
      description: '直观的操作演示视频',
      items: ['任务发布', '直播设置', '数据分析']
    },
    {
      icon: Lightbulb,
      title: '最佳实践',
      description: '成功案例和经验分享',
      items: ['营销策略', '内容创作', '数据优化']
    }
  ]

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">帮助中心</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              我们为您提供全面的帮助文档和专业的客服支持，让您快速上手并充分利用平台功能。
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜索问题或关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">帮助分类</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-gray-600">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">常见问题</h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-3">
                      {faq.category}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  </div>
                  {expandedFaq === index ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">学习资源</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                  <resource.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{resource.title}</h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <ul className="space-y-2">
                  {resource.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center space-x-2 text-gray-700">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-4 text-purple-600 hover:text-purple-700 font-medium">
                  查看更多 →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">联系我们</h2>
            <p className="text-lg text-gray-600">
              找不到答案？我们的专业客服团队随时为您提供帮助
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className={`w-16 h-16 bg-gradient-to-r ${method.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <method.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-gray-600 mb-4">{method.description}</p>
                <button className={`bg-gradient-to-r ${method.color} text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all`}>
                  {method.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}