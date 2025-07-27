'use client'

import React from 'react'
import { Breadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

interface BreadcrumbItem {
  title: string
  href?: string
  icon?: React.ReactNode
}

interface AppBreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function AppBreadcrumb({ items }: AppBreadcrumbProps) {
  // 构建面包屑项目
  const breadcrumbItems = [
    {
      title: (
        <span className="flex items-center">
          <HomeOutlined className="mr-1" />
          首页
        </span>
      ),
      href: '/',
    },
    ...items.map(item => ({
      title: (
        <span className="flex items-center">
          {item.icon && <span className="mr-1">{item.icon}</span>}
          {item.title}
        </span>
      ),
      href: item.href,
    }))
  ]

  return (
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
      <Breadcrumb 
        items={breadcrumbItems}
        style={{
          fontSize: '13px',
          color: '#9ca3af'
        }}
      />
    </div>
  )
}