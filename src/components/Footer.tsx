import React from 'react'
import { Video, Mail, Phone, MapPin, Heart } from 'lucide-react'

interface FooterProps {
  onPageChange: (page: string) => void
}

export function Footer({ onPageChange }: FooterProps) {
    const quickLinks = [
    { name: '关于我们', page: 'about' },
    { name: '服务条款', page: 'terms' },
    { name: '隐私政策', page: 'privacy' },
    { name: '帮助中心', page: 'help' },
    { name: '联系我们', page: 'contact' }
  ]

  const services = [
    { name: '达人服务', href: '#' },
    { name: '企业服务', href: '#' },
    { name: '直播管理', href: '#' },
    { name: '数据分析', href: '#' },
    { name: 'API接口', href: '#' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 品牌信息 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/logo.png" 
                alt="tkgogogo.com Logo" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                tkgogogo.com
              </span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              专业的TikTok代播平台，连接优质品牌与专业主播，提供高效的直播带货解决方案。
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="w-4 h-4" />
                <span className="text-sm">contact@tkgogogo.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="w-4 h-4" />
                <span className="text-sm">中国025-84799999 美国610-8577777</span>
              </div>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.page}>
                  <button
                    onClick={() => onPageChange(link.page)}
                    className="text-gray-300 hover:text-pink-400 transition-colors text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <span>© 2025 tkgogogo.com. 保留所有权利.</span>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>中国·江苏</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-gray-400 text-sm mt-4 md:mt-0">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-pink-500" />
              <span>by tkgo Team</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}