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
  DownloadOutlined,
  BookOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import TrainingForm from './TrainingForm'
import TrainingDetail from './TrainingDetail'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface TrainingRecord {
  id: string
  trainingType: string
  trainingContent: string
  durationHours: number
  trainingDate: string
  completionStatus: string
  certificateUrl?: string
  instructor: string
  trainingLocation?: string
  score?: number
  remarks?: string
}

interface TrainingStatistics {
  currentYear: number
  totalHours: number
  offlineHours: number
  requiredTotalHours: number
  requiredOfflineHours: number
  totalProgress: number
  offlineProgress: number
}

interface TrainingManagementProps {
  craftsmanId: string
  craftsmanName: string
  onClose?: () => void
}

export default function TrainingManagement({ 
  craftsmanId, 
  craftsmanName, 
  onClose 
}: TrainingManagementProps) {
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filters, setFilters] = useState({
    year: new Date().getFullYear().toString(),
    trainingType: '',
    completionStatus: '',
  })
  const [statistics, setStatistics] = useState<TrainingStatistics>({
    currentYear: new Date().getFullYear(),
    totalHours: 0,
    offlineHours: 0,
    requiredTotalHours: 40,
    requiredOfflineHours: 24,
    totalProgress: 0,
    offlineProgress: 0,
  })

  // 模态框状态
  const [isFormModalVisible, setIsFormModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null)

  // 获取培训记录列表
  const fetchTrainingRecords = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...filters,
      })

      console.log('Fetching training records for craftsman:', craftsmanId)
      console.log('Current user:', JSON.parse(localStorage.getItem('user_info') || '{}'))

      const response = await fetch(`/api/craftsmen/${craftsmanId}/training?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        setTrainingRecords(result.data.trainingRecords)
        setPagination({
          current: result.data.pagination.page,
          pageSize: result.data.pagination.pageSize,
          total: result.data.pagination.total,
        })
        setStatistics(result.data.statistics)
      } else {
        message.error(result.message || '获取培训记录失败')
      }
    } catch (error) {
      console.error('Fetch training records error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除培训记录
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/training/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        message.success('培训记录删除成功')
        fetchTrainingRecords(pagination.current, pagination.pageSize)
      } else {
        message.error(result.message || '删除培训记录失败')
      }
    } catch (error) {
      console.error('Delete training record error:', error)
      message.error('网络错误，请稍后重试')
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
      trainingType: '',
      completionStatus: '',
    })
  }

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

  // 表格列定义
  const columns = [
    {
      title: '培训类型',
      dataIndex: 'trainingType',
      key: 'trainingType',
      width: 120,
    },
    {
      title: '培训内容',
      dataIndex: 'trainingContent',
      key: 'trainingContent',
      ellipsis: true,
      width: 200,
    },
    {
      title: '学时',
      dataIndex: 'durationHours',
      key: 'durationHours',
      width: 80,
      render: (hours: number) => (
        <Tag color="blue">{hours}h</Tag>
      ),
    },
    {
      title: '培训日期',
      dataIndex: 'trainingDate',
      key: 'trainingDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '讲师',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'completionStatus',
      key: 'completionStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusName(status)}
        </Tag>
      ),
    },
    {
      title: '成绩',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score: number) => score ? `${score}分` : '-',
    },
    {
      title: '证书',
      dataIndex: 'certificateUrl',
      key: 'certificateUrl',
      width: 80,
      render: (url: string) => url ? (
        <Button
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => window.open(url, '_blank')}
        >
          下载
        </Button>
      ) : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: TrainingRecord) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRecord(record)
                setIsDetailModalVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRecord(record)
                setIsFormModalVisible(true)
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这条培训记录吗？"
            description="删除后无法恢复，请谨慎操作。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 初始化数据
  useEffect(() => {
    fetchTrainingRecords()
  }, [filters])

  return (
    <div>
      {/* 培训统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title={`${statistics.currentYear}年总学时`}
              value={statistics.totalHours}
              suffix={`/ ${statistics.requiredTotalHours}h`}
              prefix={<BookOutlined />}
            />
            <Progress
              percent={statistics.totalProgress}
              strokeColor={statistics.totalProgress >= 100 ? '#52c41a' : '#1890ff'}
              showInfo={false}
              size="small"
              className="mt-2"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="线下培训学时"
              value={statistics.offlineHours}
              suffix={`/ ${statistics.requiredOfflineHours}h`}
              prefix={<ClockCircleOutlined />}
            />
            <Progress
              percent={statistics.offlineProgress}
              strokeColor={statistics.offlineProgress >= 100 ? '#52c41a' : '#faad14'}
              showInfo={false}
              size="small"
              className="mt-2"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="培训记录总数"
              value={pagination.total}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={pagination.total > 0 ? Math.round((trainingRecords.filter(r => r.completionStatus === 'COMPLETED').length / pagination.total) * 100) : 0}
              suffix="%"
              prefix={<TrophyOutlined />}
            />
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
              placeholder="培训类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.trainingType || undefined}
              onChange={(value) => handleFilterChange('trainingType', value || '')}
            >
              <Option value="理论培训">理论培训</Option>
              <Option value="实操培训">实操培训</Option>
              <Option value="安全培训">安全培训</Option>
              <Option value="技术培训">技术培训</Option>
              <Option value="线下培训">线下培训</Option>
              <Option value="线上培训">线上培训</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="完成状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.completionStatus || undefined}
              onChange={(value) => handleFilterChange('completionStatus', value || '')}
            >
              <Option value="IN_PROGRESS">进行中</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="FAILED">未通过</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button onClick={handleResetFilters}>重置筛选</Button>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRecord(null)
                setIsFormModalVisible(true)
              }}
            >
              新增培训记录
            </Button>
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

      {/* 培训记录列表 */}
      <Card title={`${craftsmanName} - 培训记录管理`}>
        <Table
          columns={columns}
          dataSource={trainingRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              fetchTrainingRecords(page, pageSize)
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 培训记录表单模态框 */}
      <Modal
        title={editingRecord ? '编辑培训记录' : '新增培训记录'}
        open={isFormModalVisible}
        onCancel={() => {
          setIsFormModalVisible(false)
          setEditingRecord(null)
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <TrainingForm
          craftsmanId={craftsmanId}
          trainingRecord={editingRecord}
          onSuccess={() => {
            setIsFormModalVisible(false)
            setEditingRecord(null)
            fetchTrainingRecords(pagination.current, pagination.pageSize)
          }}
          onCancel={() => {
            setIsFormModalVisible(false)
            setEditingRecord(null)
          }}
        />
      </Modal>

      {/* 培训记录详情模态框 */}
      <Modal
        title="培训记录详情"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false)
          setSelectedRecord(null)
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedRecord && (
          <TrainingDetail
            trainingRecord={selectedRecord}
            onEdit={(record) => {
              setIsDetailModalVisible(false)
              setEditingRecord(record)
              setIsFormModalVisible(true)
            }}
          />
        )}
      </Modal>
    </div>
  )
}