'use client'

import React, { useState } from 'react'
import { Card, Tabs, Typography } from 'antd'
import { 
  AuditOutlined, 
  SafetyOutlined, 
  CheckCircleOutlined,
  FileSearchOutlined 
} from '@ant-design/icons'
import SixOnSiteOverview from './SixOnSiteOverview'

const { Title } = Typography

interface QualitySupervisionManagementProps {
  currentUser?: any
}

const QualitySupervisionManagement: React.FC<QualitySupervisionManagementProps> = ({
  currentUser
}) => {
  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>质量安全监管</Title>
        <p style={{ color: '#666', marginBottom: 0 }}>
          农房建设质量安全监督管理系统，包含六到场管理、质量检查、满意度调查等功能
        </p>
      </div>

      {/* 功能标签页 */}
      <Card>
        <Tabs 
          defaultActiveKey="six-on-site"
          size="large"
          items={[
            {
              key: 'six-on-site',
              label: (
                <span>
                  <AuditOutlined />
                  六到场管理
                </span>
              ),
              children: (
                <SixOnSiteOverview currentUser={currentUser} />
              )
            },
            {
              key: 'quality-inspection',
              label: (
                <span>
                  <SafetyOutlined />
                  质量安全检查
                </span>
              ),
              children: (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={3}>质量安全检查系统</Title>
                  <p style={{ color: '#666' }}>
                    此功能正在开发中，将支持区市、镇街日常质量安全检查信息录入和管理
                  </p>
                </div>
              )
            },
            {
              key: 'satisfaction-survey',
              label: (
                <span>
                  <FileSearchOutlined />
                  满意度调查
                </span>
              ),
              children: (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <FileSearchOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                  <Title level={3}>满意度调查系统</Title>
                  <p style={{ color: '#666' }}>
                    此功能正在开发中，将支持群众满意度反馈收集和村民问卷调查
                  </p>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default QualitySupervisionManagement