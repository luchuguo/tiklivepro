import React from "react";
import { Link } from "react-router-dom";
import { Users, Building2, TrendingUp, Star, Play, ArrowRight } from "lucide-react";
import { Helmet } from 'react-helmet-async';

export function HomePage() {
  const stats = [
    { label: "Registered Users", icon: Users },
    { label: "Partner Brands", icon: Building2 },
    { label: "Success Cases", icon: Star },
    { label: "Live Sessions", icon: Play },
  ];

  const features = [
    {
      icon: Users,
      title: "Professional Creators",
      description: "Strictly vetted TikTok creators across key verticals to ensure content quality and performance."
    },
    {
      icon: Building2,
      title: "Brand Protection",
      description: "End-to-end safeguards from creator matching to performance tracking in one solution."
    },
    {
      icon: TrendingUp,
      title: "Data-Driven",
      description: "Intelligent, data-based matching that lifts success rate and ROI."
    },
    {
      icon: Star,
      title: "Quality Assurance",
      description: "Robust evaluation and QA to deliver the expected outcome on every collaboration."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Tkbubu | TikTok Livestream Agency</title>
        <meta name="keywords" content="TikTok代播、TikTok直播代播,TikTok代运营、TikTok视频剪辑、TikTok海外推广,TikTok代播平台、TikTok直播代运营公司、TikTok代播机构推荐" />
        <meta name="description" content="Tkbubu 是一个专业的 TikTok代播平台，提供TikTok直播代播、账号运营、视频剪辑服务，帮助商家拓展海外市场。" />
      </Helmet>
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
                TKBUBU – 
                <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  TikTok
                </span>
                {' '}Live Selling Marketplace
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Connect TikTok sellers with livestream hosts, UGC creators, and video editors worldwide
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/signup"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg transform hover:scale-105"
                >
                  <Users className="w-5 h-5" />
                  <span>Join as Creator</span>
                </Link>
                <Link 
                  to="/signup"
                  className="border-2 border-gray-300 text-gray-600 px-8 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 opacity-75"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Join as Brand</span>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/baner88.jpg"
                  alt="TikTok Live Streaming"
                  className="rounded-2xl shadow-2xl"
                />
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

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We focus on precise creator-product matching and efficient collaboration. Through five core features - mission posting, creator acceptance, communication & collaboration, secure settlement, and dispute resolution - we help global brands scale efficiently across markets.
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
            Ready to Start Your TikTok Live Streaming Sales Journey?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Join tkbubu.com and create greater value with quality partners
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup"
              className="bg-white text-pink-600 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg transform hover:scale-105"
            >
              <Users className="w-5 h-5" />
              <span>I'm a Creator</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/signup"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-medium hover:bg-white hover:text-pink-600 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Building2 className="w-5 h-5" />
              <span>I'm a Brand</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
