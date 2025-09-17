import React from 'react'
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle, Mail } from 'lucide-react'

export function PrivacyPage() {
  const dataTypes = [
    {
      icon: UserCheck,
      title: '账户信息',
      description: '包括用户名、邮箱地址、手机号码等注册信息',
      usage: '用于账户管理、身份验证和服务提供'
    },
    {
      icon: Database,
      title: '业务数据',
      description: '包括任务发布、申请记录、交易历史等业务相关信息',
      usage: '用于服务提供、数据分析和业务优化'
    },
    {
      icon: Eye,
      title: '使用数据',
      description: '包括访问日志、操作记录、设备信息等使用行为数据',
      usage: '用于服务改进、安全防护和用户体验优化'
    }
  ]

  const protectionMeasures = [
    {
      icon: Lock,
      title: '数据加密',
      description: '采用行业标准的加密技术保护数据传输和存储安全'
    },
    {
      icon: Shield,
      title: '访问控制',
      description: '严格的权限管理，确保只有授权人员才能访问用户数据'
    },
    {
      icon: Database,
      title: '安全存储',
      description: '使用安全的云服务提供商，定期备份和安全审计'
    },
    {
      icon: AlertCircle,
      title: '监控预警',
      description: '24/7安全监控，及时发现和处理潜在的安全威胁'
    }
  ]

  const userRights = [
    '查看和获取您的个人数据副本',
    '更正不准确或不完整的个人数据',
    '删除不再需要的个人数据',
    '限制或反对某些数据处理活动',
    '数据可携带权（在技术可行的情况下）',
    '撤回之前给予的同意'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">隐私政策</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              我们深知隐私保护的重要性，本政策详细说明了我们如何收集、使用和保护您的个人信息。
            </p>
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>最后更新：2024年1月1日</span>
              <span>•</span>
              <span>版本：v2.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">隐私保护承诺</h2>
            <p className="text-gray-700 leading-relaxed">
              tkgogogo.com致力于保护用户隐私，我们严格遵守相关法律法规，采用先进的技术手段和管理措施，
              确保您的个人信息安全。我们承诺不会出售、出租或以其他方式向第三方披露您的个人信息，
              除非获得您的明确同意或法律要求。
            </p>
          </div>

          {/* Data Collection */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">我们收集的信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dataTypes.map((type, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{type.title}</h3>
                  <p className="text-gray-600 mb-4">{type.description}</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700"><strong>用途：</strong>{type.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Usage */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">信息使用方式</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">服务提供</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• 创建和管理用户账户</li>
                    <li>• 提供平台核心功能</li>
                    <li>• 处理交易和支付</li>
                    <li>• 客户服务和技术支持</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">服务改进</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• 分析用户行为和偏好</li>
                    <li>• 优化平台功能和性能</li>
                    <li>• 开发新功能和服务</li>
                    <li>• 个性化推荐和匹配</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">安全保障</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• 防范欺诈和滥用行为</li>
                    <li>• 维护平台安全稳定</li>
                    <li>• 遵守法律法规要求</li>
                    <li>• 保护用户合法权益</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">沟通联系</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• 发送重要通知和更新</li>
                    <li>• 营销推广（需用户同意）</li>
                    <li>• 调研和反馈收集</li>
                    <li>• 法律通知和政策变更</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Protection */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">数据保护措施</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {protectionMeasures.map((measure, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <measure.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{measure.title}</h3>
                  </div>
                  <p className="text-gray-600">{measure.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* User Rights */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">您的权利</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <p className="text-gray-700 mb-6">
                根据相关法律法规，您对自己的个人信息享有以下权利：
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userRights.map((right, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-700">{right}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  <strong>如何行使权利：</strong>
                  您可以通过平台设置页面、客服邮箱或客服电话联系我们，我们将在法定时间内响应您的请求。
                </p>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">信息共享</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">我们不会共享您的个人信息，除非：</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• 获得您的明确同意</li>
                    <li>• 法律法规要求或政府部门要求</li>
                    <li>• 为保护我们或他人的合法权益</li>
                    <li>• 与可信的第三方服务提供商（仅限于提供服务所需）</li>
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 mb-1">第三方服务</h4>
                      <p className="text-amber-700 text-sm">
                        我们可能使用第三方服务提供商来支持我们的服务（如支付处理、数据分析等）。
                        这些服务提供商只能在提供服务的范围内访问您的信息，并受到严格的保密协议约束。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">联系我们</h2>
            <p className="text-gray-700 mb-6">
              如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4">
                <strong className="text-gray-900">邮箱地址</strong>
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-600">privacy@tkgogogo.com</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <strong className="text-gray-900">客服电话</strong>
                <p className="text-gray-600">中国025-84799999 美国610-8577777</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <strong className="text-gray-900">工作时间</strong>
                <p className="text-gray-600">周一至周五 9:00-18:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}