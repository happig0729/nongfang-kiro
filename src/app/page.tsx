'use client'

import { useState, useEffect } from 'react'
import { ToolOutlined, SafetyOutlined, DatabaseOutlined, TeamOutlined, HomeOutlined, BarChartOutlined } from '@ant-design/icons'
import LoginForm from '@/components/auth/LoginForm'
import UserManagement from '@/components/auth/UserManagement'
import HouseManagement from '@/components/houses/HouseManagement'
import CraftsmanManagement from '@/components/craftsmen/CraftsmanManagement'
import QualitySupervisionManagement from '@/components/quality/QualitySupervisionManagement'
import DataCollectionManagement from '@/components/data-collection/DataCollectionManagement'
import Dashboard from '@/components/dashboard/Dashboard'
import MainLayout from '@/components/layout/MainLayout'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [token, setToken] = useState<string>('')
  const [selectedMenu, setSelectedMenu] = useState('dashboard')

  // 检查登录状态
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user_info')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setCurrentUser(JSON.parse(savedUser))
      setIsLoggedIn(true)
    }
  }, [])

  // 处理登录
  const handleLogin = (authToken: string, user: any) => {
    setToken(authToken)
    setCurrentUser(user)
    setIsLoggedIn(true)
  }

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    setToken('')
    setCurrentUser(null)
    setIsLoggedIn(false)
    setSelectedMenu('dashboard')
  }

  // 获取面包屑导航项
  const getBreadcrumbItems = () => {
    const breadcrumbMap: Record<string, { title: string; icon: React.ReactNode }> = {
      dashboard: { title: '仪表板', icon: <BarChartOutlined /> },
      houses: { title: '农房管理', icon: <HomeOutlined /> },
      craftsmen: { title: '工匠管理', icon: <ToolOutlined /> },
      quality: { title: '质量安全监管', icon: <SafetyOutlined /> },
      'data-collection': { title: 'PC端数据采集', icon: <DatabaseOutlined /> },
      users: { title: '用户管理', icon: <TeamOutlined /> },
    }

    const current = breadcrumbMap[selectedMenu]
    return current ? [current] : []
  }

  // 渲染内容区域
  const renderContent = () => {
    switch (selectedMenu) {
      case 'houses':
        return <HouseManagement />
      case 'craftsmen':
        return <CraftsmanManagement currentUser={currentUser} />
      case 'quality':
        return <QualitySupervisionManagement currentUser={currentUser} />
      case 'data-collection':
        return <DataCollectionManagement currentUser={currentUser} />
      case 'users':
        return <UserManagement token={token} currentUser={currentUser} />
      case 'dashboard':
      default:
        return <Dashboard currentUser={currentUser} />
    }
  }

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />
  }

  // 已登录，显示主界面
  return (
    <MainLayout
      currentUser={currentUser}
      selectedMenu={selectedMenu}
      onMenuSelect={setSelectedMenu}
      onLogout={handleLogout}
      breadcrumbItems={getBreadcrumbItems()}
    >
      {renderContent()}
    </MainLayout>
  )
}