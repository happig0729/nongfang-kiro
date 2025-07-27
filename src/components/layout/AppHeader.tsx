'use client'

import React from 'react'
import { Layout, Button, Avatar, Dropdown, Typography, Badge, Tooltip } from 'antd'
import {
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined,
    QuestionCircleOutlined,
    GlobalOutlined
} from '@ant-design/icons'
import { getRoleDisplayName } from '@/lib/permissions'
import SystemStatus from './SystemStatus'

const { Header } = Layout
const { Title, Text } = Typography

interface AppHeaderProps {
    currentUser: any
    onLogout: () => void
    onUserMenuClick?: (key: string) => void
}

export default function AppHeader({ currentUser, onLogout, onUserMenuClick }: AppHeaderProps) {
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
            label: '系统设置',
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: onLogout,
        },
    ]

    const handleUserMenuClick = ({ key }: { key: string }) => {
        if (key === 'logout') {
            onLogout()
        } else if (onUserMenuClick) {
            onUserMenuClick(key)
        }
    }

    // 获取区域显示名称
    const getRegionName = (regionCode: string) => {
        const regionMap: Record<string, string> = {
            '370200': '市南区',
            '370201': '市北区',
            '370202': '李沧区',
            '370203': '崂山区',
            '370204': '城阳区',
            '370205': '即墨区',
            '370206': '胶州市',
            '370207': '平度市',
            '370208': '莱西市',
        }
        return regionMap[regionCode] || regionCode
    }

    return (
        <Header
            className="shadow-sm border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-50"
            style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                padding: '0 24px',
                height: '64px',
                lineHeight: '64px'
            }}
        >
            {/* 左侧品牌区域 */}
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                    {/* 系统Logo */}
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
                        <GlobalOutlined className="text-blue-500 text-lg" />
                    </div>

                    {/* 系统标题 */}
                    <div className="flex flex-col">
                        <Title level={4} className="mb-0 text-black font-medium">
                            青岛市农房建设管理平台
                        </Title>
                        {/* <Text className="text-gray-600 text-xs leading-none">
                            Rural Housing Construction Management Platform
                        </Text> */}
                    </div>
                </div>
            </div>

            {/* 右侧用户区域 */}
            <div className="flex items-center space-x-3">
                {/* 系统状态指示器 */}
                <SystemStatus />

                {/* 通知铃铛 */}
                <Tooltip title="通知消息">
                    <Badge count={0} size="small">
                        <Button
                            type="text"
                            icon={<BellOutlined />}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-0"
                            size="small"
                        />
                    </Badge>
                </Tooltip>

                {/* 帮助按钮 */}
                <Tooltip title="帮助文档">
                    <Button
                        type="text"
                        icon={<QuestionCircleOutlined />}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-0"
                        size="small"
                    />
                </Tooltip>

                {/* 分隔线 */}
                <div className="w-px h-4 bg-gray-200" />

                {/* 用户信息区域 */}
                <div className="flex items-center space-x-3">
                    {/* 用户区域信息 */}
                    {/* <div className="hidden md:flex flex-col items-end">
                        <Text className="text-sm font-medium text-gray-600">
                            {getRegionName(currentUser?.regionCode)}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                            {getRoleDisplayName(currentUser?.role)}
                        </Text>
                    </div> */}

                    {/* 用户下拉菜单 */}
                    <Dropdown
                        menu={{
                            items: userMenuItems,
                            onClick: handleUserMenuClick
                        }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Button
                            type="text"
                            className="flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors border-0 h-auto"
                        >
                            <Avatar
                                icon={<UserOutlined />}
                                className="bg-blue-50 text-blue-500 border-blue-200"
                                size="small"
                            />
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium text-gray-700">
                                    {currentUser?.realName}
                                </span>
                            </div>
                        </Button>
                    </Dropdown>
                </div>
            </div>
        </Header>
    )
}