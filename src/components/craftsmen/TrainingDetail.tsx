'use client'

import { useState } from 'react'
import {
  Descriptions,
  Tag,
  Button,
  Space,
  Card,
  Progress,
  Divider,
} from 'antd'
import {
  EditOutlined,
  DownloadOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

interface TrainingDetailProps {
  trainingRecord: any
  onEdit?: (record: any) => void
}

export default function TrainingDetail({ trainingRecord, onEdit }: TrainingDetailProps) {
  // 获取完成状态标签颜色
  const getStatusColor = (status: string) => {
    const colors = {
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      FAILED: 'error',
      CANCELLED: 'default',
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  // 获取完成状态显示名称
  const getStatusName = (status: string) => {
    const names = {
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      FAILED: '未通过',
      CANCELLED: '已取消',
    }
    return names[status as keyof typeof names] || status
  }

  // 获取成绩等级和颜色
  const getScoreInfo = (score?: number) => {
    if (!score) return { level: '未评分', color: '#d9d9d9' }
    if (score >= 90) return { level: '优秀', color: '#52c41a' }
    if (score >= 80) return { level: '良好', color: '#1890ff' }
    if (score >= 70) return { level: '合格', color: '#faad14' }
    return { level: '不合格', color: '#ff4d4f' }
  }

  const scoreInfo = getScoreInfo(trainingRecord.score)

  return (
    <div>
      {/* 基本信息卡片 */}
      <Card
        title={
          <Space>
            <BookOutlined />
            <span>{trainingRecord.trainingType}</span>
            <Tag color={getStatusColor(trainingRecord.completionStatus)}>
              {getStatusName(trainingRecord.completionStatus)}
            </Tag>
          </Space>
        }
        extra={
          onEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => onEdit(trainingRecord)}
            >
              编辑
            </Button>
          )
        }
        className="mb-4"
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-medium">培训学时</span>
            <span className="text-2xl font-bold text-blue-600">
              {trainingRecord.durationHours} 小时
            </span>
          </div>
          <Progress
            percent={Math.min((trainingRecord.durationHours / 8) * 100, 100)}
            strokeColor="#1890ff"
            showInfo={false}
            size="small"
          />
        </div>

        {trainingRecord.score && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">培训成绩</span>
              <Space>
                <span className="text-2xl font-bold" style={{ color: scoreInfo.color }}>
                  {trainingRecord.score} 分
                </span>
                <Tag color={scoreInfo.color}>{scoreInfo.level}</Tag>
              </Space>
            </div>
            <Progress
              percent={trainingRecord.score}
              strokeColor={scoreInfo.color}
              showInfo={false}
              size="small"
            />
          </div>
        )}
      </Card>

      {/* 详细信息 */}
      <Card title="详细信息">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="培训类型" span={2}>
            <Tag color="blue">{trainingRecord.trainingType}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="培训内容" span={2}>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {trainingRecord.trainingContent}
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="培训学时">
            <Space>
              <ClockCircleOutlined />
              {trainingRecord.durationHours} 小时
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="培训日期">
            <Space>
              <CalendarOutlined />
              {dayjs(trainingRecord.trainingDate).format('YYYY年MM月DD日')}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="讲师姓名">
            <Space>
              <UserOutlined />
              {trainingRecord.instructor}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="培训地点">
            <Space>
              <EnvironmentOutlined />
              {trainingRecord.trainingLocation || '未填写'}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="完成状态">
            <Tag color={getStatusColor(trainingRecord.completionStatus)}>
              {getStatusName(trainingRecord.completionStatus)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="培训成绩">
            {trainingRecord.score ? (
              <Space>
                <span style={{ color: scoreInfo.color, fontWeight: 'bold' }}>
                  {trainingRecord.score} 分
                </span>
                <Tag color={scoreInfo.color}>{scoreInfo.level}</Tag>
              </Space>
            ) : (
              <span style={{ color: '#999' }}>未评分</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="培训证书" span={2}>
            {trainingRecord.certificateUrl ? (
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={() => window.open(trainingRecord.certificateUrl, '_blank')}
              >
                下载证书
              </Button>
            ) : (
              <span style={{ color: '#999' }}>暂无证书</span>
            )}
          </Descriptions.Item>

          {trainingRecord.remarks && (
            <Descriptions.Item label="备注" span={2}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {trainingRecord.remarks}
              </div>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 培训效果评估 */}
      {trainingRecord.completionStatus === 'COMPLETED' && (
        <Card title="培训效果评估" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {trainingRecord.durationHours}h
              </div>
              <div className="text-gray-600">学时完成</div>
            </div>
            
            {trainingRecord.score && (
              <div className="text-center">
                <div className="text-2xl font-bold mb-2" style={{ color: scoreInfo.color }}>
                  {scoreInfo.level}
                </div>
                <div className="text-gray-600">成绩等级</div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                ✓
              </div>
              <div className="text-gray-600">培训完成</div>
            </div>
          </div>

          {trainingRecord.trainingType.includes('线下') && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <TrophyOutlined className="text-orange-600 mr-2" />
                <span className="text-orange-600 font-medium">
                  线下培训 - 计入年度线下学时要求
                </span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}