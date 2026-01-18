import React from 'react'
import { Video, Users, Building2, Award, Target, Heart, ArrowRight, CheckCircle } from 'lucide-react'

export function AboutPage() {
  const stats = [
    { label: 'Registered Users', value: 'Continuous Growth', icon: Users },
    { label: 'Partner Brands', value: 'Expanding', icon: Building2 },
    { label: 'Success Cases', value: 'Rapidly Growing', icon: Award },
    { label: 'Live Sessions', value: 'Steadily Increasing', icon: Video },
  ]

  const values = [
    {
      icon: Target,
      title: 'Professional Focus',
      description: 'Focused on TikTok live streaming e-commerce, providing the most professional services and solutions'
    },
    {
      icon: Heart,
      title: 'User First',
      description: 'Always putting user experience first, continuously optimizing products and service quality'
    },
    {
      icon: CheckCircle,
      title: 'Integrity & Reliability',
      description: 'Establishing transparent and fair platform mechanisms to protect the rights and transaction security of all parties'
    },
    {
      icon: Award,
      title: 'Pursuit of Excellence',
      description: 'Continuously innovating technology and service models, leading industry development trends'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              About
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                tkbubu.com
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We are committed to building the most professional TikTok live streaming e-commerce platform, connecting quality brands with professional influencers,
              providing efficient marketing solutions for merchants and creating more monetization opportunities for influencers.
            </p>
            <div className="flex justify-center">
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2">
                <span>Learn More</span>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Services</h2>
              <ul className="list-disc pl-6 text-lg text-gray-600 mb-8 space-y-2">
                <li>Merchants / Factories / Brands: Looking to expand sales in TikTok international markets.</li>
                <li>Overseas TikTok Influencers / Streamers / Studios: With sales capabilities, seeking monetization opportunities.</li>
              </ul>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700">Professional influencer screening and certification system</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700">Intelligent matching recommendation algorithm</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700">Comprehensive transaction guarantee mechanism</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Team Collaboration"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="text-2xl font-bold text-pink-600">99.8%</div>
                <div className="text-gray-600">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These core values guide every decision we make and shape our corporate culture
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