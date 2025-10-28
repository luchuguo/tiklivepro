import React from 'react'
import { Video, Mail, Phone, MapPin, Heart } from 'lucide-react'

interface FooterProps {
  onPageChange: (page: string) => void
}

export function Footer({ onPageChange }: FooterProps) {
    const quickLinks = [
    { name: 'About Us', page: 'about' },
    { name: 'Terms of Service', page: 'terms' },
    { name: 'Privacy Policy', page: 'privacy' },
    { name: 'Help Center', page: 'help' },
    { name: 'Contact Us', page: 'contact' },
    { name: 'Sitemap', page: 'sitemap', href: '/sitemap.xml' } // Add sitemap link
  ]

  const services = [
    { name: 'Influencer Services', href: '#' },
    { name: 'Company Services', href: '#' },
    { name: 'Live Management', href: '#' },
    { name: 'Data Analytics', href: '#' },
    { name: 'API Interface', href: '#' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Information */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/logo.png" 
                alt="Tkbubu Logo" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Tkbubu
              </span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
            A professional TikTok partner platform that connects brands with vetted creators and provides efficient live-selling solutions.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="w-4 h-4" />
                <span className="text-sm">contact@tkbubu.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="w-4 h-4" />
                <span className="text-sm">Tel (USA): +1-610-8577777   |   Tel (China): +86-25-84799999</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.page}>
                  {link.href ? (
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-pink-400 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <button
                      onClick={() => onPageChange(link.page)}
                      className="text-gray-300 hover:text-pink-400 transition-colors text-left"
                    >
                      {link.name}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <span>© 2025 Tkbubu. All rights reserved.</span>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>USA · Los Angeles, CA   |   China · Jiangsu</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-gray-400 text-sm mt-4 md:mt-0">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-pink-500" />
              <span>by Tkbubu Team</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}