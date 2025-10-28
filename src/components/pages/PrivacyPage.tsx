import React from 'react'
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle, Mail } from 'lucide-react'

export function PrivacyPage() {
  const dataTypes = [
    {
      icon: UserCheck,
      title: 'Account Information',
      description: 'Including username, email address, phone number and other registration information',
      usage: 'Used for account management, identity verification and service provision'
    },
    {
      icon: Database,
      title: 'Business Data',
      description: 'Including task publishing, application records, transaction history and other business-related information',
      usage: 'Used for service provision, data analysis and business optimization'
    },
    {
      icon: Eye,
      title: 'Usage Data',
      description: 'Including access logs, operation records, device information and other usage behavior data',
      usage: 'Used for service improvement, security protection and user experience optimization'
    }
  ]

  const protectionMeasures = [
    {
      icon: Lock,
      title: 'Data Encryption',
      description: 'Industry-standard encryption technology to protect data transmission and storage security'
    },
    {
      icon: Shield,
      title: 'Access Control',
      description: 'Strict permission management to ensure only authorized personnel can access user data'
    },
    {
      icon: Database,
      title: 'Secure Storage',
      description: 'Using secure cloud service providers with regular backups and security audits'
    },
    {
      icon: AlertCircle,
      title: 'Monitoring & Alerts',
      description: '24/7 security monitoring to promptly detect and handle potential security threats'
    }
  ]

  const userRights = [
    'View and obtain a copy of your personal data',
    'Correct inaccurate or incomplete personal data',
    'Delete personal data that is no longer needed',
    'Restrict or object to certain data processing activities',
    'Data portability rights (where technically feasible)',
    'Withdraw previously given consent'
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We understand the importance of privacy protection. This policy details how we collect, use, and protect your personal information.
            </p>
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>Last Updated: January 1, 2024</span>
              <span>•</span>
              <span>Version: v2.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Protection Commitment</h2>
            <p className="text-gray-700 leading-relaxed">
              tkbubu.com is committed to protecting user privacy. We strictly comply with relevant laws and regulations, using advanced technical measures and management practices
              to ensure the security of your personal information. We promise not to sell, rent, or otherwise disclose your personal information to third parties
              unless we have obtained your explicit consent or are required by law.
            </p>
          </div>

          {/* Data Collection */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Information We Collect</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dataTypes.map((type, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{type.title}</h3>
                  <p className="text-gray-600 mb-4">{type.description}</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700"><strong>Purpose:</strong> {type.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Usage */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">How We Use Information</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Provision</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Create and manage user accounts</li>
                    <li>• Provide core platform features</li>
                    <li>• Process transactions and payments</li>
                    <li>• Customer service and technical support</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Improvement</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Analyze user behavior and preferences</li>
                    <li>• Optimize platform features and performance</li>
                    <li>• Develop new features and services</li>
                    <li>• Personalized recommendations and matching</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Security Assurance</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Prevent fraud and abuse</li>
                    <li>• Maintain platform security and stability</li>
                    <li>• Comply with legal and regulatory requirements</li>
                    <li>• Protect users' legitimate rights and interests</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Communication</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Send important notices and updates</li>
                    <li>• Marketing promotions (with user consent)</li>
                    <li>• Research and feedback collection</li>
                    <li>• Legal notices and policy changes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Protection */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Data Protection Measures</h2>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Rights</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <p className="text-gray-700 mb-6">
                According to relevant laws and regulations, you have the following rights regarding your personal information:
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
                  <strong>How to Exercise Your Rights:</strong>
                  You can contact us through the platform settings page, customer service email, or customer service phone. We will respond to your request within the legally required time.
                </p>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Information Sharing</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">We will not share your personal information unless:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• We have obtained your explicit consent</li>
                    <li>• Required by laws and regulations or government authorities</li>
                    <li>• To protect our or others' legitimate rights and interests</li>
                    <li>• With trusted third-party service providers (only to the extent necessary to provide services)</li>
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 mb-1">Third-Party Services</h4>
                      <p className="text-amber-700 text-sm">
                        We may use third-party service providers to support our services (such as payment processing, data analysis, etc.).
                        These service providers can only access your information to the extent necessary to provide services and are bound by strict confidentiality agreements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about this Privacy Policy or need to exercise your rights, please contact us through the following methods:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4">
                <strong className="text-gray-900">Email Address</strong>
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-600">privacy@tkbubu.com</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <strong className="text-gray-900">Customer Service</strong>
                <p className="text-gray-600">Tel (USA): +1-610-8577777   |   Tel (China): +86-25-84799999</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <strong className="text-gray-900">Business Hours</strong>
                <p className="text-gray-600">Monday to Friday 9:00-18:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}