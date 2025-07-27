'use client'

import React from 'react'
import { Card } from 'antd'
import DataCollectionManagement from '@/components/data-collection/DataCollectionManagement'

export default function DataCollectionPage() {
  return (
    <div style={{ padding: '24px' }}>
      <Card title="数据采集工具管理">
        <DataCollectionManagement />
      </Card>
    </div>
  )
}