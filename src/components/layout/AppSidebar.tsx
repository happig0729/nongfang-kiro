'use client'

import React from 'react'
import { Layout, Menu, Typography } from 'antd'
import { 
  DashboardOutlined,
  HomeOutlined, 
  ToolOutlined, 
  SafetyOutlined, 
  DatabaseOutlined, 
  TeamOutlined,
  BarChartOutlined,
  FileTextOutlined
} from '@ant-design/icons'

const { Sider } = Layout
const { Text } = Typography

interface AppSidebarProps {
  currentUser: any
  selectedMenu: string
  onMenuSelect: (key: string) => void
  collapsed?: boolean
}

export default function AppSidebar({ 
  currentUser, 
  selectedMenu, 
  onMenuSelect,
  collapsed = false 
}: AppSidebarProps) {
  
  // 根据用户角色生成菜单项
  const getMenuItems = () => {
    const baseItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
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
        label: '质量安全',
      },
    ]

    // 管理员可见的菜单项
    const adminItems = [
      {
        key: 'data-collection',
        icon: <DatabaseOutlined />,
        label: '数据采集',
      },
      {
        key: 'users',
        icon: <TeamOutlined />,
        label: '用户管理',
      },
      {
        key: 'reports',
        icon: <BarChartOutlined />,
        label: '统计报表',
      },
      {
        key: 'system',
        icon: <FileTextOutlined />,
        label: '系统管理',
      },
    ]

    // 根据用户角色决定显示哪些菜单
    if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CITY_ADMIN') {
      return [...baseItems, ...adminItems]
    } else if (currentUser?.role === 'DISTRICT_ADMIN') {
      return [...baseItems, adminItems[0], adminItems[2]] // 数据采集和统计报表
    } else {
      return baseItems
    }
  }

  return (
    <Sider 
      width={240} 
      collapsed={collapsed}
      className="shadow-sm border-r border-gray-100"
      collapsedWidth={64}
      style={{
        backgroundColor: '#ffffff'
      }}
    >
      {/* 侧边栏头部 */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-100 bg-white">
          <Text className="text-xs font-medium uppercase tracking-wider text-gray-600">
            功能导航
          </Text>
        </div>
      )}

      {/* 菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[selectedMenu]}
        items={getMenuItems()}
        className="border-r-0 pt-2 bg-white"
        onClick={({ key }) => onMenuSelect(key)}
        style={{
          fontSize: '14px',
          backgroundColor: 'white',
          color: '#000000',
        }}
        theme="light"
      />

      {/* 侧边栏底部信息 */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <div className="text-center">
            <Text className="text-xs text-gray-500">
              青岛市农房建设管理平台
            </Text>
            <br />
            <Text className="text-xs text-gray-400">
              v1.0.0
            </Text>
          </div>
        </div>
      )}
    </Sider>
  )
}