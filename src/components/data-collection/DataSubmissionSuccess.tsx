'use client'

import React from 'react'
import { Result, Button, Card, Descriptions, Space } from 'antd'
import { CheckCircleOutlined, HomeOutlined, FileTextOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

interface DataSubmissionSuccessProps {
  submissionData?: {
    entryId: string
    houseId: string
    address: string
    applicantName: string
    craftsmanName?: string
    submittedAt: string
  }
}

export default function DataSubmissionSuccess({ submissionData }: DataSubmissionSuccessProps) {
  const router = useRouter()

  const handleBackToHome = () => {
    router.push('/')
  }

  const handleViewHouse = () => {
    if (submissionData?.houseId) {
      router.push(`/houses/${submissionData.houseId}`)
    }
  }

  const handleNewSubmission = () => {
    router.push('/data-collection')
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: 800, margin: '0 auto' }}>
      <Result
        status="success"
        title="数据提交成功！"
        subTitle="您的数据已成功提交到系统，相关工作人员将进行审核处理。"
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
      />

      {submissionData && (
        <Card title="提交信息" style={{ marginBottom: 24 }}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="提交编号">
              {submissionData.entryId}
            </Descriptions.Item>
            <Descriptions.Item label="农房地址">
              {submissionData.address}
            </Descriptions.Item>
            <Descriptions.Item label="申请人姓名">
              {submissionData.applicantName}
            </Descriptions.Item>
            {submissionData.craftsmanName && (
              <Descriptions.Item label="工匠姓名">
                {submissionData.craftsmanName}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="提交时间">
              {new Date(submissionData.submittedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="后续流程" style={{ marginBottom: 24 }}>
        <div style={{ lineHeight: '1.8' }}>
          <p><strong>1. 数据审核</strong></p>
          <p style={{ marginLeft: 20, color: '#666' }}>
            相关工作人员将在1-3个工作日内对您提交的数据进行审核，确保信息准确完整。
          </p>
          
          <p><strong>2. 信息录入</strong></p>
          <p style={{ marginLeft: 20, color: '#666' }}>
            审核通过后，数据将正式录入青岛市农房建设管理系统。
          </p>
          
          <p><strong>3. 后续跟踪</strong></p>
          <p style={{ marginLeft: 20, color: '#666' }}>
            如有建设项目，系统将持续跟踪建设进度和质量监管情况。
          </p>
        </div>
      </Card>

      <Card title="注意事项" style={{ marginBottom: 24 }}>
        <div style={{ lineHeight: '1.8' }}>
          <p>• 请保存好提交编号，以便后续查询和跟踪</p>
          <p>• 如需修改已提交的信息，请联系相关工作人员</p>
          <p>• 如有疑问，请拨打服务热线：0532-12345</p>
          <p>• 系统将通过短信或电话通知审核结果</p>
        </div>
      </Card>

      <div style={{ textAlign: 'center' }}>
        <Space size="large">
          <Button 
            type="primary" 
            icon={<HomeOutlined />}
            onClick={handleBackToHome}
            size="large"
          >
            返回首页
          </Button>
          
          {submissionData?.houseId && (
            <Button 
              icon={<FileTextOutlined />}
              onClick={handleViewHouse}
              size="large"
            >
              查看农房信息
            </Button>
          )}
          
          <Button 
            onClick={handleNewSubmission}
            size="large"
          >
            继续填报数据
          </Button>
        </Space>
      </div>
    </div>
  )
}