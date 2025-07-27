'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, TeamOutlined, HomeOutlined, ToolOutlined, SafetyOutlined, DatabaseOutlined } from '@ant-design/icons'
import LoginForm from '@/components/auth/LoginForm'
import UserManagement from '@/components/auth/UserManagement'
import HouseManagement from '@/components/houses/HouseManagement'
import CraftsmanManagement from '@/components/craftsmen/CraftsmanManagement'
import QualitySupervisionManagement from '@/components/quality/QualitySupervisionManagement'
import DataCollectionManagement from '@/components/data-collection/DataCollectionManagement'
import Dashboard from '@/components/dashboard/Dashboard'
import { getRoleDisplayName } from '@/lib/permissions'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

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

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  // 侧边栏菜单项
  const sideMenuItems = [
    {
      key: 'dashboard',
      icon: <UserOutlined />,
      label: '仪表板',
    },
    {
      key: 'houses',
      icon: <HomeOutlined />,
      label: '农房管理',
    },
    {
      key: 'craftsmen',
      icon: <ToolOutlined />,
      label: '工匠管理',
    },
    {
      key: 'quality',
      icon: <SafetyOutlined />,
      label: '质量安全监管',
    },
    {
      key: 'data-collection',
      icon: <DatabaseOutlined />,
      label: 'PC端数据采集',
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: '用户管理',
      // 只有管理员可以看到用户管理
      style: { 
        display: currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CITY_ADMIN' ? 'block' : 'none' 
      }
    },
  ]

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
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b flex justify-between items-center px-6">
        <div className="flex items-center">
          <Title level={4} className="mb-0 text-blue-600">
            青岛市农房建设管理平台
          </Title>
        </div>
        
        <div className="flex items-center">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" className="flex items-center">
              <Avatar icon={<UserOutlined />} className="mr-2" />
              <Space>
                <span>{currentUser?.realName}</span>
                <Text type="secondary" className="text-xs">
                  {getRoleDisplayName(currentUser?.role)}
                </Text>
              </Space>
            </Button>
          </Dropdown>
        </div>
      </Header>

      <Layout>
        <Sider width={200} className="bg-white shadow-sm">
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            items={sideMenuItems}
            className="h-full border-r-0"
            onClick={({ key }) => setSelectedMenu(key)}
          />
        </Sider>
        
        <Layout className="bg-gray-50">
          <Content className="min-h-screen">
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}