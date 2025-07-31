import React, { useState } from 'react'

const API_URL = 'https://www.aoksend.com/index/api/send_email'; // AOKSend 邮件发送接口
const API_KEY = import.meta.env.VITE_AOKSEND_API_KEY as string
const TEMPLATE_ID = 'E_125139060306'

export function EmailVerificationTest() {
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [codeSent, setCodeSent] = useState('')
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [inputCode, setInputCode] = useState('')
  const [result, setResult] = useState('')

  const generateCode = () => String(Math.floor(100000 + Math.random() * 900000))

  const sendEmail = async () => {
    if (!email) return alert('请输入邮箱')
    const code = generateCode()
    setCodeSent(code)
    setStep('verify')
    setIsSending(true)

    try {
      const formData = new URLSearchParams()
      formData.append('app_key', API_KEY)
      formData.append('to', email)
      formData.append('template_id', TEMPLATE_ID)
      formData.append('data', JSON.stringify({ code }))

      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.code === 0 || data.success || data.status === 'success') {
        setResult('验证码已发送，请查收邮件')
      } else {
        setResult(data.message || '发送失败')
      }
    } catch (e:any) {
      setResult('请求错误: ' + e.message)
    } finally {
      setIsSending(false)
    }
  }

  const verifyCode = () => {
    if (inputCode === codeSent) {
      setResult('验证通过！')
    } else {
      setResult('验证码错误')
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">邮件验证码测试</h1>

      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="请输入邮箱"
          />
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          onClick={sendEmail}
          disabled={isSending}
        >
          {isSending ? '发送中...' : '发送验证码'}
        </button>

        {step === 'verify' && (
          <>
            <div>
              <label className="block mb-1 text-gray-700">验证码</label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="输入收到的6位验证码"
              />
            </div>
            <button
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              onClick={verifyCode}
            >
              验证
            </button>
          </>
        )}

        {result && <p className="text-center mt-4 text-blue-600">{result}</p>}
      </div>
    </div>
  )
} 