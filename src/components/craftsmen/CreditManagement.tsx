'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Timeline,
  Tooltip,
  Popconfirm,
  DatePicker,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TrophyOutlined,
  StarOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import CreditEvaluationForm from './CreditEvaluationForm'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface CreditEvaluation {
  id: string
  evaluationType: string
  pointsChange: number
  reason: string
  evidenceUrls: string[]
  evaluationDate: string
  status: string
  evaluator: {
    id: string
    realName: string
    role: string
  }
}

interface CreditStatistics {
  currentYear: number
  currentScore: number
  yearlyChange: number
  yearlyEvaluations: number
  positivePoints: number
  positiveCount: number
  negativePoints: number
  negativeCount: number
}

interface CreditManagementProps {
  craftsmanId: string
  craftsmanName: string
  onClose?: () => void
}

export default function CreditManagement({ 
  craftsmanId, 
  craftsmanName, 
  onClose 
}: CreditManagementProps) {
  const [creditEvaluations, setCreditEvaluations] = useState<CreditEvaluation[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filters, setFilters] = useState({
    year: new Date().getFullYear().toString(),
    evaluationType: '',
  })
  const [statistics, setStatistics] = useState<CreditStatistics>({
    currentYear: new Date().getFullYear(),
    currentScore: 100,
    yearlyChange: 0,
    yearlyEvaluations: 0,
    positivePoints: 0,
    positiveCount: 0,
    negativePoints: 0,
    negativeCount: 0,
  })

  // 模态框状态
  const [isFormModalVisible, setIsFormModalVisible] = useState(false)

  // 获取信用评价记录列表
  const fetchCreditEvaluations = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...filters,
      })

      const response = await fetch(`/api/craftsmen/${craftsmanId}/credit?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        setCreditEvaluations(result.data.creditEvaluations)
        setPagination({
          current: result.data.pagination.page,
          pageSize: result.data.pagination.pageSize,
          total: result.data.pagination.total,
        })
        setStatistics(result.data.statistics)
      } else {
        message.error(result.message || '获取信用评价记录失败')
      }
    } catch (error) {
      console.error('Fetch credit evaluations error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理筛选
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      year: new Date().getFullYear().toString(),
      evaluationType: '',
    })
  }

  // 获取信用分等级和颜色
  const getCreditInfo = (score: number) => {
    if (score >= 90) return { level: '优秀', color: '#52c41a', bgColor: '#f6ffed' }
    if (score >= 80) return { level: '良好', color: '#1890ff', bgColor: '#f0f9ff' }
    if (score >= 70) return { level: '一般', color: '#faad14', bgColor: '#fffbe6' }
    return { level: '较差', color: '#ff4d4f', bgColor: '#fff2f0' }
  }

  // 获取评价类型标签颜色
  const getEvaluationTypeColor = (type: string) => {
    const colors = {
      '工程质量': 'blue',
      '安全施工': 'green',
      '工期管理': 'orange',
      '服务态度': 'purple',
      '技能水平': 'cyan',
      '违规行为': 'red',
      '投诉处理': 'magenta',
      '培训参与': 'geekblue',
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  // 表格列定义
  const columns = [
    {
      title: '评价类型',
      dataIndex: 'evaluationType',
      key: 'evaluationType',
      width: 120,
      render: (type: string) => (
        <Tag color={getEvaluationTypeColor(type)}>{type}</Tag>
      ),
    },
    {
      title: '分数变化',
      dataIndex: 'pointsChange',
      key: 'pointsChange',
      width: 100,
      render: (points: number) => (
        <Space>
          {points > 0 ? (
            <Tag color="success" icon={<RiseOutlined />}>
              +{points}
            </Tag>
          ) : (
            <Tag color="error" icon={<FallOutlined />}>
              {points}
            </Tag>
          )}
        </Space>
      ),
      sorter: (a: CreditEvaluation, b: CreditEvaluation) => a.pointsChange - b.pointsChange,
    },
    {
      title: '评价原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      width: 200,
    },
    {
      title: '评价日期',
      dataIndex: 'evaluationDate',
      key: 'evaluationDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a: CreditEvaluation, b: CreditEvaluation) => 
        dayjs(a.evaluationDate).unix() - dayjs(b.evaluationDate).unix(),
    },
    {
      title: '评价人',
      dataIndex: ['evaluator', 'realName'],
      key: 'evaluator',
      width: 100,
    },
    {
      title: '证据材料',
      dataIndex: 'evidenceUrls',
      key: 'evidenceUrls',
      width: 100,
      render: (urls: string[]) => (
        urls.length > 0 ? (
          <Button
            type="link"
            size="small"
            onClick={() => {
              urls.forEach(url => window.open(url, '_blank'))
            }}
          >
            查看({urls.length})
          </Button>
        ) : '-'
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>
          {status === 'ACTIVE' ? '有效' : '已撤销'}
        </Tag>
      ),
    },
  ]

  const creditInfo = getCreditInfo(statistics.currentScore)

  // 初始化数据
  useEffect(() => {
    fetchCreditEvaluations()
  }, [filters])

  return (
    <div>
      {/* 信用统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card style={{ backgroundColor: creditInfo.bgColor }}>
            <Statistic
              title="当前信用分"
              value={statistics.currentScore}
              suffix="/ 100"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: creditInfo.color }}
            />
            <div className="mt-2">
              <Tag color={creditInfo.color}>{creditInfo.level}</Tag>
            </div>
            <Progress
              percent={statistics.currentScore}
              strokeColor={creditInfo.color}
              showInfo={false}
              size="small"
              className="mt-2"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={`${statistics.currentYear}年变化`}
              value={statistics.yearlyChange}
              prefix={statistics.yearlyChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ 
                color: statistics.yearlyChange >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
            <div className="mt-2 text-gray-500 text-sm">
              共{statistics.yearlyEvaluations}次评价
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计加分"
              value={statistics.positivePoints}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div className="mt-2 text-gray-500 text-sm">
              {statistics.positiveCount}次加分记录
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计扣分"
              value={Math.abs(statistics.negativePoints)}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <div className="mt-2 text-gray-500 text-sm">
              {statistics.negativeCount}次扣分记录
            </div>
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Select
              placeholder="选择年份"
              style={{ width: '100%' }}
              value={filters.year}
              onChange={(value) => handleFilterChange('year', value)}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i
                return (
                  <Option key={year} value={year.toString()}>
                    {year}年
                  </Option>
                )
              })}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="评价类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.evaluationType || undefined}
              onChange={(value) => handleFilterChange('evaluationType', value || '')}
            >
              <Option value="工程质量">工程质量</Option>
              <Option value="安全施工">安全施工</Option>
              <Option value="工期管理">工期管理</Option>
              <Option value="服务态度">服务态度</Option>
              <Option value="技能水平">技能水平</Option>
              <Option value="违规行为">违规行为</Option>
              <Option value="投诉处理">投诉处理</Option>
              <Option value="培训参与">培训参与</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button onClick={handleResetFilters}>重置筛选</Button>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsFormModalVisible(true)}
            >
              新增评价
            </Button>
          </Col>
          <Col span={4}>
            <Tooltip title="信用分说明">
              <Button icon={<InfoCircleOutlined />}>
                评分规则
              </Button>
            </Tooltip>
          </Col>
          <Col span={4}>
            {onClose && (
              <Button onClick={onClose}>
                返回
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* 信用评价记录列表 */}
      <Card title={`${craftsmanName} - 信用评价记录`}>
        <Table
          columns={columns}
          dataSource={creditEvaluations}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              fetchCreditEvaluations(page, pageSize)
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 信用评价表单模态框 */}
      <Modal
        title="新增信用评价"
        open={isFormModalVisible}
        onCancel={() => setIsFormModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <CreditEvaluationForm
          craftsmanId={craftsmanId}
          currentScore={statistics.currentScore}
          onSuccess={() => {
            setIsFormModalVisible(false)
            fetchCreditEvaluations(pagination.current, pagination.pageSize)
          }}
          onCancel={() => setIsFormModalVisible(false)}
        />
      </Modal>
    </div>
  )
}