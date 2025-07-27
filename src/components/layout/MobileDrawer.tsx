'use client'

import React from 'react'
import { Drawer, Menu, Typography, Divider } from 'antd'
import { 
  DashboardOutlined,
  HomeOutlined, 
  ToolOutlined, 
  SafetyOutlined, 
  DatabaseOutlined, 
  TeamOutlined,
  BarChartOutlined,
  FileTextOutlined,
  CloseOutlined
} from '@ant-design/icons'

const { Text } = Typography

interface MobileDrawerProps {
  visible: boolean
  onClose: () => void
  currentUser: any
  selectedMenu: string
  onMenuSelect: (key: string) => void
}

export default function MobileDrawer({
  visible,
  onClose,
  currentUser,
  selectedMenu,
  onMenuSelect
}: MobileDrawerProps) {
  
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
        label: '质量安全监管',
      },
    ]

    // 管理员可见的菜单项
    const adminItems = [
      {
        key: 'data-collection',
        icon: <DatabaseOutlined />,
        label: 'PC端数据采集',
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

  const handleMenuClick = ({ key }: { key: string }) => {
    onMenuSelect(key)
    onClose()
  }

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <Text strong>功能导航</Text>
          <CloseOutlined onClick={onClose} className="cursor-pointer" />
        </div>
      }
      placement="left"
      onClose={onClose}
      open={visible}
      width={280}
      closable={false}
      styles={{
        body: { padding: 0 }
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedMenu]}
        items={getMenuItems()}
        onClick={handleMenuClick}
        style={{
          border: 'none',
          fontSize: '14px',
          backgroundColor: 'rgb(249 250 251)',
          color: '#6b7280',
        }}
        theme="light"
      />
      
      <Divider />
      
      <div className="px-4 pb-4">
        <Text type="secondary" className="text-xs">
          青岛市农房建设管理平台 v1.0.0
        </Text>
      </div>
    </Drawer>
  )
}