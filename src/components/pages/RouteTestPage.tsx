import React from 'react'
import { useParams, useLocation } from 'react-router-dom'

export function RouteTestPage() {
  const params = useParams()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">路由测试页面</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700">当前路径：</h2>
            <p className="text-gray-600">{location.pathname}</p>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-700">URL参数：</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(params, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-700">完整URL：</h2>
            <p className="text-gray-600">{window.location.href}</p>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-700">环境信息：</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>环境：{import.meta.env.MODE}</li>
              <li>开发环境：{import.meta.env.DEV ? '是' : '否'}</li>
              <li>生产环境：{import.meta.env.PROD ? '是' : '否'}</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-gray-700">测试链接：</h3>
          <div className="space-y-2">
            <a 
              href="/route-test/123" 
              className="block text-blue-600 hover:text-blue-800 underline"
            >
              测试动态路由: /route-test/123
            </a>
            <a 
              href="/route-test/abc-def-ghi" 
              className="block text-blue-600 hover:text-blue-800 underline"
            >
              测试UUID格式: /route-test/abc-def-ghi
            </a>
            <a 
              href="/influencer/f5524e34-1b9c-4f12-ad10-d841f3ae5cd9" 
              className="block text-blue-600 hover:text-blue-800 underline"
            >
              测试达人详情页
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 