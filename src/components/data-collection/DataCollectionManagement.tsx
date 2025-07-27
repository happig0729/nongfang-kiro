import React, { useState } from 'react'
import { Card, Tabs, Button, Space } from 'antd'
import { DatabaseOutlined, UploadOutlined, SettingOutlined, FileTextOutlined } from '@ant-design/icons'
import VillagePortalConfig from './VillagePortalConfig'
import BatchImport from './BatchImport'

const { TabPane } = Tabs

export default function DataCollectionManagement() {
  const [activeTab, setActiveTab] = useState('villages')

  const tabItems = [
    {
      key: 'villages',
      label: (
        <span>
          <DatabaseOutlined />
          村庄填报端口
        </span>
      ),
      children: <VillagePortalConfig />,
    },
    {
      key: 'batch-import',
      label: (
        <span>
          <UploadOutlined />
          批量数据导入
        </span>
      ),
      children: <BatchImport />,
    },
    {
      key: 'templates',
      label: (
        <span>
          <FileTextOutlined />
          数据模板管理
        </span>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <div style={{ fontSize: 16, color: '#666' }}>数据模板管理功能开发中</div>
          </div>
        </Card>
      ),
    },
    {
      key: 'audit',
      label: (
        <span>
          <SettingOutlined />
          操作审计
        </span>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <SettingOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <div style={{ fontSize: 16, color: '#666' }}>操作审计功能开发中</div>
          </div>
        </Card>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>PC端数据采集工具</h2>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          为区市、镇街、村庄工作人员提供便捷的数据填报和管理功能
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  )
}