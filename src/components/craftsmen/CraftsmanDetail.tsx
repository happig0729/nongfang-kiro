'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
  Table,
  Timeline,
  Progress,
  Row,
  Col,
  Statistic,
  Avatar,
  message,
  Empty,
  Modal,
} from 'antd'
import {
  EditOutlined,
  UserOutlined,
  StarOutlined,
  TrophyOutlined,
  TeamOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  BookOutlined,
} from '@ant-design/icons'
import TrainingManagement from './TrainingManagement'
import dayjs from 'dayjs'

const { TabPane } = Tabs

interface CraftsmanDetailProps {
  craftsmanId: string
  onEdit?: (craftsman: any) => void
}

interface CraftsmanDetail {
  id: string
  name: string
  idNumber: string
  phone: string
  specialties: string[]
  skillLevel: string
  creditScore: number
  certificationLevel?: string
  status: string
  regionName: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  joinDate: string
  team?: {
    id: string
    name: string
    teamType: string
    description?: string
  }
  trainingRecords: any[]
  creditEvaluations: any[]
  constructionProjects: any[]
  _count: {
    trainingRecords: number
    creditEvaluations: number
    constructionProjects: number
  }
}

export default function CraftsmanDetail({ craftsmanId, onEdit }: CraftsmanDetailProps) {
  const [craftsman, setCraftsman] = useState<CraftsmanDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [isTrainingModalVisible, setIsTrainingModalVisible] = useState(false)

  // 获取工匠详情
  const fetchCraftsmanDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/craftsmen/${craftsmanId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        setCraftsman(result.data)
      } else {
        message.error(result.message || '获取工匠详情失败')
      }
    } catch (error) {
      console.error('Fetch craftsman detail error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 获取技能等级显示名称和颜色
  const getSkillLevelInfo = (level: string) => {
    const info = {
      BEGINNER: { name: '初级', color: 'default', percent: 25 },
      INTERMEDIATE: { name: '中级', color: 'blue', percent: 50 },
      ADVANCED: { name: '高级', color: 'green', percent: 75 },
      EXPERT: { name: '专家级', color: 'gold', percent: 100 },
    }
    return info[level as keyof typeof info] || { name: level, color: 'default', percent: 0 }
  }

  // 获取状态显示名称和颜色
  const getStatusInfo = (status: string) => {
    const info = {
      ACTIVE: { name: '活跃', color: 'success' },
      INACTIVE: { name: '不活跃', color: 'default' },
      SUSPENDED: { name: '暂停', color: 'warning' },
      RETIRED: { name: '退休', color: 'error' },
    }
    return info[status as keyof typeof info] || { name: status, color: 'default' }
  }

  // 获取团队类型显示名称
  const getTeamTypeName = (type: string) => {
    const names = {
      CONSTRUCTION_TEAM: '施工班组',
      COOPERATIVE: '合作社',
      PARTNERSHIP: '合伙制企业',
    }
    return names[type as keyof typeof names] || type
  }

  // 获取信用分等级和颜色
  const getCreditInfo = (score: number) => {
    if (score >= 90) return { level: '优秀', color: '#52c41a' }
    if (score >= 80) return { level: '良好', color: '#1890ff' }
    if (score >= 70) return { level: '一般', color: '#faad14' }
    return { level: '较差', color: '#ff4d4f' }
  }

  // 培训记录表格列
  const trainingColumns = [
    {
      title: '培训类型',
      dataIndex: 'trainingType',
      key: 'trainingType',
    },
    {
      title: '培训内容',
      dataIndex: 'trainingContent',
      key: 'trainingContent',
      ellipsis: true,
    },
    {
      title: '学时',
      dataIndex: 'durationHours',
      key: 'durationHours',
      width: 80,
      render: (hours: number) => `${hours}h`,
    },
    {
      title: '培训日期',
      dataIndex: 'trainingDate',
      key: 'trainingDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'completionStatus',
      key: 'completionStatus',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          IN_PROGRESS: { text: '进行中', color: 'processing' },
          COMPLETED: { text: '已完成', color: 'success' },
          FAILED: { text: '未通过', color: 'error' },
          CANCELLED: { text: '已取消', color: 'default' },
        }
        const info = statusMap[status as keyof typeof statusMap] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '成绩',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score: number) => score ? `${score}分` : '-',
    },
  ]

  // 项目记录表格列
  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: '农房地址',
      dataIndex: ['house', 'address'],
      key: 'houseAddress',
      ellipsis: true,
    },
    {
      title: '项目类型',
      dataIndex: 'projectType',
      key: 'projectType',
      width: 100,
      render: (type: string) => {
        const typeMap = {
          NEW_CONSTRUCTION: '新建工程',
          RENOVATION: '改造工程',
          REPAIR: '维修工程',
          EXPANSION: '扩建工程',
        }
        return typeMap[type as keyof typeof typeMap] || type
      },
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'projectStatus',
      key: 'projectStatus',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          PLANNED: { text: '计划中', color: 'default' },
          IN_PROGRESS: { text: '进行中', color: 'processing' },
          COMPLETED: { text: '已完成', color: 'success' },
          SUSPENDED: { text: '暂停', color: 'warning' },
          CANCELLED: { text: '已取消', color: 'error' },
        }
        const info = statusMap[status as keyof typeof statusMap] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
  ]

  // 初始化数据
  useEffect(() => {
    fetchCraftsmanDetail()
  }, [craftsmanId])

  if (!craftsman) {
    return <Card loading={loading} />
  }

  const skillInfo = getSkillLevelInfo(craftsman.skillLevel)
  const statusInfo = getStatusInfo(craftsman.status)
  const creditInfo = getCreditInfo(craftsman.creditScore)

  return (
    <div>
      {/* 基本信息卡片 */}
      <Card
        title={
          <Space>
            <Avatar size={64} icon={<UserOutlined />} />
            <div>
              <h3 style={{ margin: 0 }}>{craftsman.name}</h3>
              <Space>
                <Tag color={statusInfo.color}>{statusInfo.name}</Tag>
                <Tag color={skillInfo.color}>{skillInfo.name}</Tag>
                {craftsman.team && (
                  <Tag icon={<TeamOutlined />}>{craftsman.team.name}</Tag>
                )}
              </Space>
            </div>
          </Space>
        }
        extra={
          onEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => onEdit(craftsman)}
            >
              编辑
            </Button>
          )
        }
        className="mb-4"
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="信用分"
              value={craftsman.creditScore}
              suffix={`/ 100 (${creditInfo.level})`}
              valueStyle={{ color: creditInfo.color }}
            />
            <Progress
              percent={craftsman.creditScore}
              strokeColor={creditInfo.color}
              showInfo={false}
              size="small"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="技能等级"
              value={skillInfo.name}
              prefix={<StarOutlined />}
            />
            <Progress
              percent={skillInfo.percent}
              strokeColor={skillInfo.color}
              showInfo={false}
              size="small"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="培训次数"
              value={craftsman._count.trainingRecords}
              prefix={<TrophyOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="项目数量"
              value={craftsman._count.constructionProjects}
              prefix={<TrophyOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* 详细信息 */}
      <Card>
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="姓名">{craftsman.name}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{craftsman.idNumber}</Descriptions.Item>
              <Descriptions.Item label="手机号">
                <Space>
                  <PhoneOutlined />
                  {craftsman.phone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="入职日期">
                <Space>
                  <CalendarOutlined />
                  {dayjs(craftsman.joinDate).format('YYYY-MM-DD')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="专业技能" span={2}>
                <Space wrap>
                  {craftsman.specialties.map((specialty, index) => (
                    <Tag key={index} color="blue">{specialty}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="技能等级">
                <Tag color={skillInfo.color}>{skillInfo.name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="认证等级">
                {craftsman.certificationLevel ? (
                  <Tag color="gold">{craftsman.certificationLevel.replace('LEVEL_', '')}级</Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="所属区域">
                <Space>
                  <EnvironmentOutlined />
                  {craftsman.regionName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusInfo.color}>{statusInfo.name}</Tag>
              </Descriptions.Item>
              {craftsman.address && (
                <Descriptions.Item label="联系地址" span={2}>
                  <Space>
                    <EnvironmentOutlined />
                    {craftsman.address}
                  </Space>
                </Descriptions.Item>
              )}
              {craftsman.emergencyContact && (
                <Descriptions.Item label="紧急联系人">
                  {craftsman.emergencyContact}
                </Descriptions.Item>
              )}
              {craftsman.emergencyPhone && (
                <Descriptions.Item label="紧急联系电话">
                  <Space>
                    <PhoneOutlined />
                    {craftsman.emergencyPhone}
                  </Space>
                </Descriptions.Item>
              )}
              {craftsman.team && (
                <Descriptions.Item label="所属团队" span={2}>
                  <Space>
                    <TeamOutlined />
                    {craftsman.team.name}
                    <Tag>{getTeamTypeName(craftsman.team.teamType)}</Tag>
                  </Space>
                  {craftsman.team.description && (
                    <div style={{ marginTop: 8, color: '#666' }}>
                      {craftsman.team.description}
                    </div>
                  )}
                </Descriptions.Item>
              )}
            </Descriptions>
          </TabPane>

          <TabPane 
            tab={
              <Space>
                培训记录 ({craftsman._count.trainingRecords})
                <Button
                  type="primary"
                  size="small"
                  icon={<BookOutlined />}
                  onClick={() => setIsTrainingModalVisible(true)}
                >
                  培训管理
                </Button>
              </Space>
            } 
            key="training"
          >
            {craftsman.trainingRecords.length > 0 ? (
              <Table
                columns={trainingColumns}
                dataSource={craftsman.trainingRecords}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无培训记录" />
            )}
          </TabPane>

          <TabPane tab={`项目记录 (${craftsman._count.constructionProjects})`} key="projects">
            {craftsman.constructionProjects.length > 0 ? (
              <Table
                columns={projectColumns}
                dataSource={craftsman.constructionProjects}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无项目记录" />
            )}
          </TabPane>

          <TabPane tab={`信用记录 (${craftsman._count.creditEvaluations})`} key="credit">
            {craftsman.creditEvaluations.length > 0 ? (
              <Timeline>
                {craftsman.creditEvaluations.map((evaluation) => (
                  <Timeline.Item
                    key={evaluation.id}
                    color={evaluation.pointsChange > 0 ? 'green' : 'red'}
                  >
                    <div>
                      <Space>
                        <strong>
                          {evaluation.pointsChange > 0 ? '+' : ''}{evaluation.pointsChange} 分
                        </strong>
                        <Tag>{evaluation.evaluationType}</Tag>
                        <span style={{ color: '#666' }}>
                          {dayjs(evaluation.evaluationDate).format('YYYY-MM-DD')}
                        </span>
                      </Space>
                      <div style={{ marginTop: 4 }}>
                        {evaluation.reason}
                      </div>
                      {evaluation.evaluator && (
                        <div style={{ marginTop: 4, color: '#666', fontSize: '12px' }}>
                          评价人：{evaluation.evaluator.realName}
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无信用记录" />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 培训管理模态框 */}
      <Modal
        title="培训管理"
        open={isTrainingModalVisible}
        onCancel={() => setIsTrainingModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <TrainingManagement
          craftsmanId={craftsmanId}
          craftsmanName={craftsman.name}
          onClose={() => {
            setIsTrainingModalVisible(false)
            fetchCraftsmanDetail() // 刷新工匠详情数据
          }}
        />
      </Modal>
    </div>
  )
}