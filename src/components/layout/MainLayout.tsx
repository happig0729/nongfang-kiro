'use client'

import React, { useState, useEffect } from 'react'
import { Layout, Button } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import AppBreadcrumb from './AppBreadcrumb'
import MobileDrawer from './MobileDrawer'

const { Content } = Layout

interface MainLayoutProps {
    currentUser: any
    selectedMenu: string
    onMenuSelect: (key: string) => void
    onLogout: () => void
    children: React.ReactNode
    breadcrumbItems?: Array<{
        title: string
        href?: string
        icon?: React.ReactNode
    }>
}

export default function MainLayout({
    currentUser,
    selectedMenu,
    onMenuSelect,
    onLogout,
    children,
    breadcrumbItems = []
}: MainLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // 检测屏幕尺寸
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkScreenSize()
        window.addEventListener('resize', checkScreenSize)

        return () => window.removeEventListener('resize', checkScreenSize)
    }, [])

    const handleUserMenuClick = (key: string) => {
        switch (key) {
            case 'profile':
                // 处理个人信息点击
                console.log('Open profile')
                break
            case 'settings':
                // 处理设置点击
                console.log('Open settings')
                break
            default:
                break
        }
    }

    const handleMobileMenuToggle = () => {
        setMobileDrawerVisible(!mobileDrawerVisible)
    }

    return (
        <Layout className="min-h-screen">
            {/* 顶部导航栏 */}
            <AppHeader
                currentUser={currentUser}
                onLogout={onLogout}
                onUserMenuClick={handleUserMenuClick}
            />

            <Layout>
                {/* 桌面端侧边栏 */}
                {!isMobile && (
                    <AppSidebar
                        currentUser={currentUser}
                        selectedMenu={selectedMenu}
                        onMenuSelect={onMenuSelect}
                        collapsed={sidebarCollapsed}
                    />
                )}

                {/* 移动端抽屉菜单 */}
                {isMobile && (
                    <MobileDrawer
                        visible={mobileDrawerVisible}
                        onClose={() => setMobileDrawerVisible(false)}
                        currentUser={currentUser}
                        selectedMenu={selectedMenu}
                        onMenuSelect={onMenuSelect}
                    />
                )}

                {/* 主内容区域 */}
                <Layout className="bg-gray-50">
                    {/* 移动端菜单按钮和面包屑导航 */}
                    <div className="bg-white border-b border-gray-100">
                        {isMobile && (
                            <div className="px-4 py-2 border-b border-gray-100">
                                <Button
                                    type="text"
                                    icon={<MenuOutlined />}
                                    onClick={handleMobileMenuToggle}
                                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                >
                                    菜单
                                </Button>
                            </div>
                        )}

                        {/* 面包屑导航 */}
                        {breadcrumbItems.length > 0 && (
                            <div className={isMobile ? 'px-4 py-2' : ''}>
                                <AppBreadcrumb items={breadcrumbItems} />
                            </div>
                        )}
                    </div>

                    {/* 内容区域 */}
                    <Content className={`min-h-screen ${isMobile ? 'p-4' : 'p-6'}`}>
                        <div className="bg-white rounded-lg shadow-sm min-h-full border border-gray-100">
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    )
}