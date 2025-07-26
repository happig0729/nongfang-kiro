'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Select,
  DatePicker,
  Space,
  Progress,
  message,
  Modal,
} from 'antd'
import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import SixOnSiteManagement from '../houses/SixOnSiteManagement'

const { Option } = Select
const { RangePicker } = DatePicker

// 六到场类型配置
const ON_SITE_TYPES = [
  { value: 'SURVEY', label: '勘察到场', color: 'blue' },
  { value: 'DESIGN', label: '设计到场', color: 'green' },
  { value: 'CONSTRUCTION', label: '施工到场', color: 'orange' },
  { value: 'SUPERVISION', label: '监理到场', color: 'purple' },
  { value: 'BUILDING', label: '建设到场', color: 'cyan' },
  { value: 'QUALITY', label: '质监到场', color: 'red' },
]

// 状态配置
const STATUS_CONFIG = {
  SCHEDULED: { label: '已安排', color: 'default' },
  IN_PROGRESS: { label: '进行中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'success' },
  DELAYED: { label: '延期', color: 'warning' },
  CANCELLED: { label: '已取消', color: 'error' },
  RESCHEDULED: { label: '重新安排', color: 'default' },
}

interface SixOnSiteOverviewProps {
  currentUser?: any
}

interface HouseWithSixOnSite {
  id: string
  address: string
  regionName: string
  constructionStatus: string
  applicant: {
    realName: string
    phone: string
  }
  sixOnSiteRecords: any[]
  _count: {
    sixOnSiteRecords: number
  }
}

const SixOnSiteOverview: React.FC<SixOnSiteOverviewProps> = ({ currentUser }) => {
  const [houses, setHouses] = useState<HouseWithSixOnSite[]>([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState({
    totalHouses: 0,
    totalRecords: 0,
    completedRecords: 0,
    completionRate: 0,
  })
  const [filters, setFilters] = useState({
    regionCode: '',
    constructionStatus: '',
    dateRange: null as any,
  })
  const [selectedHouse, setSelectedHouse] = useState<HouseWithSixOnSite | null>(null)
  const [isManagementModalVisible, setIsManagementModalVisible] = useState(false)

  // 获取农房六到场数据
  const fetchHousesWithSixOnSite = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.regionCode) params.append('regionCode', filters.regionCode)
      if (filters.constructionStatus) params.append('constructionStatus', filters.constructionStatus)
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'))
      }

      const response = await fetch(`/api/houses?includeSixOnSite=true&${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        const housesData = result.data.houses || []
        setHouses(housesData)

        // 计算统计数据
        const totalHouses = housesData.length
        const totalRecords = housesData.reduce((sum: number, house: any) => 
          sum + (house._count?.sixOnSiteRecords || 0), 0
        )
        const completedRecords = housesData.reduce((sum: number, house: any) => 
          sum + (house.sixOnSiteRecords?.filter((record: any) => record.status === 'COMPLETED').length || 0), 0
        )
        const completionRate = totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0

        setStatistics({
          totalHouses,
          totalRecords,
          completedRecords,
          completionRate,
        })
      } else {
        message.error(result.message || '获取数据失败')
      }
    } catch (error) {
      console.error('Fetch houses error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHousesWithSixOnSite()
  }, [filters])

  // 计算农房的六到场完成情况
  const calculateHouseCompletion = (house: HouseWithSixOnSite) => {
    const records = house.sixOnSiteRecords || []
    const completedTypes = new Set(
      records.filter(r => r.status === 'COMPLETED').map(r => r.onSiteType)
    ).size
    const totalTypes = ON_SITE_TYPES.length
    return totalTypes > 0 ? (completedTypes / totalTypes) * 100 : 0
  }

  // 打开六到场管理
  const handleOpenManagement = (house: HouseWithSixOnSite) => {
    setSelectedHouse(house)
    setIsManagementModalVisible(true)
  }

  // 表格列定义
  const columns = [
    {
      title: '农房地址',
      dataIndex: 'address',
      key: 'address',
      width: 300,
    },
    {
      title: '申请人',
      dataIndex: ['applicant', 'realName'],
      key: 'applicant',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: ['applicant', 'phone'],
      key: 'phone',
      width: 120,
    },
    {
      title: '建设状态',
      dataIndex: 'constructionStatus',
      key: 'constructionStatus',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          PLANNED: { text: '规划中', color: 'default' },
          APPROVED: { text: '已审批', color: 'blue' },
          IN_PROGRESS: { text: '建设中', color: 'processing' },
          COMPLETED: { text: '已完工', color: 'success' },
          SUSPENDED: { text: '暂停', color: 'warning' },
          CANCELLED: { text: '取消', color: 'error' },
        }
        const config = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '六到场记录',
      dataIndex: '_count',
      key: 'recordCount',
      width: 100,
      render: (count: any) => `${count?.sixOnSiteRecords || 0} 条`,
    },
    {
      title: '完成进度',
      key: 'completion',
      width: 150,
      render: (_, record: HouseWithSixOnSite) => {
        const completion = calculateHouseCompletion(record)
        return (
          <Progress
            percent={completion}
            size="small"
            status={completion === 100 ? 'success' : 'active'}
            format={(percent) => `${Math.round(percent || 0)}%`}
          />
        )
      },
    },
    {
      title: '所属区域',
      dataIndex: 'regionName',
      key: 'regionName',
      width: 120,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record: HouseWithSixOnSite) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleOpenManagement(record)}
        >
          管理
        </Button>
      ),
    },
  ]

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="农房总数"
              value={statistics.totalHouses}
              suffix="户"
              prefix={<AuditOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="六到场记录"
              value={statistics.totalRecords}
              suffix="条"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成记录"
              value={statistics.completedRecords}
              suffix="条"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={statistics.completionRate}
              precision={1}
              suffix="%"
              prefix={
                <Progress
                  type="circle"
                  size="small"
                  percent={statistics.completionRate}
                  showInfo={false}
                />
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Select
              placeholder="建设状态"
              allowClear
              value={filters.constructionStatus}
              onChange={(value) => setFilters({ ...filters, constructionStatus: value || '' })}
              style={{ width: '100%' }}
            >
              <Option value="PLANNED">规划中</Option>
              <Option value="APPROVED">已审批</Option>
              <Option value="IN_PROGRESS">建设中</Option>
              <Option value="COMPLETED">已完工</Option>
              <Option value="SUSPENDED">暂停</Option>
              <Option value="CANCELLED">取消</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 农房列表 */}
      <Card title="农房六到场管理">
        <Table
          columns={columns}
          dataSource={houses}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSize: 20,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 六到场管理模态框 */}
      <Modal
        title={`六到场管理 - ${selectedHouse?.address}`}
        open={isManagementModalVisible}
        onCancel={() => {
          setIsManagementModalVisible(false)
          setSelectedHouse(null)
        }}
        footer={null}
        width={1400}
        style={{ top: 20 }}
      >
        {selectedHouse && (
          <SixOnSiteManagement
            houseId={selectedHouse.id}
            houseAddress={selectedHouse.address}
            onClose={() => {
              setIsManagementModalVisible(false)
              setSelectedHouse(null)
              fetchHousesWithSixOnSite() // 刷新数据
            }}
          />
        )}
      </Modal>
    </div>
  )
}

export default SixOnSiteOverview