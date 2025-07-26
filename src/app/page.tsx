'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, TeamOutlined, HomeOutlined, ToolOutlined } from '@ant-design/icons'
import LoginForm from '@/components/auth/LoginForm'
import UserManagement from '@/components/auth/UserManagement'
import HouseManagement from '@/components/houses/HouseManagement'
import CraftsmanManagement from '@/components/craftsmen/CraftsmanManagement'
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
      case 'users':
        return <UserManagement token={token} currentUser={currentUser} />
      case 'dashboard':
      default:
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow p-6">
              <Title level={2}>欢迎使用青岛市农房建设管理平台</Title>
              <div className="mt-4 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Title level={4} className="text-blue-600 mb-2">当前用户信息</Title>
                  <Space direction="vertical">
                    <Text><strong>姓名：</strong>{currentUser?.realName}</Text>
                    <Text><strong>角色：</strong>{getRoleDisplayName(currentUser?.role)}</Text>
                    <Text><strong>区域：</strong>{currentUser?.regionName}</Text>
                    <Text><strong>状态：</strong>
                      <span className="text-green-600 ml-1">
                        {currentUser?.status === 'ACTIVE' ? '活跃' : currentUser?.status}
                      </span>
                    </Text>
                  </Space>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <Title level={4} className="text-green-600 mb-2">系统功能</Title>
                  <ul className="space-y-2">
                    <li>• 农房建设信息管理</li>
                    <li>• 乡村建设工匠培训</li>
                    <li>• 工匠信用评价系统</li>
                    <li>• 质量安全监督管理</li>
                    <li>• 数据统计分析</li>
                  </ul>
                </div>

                {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CITY_ADMIN') && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <Title level={4} className="text-orange-600 mb-2">管理员功能</Title>
                    <p>您拥有管理员权限，可以访问用户管理等高级功能。</p>
                    <Button 
                      type="primary" 
                      className="mt-2"
                      onClick={() => setSelectedMenu('users')}
                    >
                      进入用户管理
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
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