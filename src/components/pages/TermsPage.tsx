import React from 'react'
import { Shield, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

export function TermsPage() {
  const sections = [
    {
      title: '1. 服务条款的接受',
      content: [
        '欢迎使用tkbubu.com平台。通过访问或使用我们的服务，您同意受本服务条款的约束。',
        '如果您不同意这些条款，请不要使用我们的服务。',
        '我们保留随时修改这些条款的权利，修改后的条款将在网站上公布后生效。'
      ]
    },
    {
      title: '2. 服务描述',
      content: [
        'tkbubu.com是一个连接品牌方与TikTok达人的专业直播带货平台。',
        '我们提供任务发布、达人匹配、直播管理、数据分析等服务。',
        '平台致力于为用户提供安全、高效、透明的交易环境。'
      ]
    },
    {
      title: '3. 用户注册与账户',
      content: [
        '用户必须提供真实、准确、完整的注册信息。',
        '用户有责任维护账户安全，包括密码的保密。',
        '禁止创建虚假账户或冒充他人身份。',
        '每个用户只能注册一个账户，重复注册将被禁止。'
      ]
    },
    {
      title: '4. 用户行为规范',
      content: [
        '用户不得发布违法、有害、威胁、辱骂、骚扰、诽谤、粗俗、淫秽或其他不当内容。',
        '禁止进行任何形式的欺诈、虚假宣传或误导性行为。',
        '不得干扰或破坏平台的正常运行。',
        '尊重其他用户的权利和隐私。'
      ]
    },
    {
      title: '5. 交易规则',
      content: [
        '所有交易必须通过平台进行，禁止私下交易。',
        '品牌方应按时支付约定费用，达人应按约定完成直播任务。',
        '平台将收取一定比例的服务费用。',
        '如发生争议，平台将根据相关证据进行仲裁。'
      ]
    },
    {
      title: '6. 知识产权',
      content: [
        '平台的所有内容、功能和服务均受知识产权法保护。',
        '用户上传的内容应确保不侵犯他人知识产权。',
        '未经许可，不得复制、修改、分发平台的任何内容。'
      ]
    },
    {
      title: '7. 隐私保护',
      content: [
        '我们重视用户隐私，将按照隐私政策处理用户信息。',
        '用户信息仅用于提供服务和改善用户体验。',
        '未经用户同意，不会向第三方披露用户个人信息。'
      ]
    },
    {
      title: '8. 免责声明',
      content: [
        '平台仅提供信息撮合服务，不对交易结果承担责任。',
        '用户应自行承担使用平台服务的风险。',
        '平台不保证服务的连续性和无错误性。',
        '对于不可抗力因素导致的服务中断，平台不承担责任。'
      ]
    },
    {
      title: '9. 服务终止',
      content: [
        '用户可随时停止使用服务并注销账户。',
        '平台有权因用户违反条款而暂停或终止服务。',
        '服务终止后，用户的权利和义务仍受相关条款约束。'
      ]
    },
    {
      title: '10. 法律适用',
      content: [
        '本条款受中华人民共和国法律管辖。',
        '如发生争议，双方应友好协商解决。',
        '协商不成的，提交有管辖权的人民法院解决。'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">服务条款</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              请仔细阅读以下服务条款。使用tkbubu.com平台即表示您同意遵守这些条款。
            </p>
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>最后更新：2024年1月1日</span>
              <span>•</span>
              <span>版本：v2.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">重要提示</h3>
              <p className="text-amber-700">
                本服务条款是您与tkbubu.com之间的法律协议。请在使用我们的服务前仔细阅读并理解所有条款。
                如果您对任何条款有疑问，请联系我们的客服团队。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.map((paragraph, pIndex) => (
                    <div key={pIndex} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{paragraph}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">需要帮助？</h3>
            <p className="text-gray-600 mb-6">
              如果您对服务条款有任何疑问或需要进一步说明，请随时联系我们的客服团队。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                联系客服
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
                发送邮件
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}