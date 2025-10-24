import React from 'react'
import { Shield, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

export function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: [
        'Welcome to the tkbubu.com platform. By accessing or using our services, you agree to be bound by these Terms of Service.',
        'If you do not agree to these terms, please do not use our services.',
        'We reserve the right to modify these terms at any time, and the modified terms will take effect after being published on the website.'
      ]
    },
    {
      title: '2. Service Description',
      content: [
        'tkbubu.com is a professional live streaming e-commerce platform connecting brands with TikTok influencers.',
        'We provide services including task publishing, influencer matching, live streaming management, and data analysis.',
        'The platform is committed to providing users with a safe, efficient, and transparent trading environment.'
      ]
    },
    {
      title: '3. User Registration and Accounts',
      content: [
        'Users must provide true, accurate, and complete registration information.',
        'Users are responsible for maintaining account security, including password confidentiality.',
        'Creating fake accounts or impersonating others is prohibited.',
        'Each user can only register one account; duplicate registration is prohibited.'
      ]
    },
    {
      title: '4. User Conduct Standards',
      content: [
        'Users shall not post illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or other inappropriate content.',
        'Any form of fraud, false advertising, or misleading behavior is prohibited.',
        'Do not interfere with or disrupt the normal operation of the platform.',
        'Respect the rights and privacy of other users.'
      ]
    },
    {
      title: '5. Trading Rules',
      content: [
        'All transactions must be conducted through the platform; private transactions are prohibited.',
        'Brands should pay agreed fees on time, and influencers should complete live streaming tasks as agreed.',
        'The platform will charge a certain percentage of service fees.',
        'In case of disputes, the platform will arbitrate based on relevant evidence.'
      ]
    },
    {
      title: '6. Intellectual Property',
      content: [
        'All content, features, and services on the platform are protected by intellectual property laws.',
        'User-uploaded content should ensure no infringement of others\' intellectual property rights.',
        'Without permission, no content from the platform may be copied, modified, or distributed.'
      ]
    },
    {
      title: '7. Privacy Protection',
      content: [
        'We value user privacy and will handle user information in accordance with our Privacy Policy.',
        'User information is only used to provide services and improve user experience.',
        'We will not disclose user personal information to third parties without user consent.'
      ]
    },
    {
      title: '8. Disclaimer',
      content: [
        'The platform only provides information matching services and is not responsible for transaction results.',
        'Users should bear the risks of using the platform services themselves.',
        'The platform does not guarantee service continuity and error-free operation.',
        'The platform is not responsible for service interruptions caused by force majeure.'
      ]
    },
    {
      title: '9. Service Termination',
      content: [
        'Users may stop using the service and cancel their accounts at any time.',
        'The platform has the right to suspend or terminate services if users violate the terms.',
        'After service termination, users\' rights and obligations remain subject to relevant terms.'
      ]
    },
    {
      title: '10. Applicable Law',
      content: [
        'These terms are governed by the laws of the People\'s Republic of China.',
        'In case of disputes, both parties should resolve them through friendly negotiation.',
        'If negotiation fails, the dispute shall be submitted to a competent people\'s court for resolution.'
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Please read the following Terms of Service carefully. By using the tkbubu.com platform, you agree to comply with these terms.
            </p>
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>Last Updated: January 1, 2024</span>
              <span>•</span>
              <span>Version: v2.0</span>
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
              <h3 className="font-semibold text-amber-800 mb-2">Important Notice</h3>
              <p className="text-amber-700">
                These Terms of Service constitute a legal agreement between you and tkbubu.com. Please read and understand all terms carefully before using our services.
                If you have any questions about any terms, please contact our customer service team.
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
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-6">
              If you have any questions about the Terms of Service or need further clarification, please feel free to contact our customer service team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                Contact Support
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
                Send Email
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}