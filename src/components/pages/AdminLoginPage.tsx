import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLogin } from '../AdminLogin'

export function AdminLoginPage() {
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    navigate('/admin')
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <AdminLogin 
      onLoginSuccess={handleLoginSuccess}
      onBack={handleBack}
    />
  )
}