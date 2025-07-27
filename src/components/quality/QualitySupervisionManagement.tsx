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
import QualityInspectionManagement from './QualityInspectionManagement'
import SatisfactionSurveyManagement from './SatisfactionSurveyManagement'

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
                <QualityInspectionManagement currentUser={currentUser} />
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
                <SatisfactionSurveyManagement currentUser={currentUser} />
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default QualitySupervisionManagement