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
    { icon: Users, title: 'Influencers', description: 'Registration, certification, task application, live streaming management' },
    { icon: Building2, title: 'Enterprise Users', description: 'Task publishing, influencer selection, performance evaluation' },
    { icon: CreditCard, title: 'Payment & Settlement', description: 'Fee explanations, payment methods, invoice issuance' },
    { icon: Shield, title: 'Security', description: 'Account security, transaction protection, dispute resolution' },
    { icon: Settings, title: 'Platform Features', description: 'Feature usage, settings management, technical support' },
    { icon: Video, title: 'Live Streaming', description: 'Streaming equipment, stream settings, data statistics' }
  ]

  const faqs = [
    {
      category: 'Influencers',
      question: 'How to become a certified influencer?',
      answer: 'You need to complete the following steps: 1) Complete your profile, including real name, contact information, etc.; 2) Link your TikTok account and verify follower count; 3) Upload identity verification documents; 4) Wait for platform review (usually 1-3 business days). After approval, you will receive a certification badge and can apply for more quality tasks.'
    },
    {
      category: 'Influencers',
      question: 'How to apply for live streaming tasks?',
      answer: 'Browse suitable tasks in the Task Center, click the "Apply Now" button, and fill in application information including: expected live streaming time, quote, personal advantages, etc. Brands will screen applicants based on your profile and application information. If selected, you will receive a notification.'
    },
    {
      category: 'Enterprise Users',
      question: 'How to publish live streaming tasks?',
      answer: 'After logging into your enterprise account, click "Publish Task" and fill in detailed information: product introduction, live streaming requirements, budget range, schedule, etc. After publishing, the task will be displayed in the influencer hall, and influencers can apply for your task. You can review applicant profiles and select suitable influencers.'
    },
    {
      category: 'Enterprise Users',
      question: 'How to choose suitable influencers?',
      answer: 'We recommend considering the following dimensions: 1) Follower quantity and quality; 2) Historical live streaming data and conversion rates; 3) Whether content style matches the product; 4) Whether the quote is within budget; 5) Schedule compatibility. The platform provides intelligent recommendation features to help you quickly find matching influencers.'
    },
    {
      category: 'Payment & Settlement',
      question: 'How does the platform charge fees?',
      answer: 'The platform uses a commission-based fee model: after an influencer completes a live streaming task, the platform charges a 10% service fee from the total amount. The fee paid by the brand includes both the influencer fee and the platform service fee. Specific fees will be clearly displayed when confirming the task.'
    },
    {
      category: 'Payment & Settlement',
      question: 'When are fees settled?',
      answer: 'Within 24 hours after the live stream ends, if there are no disputes, the system will automatically settle. Influencer fees will be credited within 3-5 business days. If there are disputes, settlement will be suspended until the dispute is resolved. Brands can apply for invoice issuance.'
    },
    {
      category: 'Security',
      question: 'How to ensure transaction security?',
      answer: 'The platform provides multiple protections: 1) Real-name authentication ensures user identity authenticity; 2) Fund escrow - payment to the platform first, then settlement to influencers; 3) Complete rating system and credit records; 4) Professional customer service team handles disputes; 5) Insurance coverage for transaction risks.'
    },
    {
      category: 'Security',
      question: 'How to handle disputes?',
      answer: 'If a dispute occurs, please contact customer service promptly and provide relevant evidence. We will intervene and mediate within 24 hours, making fair decisions based on contract terms, chat records, live stream recordings, and other evidence. Serious breach of contract will affect credit records.'
    }
  ]

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Online Support',
      description: '7×24 hours online service',
      action: 'Chat Now',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: Phone,
      title: 'Customer Hotline',
      description: 'China 025-84799999 USA 610-8577777',
      action: 'Call Now',
      color: 'from-green-500 to-blue-600'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'contact@tkbubu.com',
      action: 'Send Email',
      color: 'from-pink-500 to-red-600'
    }
  ]

  const resources = [
    {
      icon: Book,
      title: 'Beginner\'s Guide',
      description: 'Detailed platform usage tutorials',
      items: ['Registration Process', 'Feature Introduction', 'Operation Guide']
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Visual operation demonstration videos',
      items: ['Task Publishing', 'Live Stream Settings', 'Data Analysis']
    },
    {
      icon: Lightbulb,
      title: 'Best Practices',
      description: 'Success stories and experience sharing',
      items: ['Marketing Strategy', 'Content Creation', 'Data Optimization']
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              We provide comprehensive help documentation and professional customer support to help you get started quickly and make full use of platform features.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search questions or keywords..."
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
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Help Categories</h2>
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
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
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
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Learning Resources</h2>
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
                  Learn More →
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-lg text-gray-600">
              Can't find the answer? Our professional customer service team is always here to help
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