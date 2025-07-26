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
  Tooltip,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  StarOutlined,
  TrophyOutlined,
  BookOutlined,
  CreditCardOutlined,
} from '@ant-design/icons'
import CraftsmanForm from './CraftsmanForm'
import CraftsmanDetail from './CraftsmanDetail'
import TrainingManagement from './TrainingManagement'
import CreditManagement from './CreditManagement'

const { Search } = Input
const { Option } = Select

interface Craftsman {
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
  joinDate: string
  team?: {
    id: string
    name: string
    teamType: string
  }
  _count: {
    trainingRecords: number
    constructionProjects: number
  }
}

interface CraftsmanManagementProps {
  currentUser?: any
}

export default function CraftsmanManagement({ currentUser }: CraftsmanManagementProps) {
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filters, setFilters] = useState({
    search: '',
    skillLevel: '',
    status: '',
    regionCode: '',
  })
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    expert: 0,
    highCredit: 0,
  })

  // 模态框状态
  const [isFormModalVisible, setIsFormModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isTrainingModalVisible, setIsTrainingModalVisible] = useState(false)
  const [isCreditModalVisible, setIsCreditModalVisible] = useState(false)
  const [editingCraftsman, setEditingCraftsman] = useState<Craftsman | null>(null)
  const [selectedCraftsman, setSelectedCraftsman] = useState<Craftsman | null>(null)
  const [trainingCraftsman, setTrainingCraftsman] = useState<Craftsman | null>(null)
  const [creditCraftsman, setCreditCraftsman] = useState<Craftsman | null>(null)

  // 获取工匠列表
  const fetchCraftsmen = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...filters,
      })

      const response = await fetch(`/api/craftsmen?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        setCraftsmen(result.data.craftsmen)
        setPagination({
          current: result.data.pagination.page,
          pageSize: result.data.pagination.pageSize,
          total: result.data.pagination.total,
        })

        // 计算统计数据
        const stats = result.data.craftsmen.reduce(
          (acc: any, craftsman: Craftsman) => {
            acc.total++
            if (craftsman.status === 'ACTIVE') acc.active++
            if (craftsman.skillLevel === 'EXPERT') acc.expert++
            if (craftsman.creditScore >= 90) acc.highCredit++
            return acc
          },
          { total: 0, active: 0, expert: 0, highCredit: 0 }
        )
        setStatistics(stats)
      } else {
        message.error(result.message || '获取工匠列表失败')
      }
    } catch (error) {
      console.error('Fetch craftsmen error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除工匠
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/craftsmen/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        message.success('工匠删除成功')
        fetchCraftsmen(pagination.current, pagination.pageSize)
      } else {
        message.error(result.message || '删除工匠失败')
      }
    } catch (error) {
      console.error('Delete craftsman error:', error)
      message.error('网络错误，请稍后重试')
    }
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value })
  }

  // 处理筛选
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      search: '',
      skillLevel: '',
      status: '',
      regionCode: '',
    })
  }

  // 获取技能等级标签颜色
  const getSkillLevelColor = (level: string) => {
    const colors = {
      BEGINNER: 'default',
      INTERMEDIATE: 'blue',
      ADVANCED: 'green',
      EXPERT: 'gold',
    }
    return colors[level as keyof typeof colors] || 'default'
  }

  // 获取技能等级显示名称
  const getSkillLevelName = (level: string) => {
    const names = {
      BEGINNER: '初级',
      INTERMEDIATE: '中级',
      ADVANCED: '高级',
      EXPERT: '专家级',
    }
    return names[level as keyof typeof names] || level
  }

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'success',
      INACTIVE: 'default',
      SUSPENDED: 'warning',
      RETIRED: 'error',
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  // 获取状态显示名称
  const getStatusName = (status: string) => {
    const names = {
      ACTIVE: '活跃',
      INACTIVE: '不活跃',
      SUSPENDED: '暂停',
      RETIRED: '退休',
    }
    return names[status as keyof typeof names] || status
  }

  // 表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (text: string, record: Craftsman) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedCraftsman(record)
            setIsDetailModalVisible(true)
          }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '专业技能',
      dataIndex: 'specialties',
      key: 'specialties',
      width: 150,
      render: (specialties: string[]) => (
        <div>
          {specialties.slice(0, 2).map((specialty, index) => (
            <Tag key={index} size="small" style={{ marginBottom: 2 }}>
              {specialty}
            </Tag>
          ))}
          {specialties.length > 2 && (
            <Tooltip title={specialties.slice(2).join(', ')}>
              <Tag size="small">+{specialties.length - 2}</Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: '技能等级',
      dataIndex: 'skillLevel',
      key: 'skillLevel',
      width: 100,
      render: (level: string) => (
        <Tag color={getSkillLevelColor(level)}>
          {getSkillLevelName(level)}
        </Tag>
      ),
    },
    {
      title: '信用分',
      dataIndex: 'creditScore',
      key: 'creditScore',
      width: 80,
      render: (score: number) => (
        <span style={{ color: score >= 90 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f' }}>
          {score}
        </span>
      ),
      sorter: (a: Craftsman, b: Craftsman) => a.creditScore - b.creditScore,
    },
    {
      title: '所属团队',
      dataIndex: 'team',
      key: 'team',
      width: 120,
      render: (team: any) => team ? (
        <Tooltip title={`类型：${team.teamType === 'CONSTRUCTION_TEAM' ? '施工班组' : team.teamType === 'COOPERATIVE' ? '合作社' : '合伙制企业'}`}>
          <Tag icon={<TeamOutlined />}>{team.name}</Tag>
        </Tooltip>
      ) : '-',
    },
    {
      title: '培训次数',
      dataIndex: ['_count', 'trainingRecords'],
      key: 'trainingCount',
      width: 80,
      render: (count: number) => (
        <Tag icon={<StarOutlined />} color="blue">{count}</Tag>
      ),
    },
    {
      title: '项目数量',
      dataIndex: ['_count', 'constructionProjects'],
      key: 'projectCount',
      width: 80,
      render: (count: number) => (
        <Tag icon={<TrophyOutlined />} color="green">{count}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusName(status)}
        </Tag>
      ),
    },
    {
      title: '区域',
      dataIndex: 'regionName',
      key: 'regionName',
      width: 100,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: Craftsman) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedCraftsman(record)
                setIsDetailModalVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="培训管理">
            <Button
              type="text"
              icon={<BookOutlined />}
              onClick={() => {
                setTrainingCraftsman(record)
                setIsTrainingModalVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="信用管理">
            <Button
              type="text"
              icon={<CreditCardOutlined />}
              onClick={() => {
                setCreditCraftsman(record)
                setIsCreditModalVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingCraftsman(record)
                setIsFormModalVisible(true)
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个工匠吗？"
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
    fetchCraftsmen()
  }, [filters])

  return (
    <div className="p-6">
      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="工匠总数"
              value={statistics.total}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃工匠"
              value={statistics.active}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="专家级工匠"
              value={statistics.expert}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高信用工匠"
              value={statistics.highCredit}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索工匠姓名、手机号或身份证号"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="技能等级"
              allowClear
              style={{ width: '100%' }}
              value={filters.skillLevel || undefined}
              onChange={(value) => handleFilterChange('skillLevel', value || '')}
            >
              <Option value="BEGINNER">初级</Option>
              <Option value="INTERMEDIATE">中级</Option>
              <Option value="ADVANCED">高级</Option>
              <Option value="EXPERT">专家级</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(value) => handleFilterChange('status', value || '')}
            >
              <Option value="ACTIVE">活跃</Option>
              <Option value="INACTIVE">不活跃</Option>
              <Option value="SUSPENDED">暂停</Option>
              <Option value="RETIRED">退休</Option>
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
                setEditingCraftsman(null)
                setIsFormModalVisible(true)
              }}
            >
              新增工匠
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 工匠列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={craftsmen}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              fetchCraftsmen(page, pageSize)
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 工匠表单模态框 */}
      <Modal
        title={editingCraftsman ? '编辑工匠' : '新增工匠'}
        open={isFormModalVisible}
        onCancel={() => {
          setIsFormModalVisible(false)
          setEditingCraftsman(null)
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <CraftsmanForm
          craftsman={editingCraftsman}
          onSuccess={() => {
            setIsFormModalVisible(false)
            setEditingCraftsman(null)
            fetchCraftsmen(pagination.current, pagination.pageSize)
          }}
          onCancel={() => {
            setIsFormModalVisible(false)
            setEditingCraftsman(null)
          }}
        />
      </Modal>

      {/* 工匠详情模态框 */}
      <Modal
        title="工匠详情"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false)
          setSelectedCraftsman(null)
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {selectedCraftsman && (
          <CraftsmanDetail
            craftsmanId={selectedCraftsman.id}
            onEdit={(craftsman) => {
              setIsDetailModalVisible(false)
              setEditingCraftsman(craftsman)
              setIsFormModalVisible(true)
            }}
          />
        )}
      </Modal>

      {/* 培训管理模态框 */}
      <Modal
        title="培训管理"
        open={isTrainingModalVisible}
        onCancel={() => {
          setIsTrainingModalVisible(false)
          setTrainingCraftsman(null)
        }}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {trainingCraftsman && (
          <TrainingManagement
            craftsmanId={trainingCraftsman.id}
            craftsmanName={trainingCraftsman.name}
            onClose={() => {
              setIsTrainingModalVisible(false)
              setTrainingCraftsman(null)
              fetchCraftsmen(pagination.current, pagination.pageSize) // 刷新工匠列表数据
            }}
          />
        )}
      </Modal>

      {/* 信用管理模态框 */}
      <Modal
        title="信用管理"
        open={isCreditModalVisible}
        onCancel={() => {
          setIsCreditModalVisible(false)
          setCreditCraftsman(null)
        }}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {creditCraftsman && (
          <CreditManagement
            craftsmanId={creditCraftsman.id}
            craftsmanName={creditCraftsman.name}
            onClose={() => {
              setIsCreditModalVisible(false)
              setCreditCraftsman(null)
              fetchCraftsmen(pagination.current, pagination.pageSize) // 刷新工匠列表数据
            }}
          />
        )}
      </Modal>
    </div>
  )
}