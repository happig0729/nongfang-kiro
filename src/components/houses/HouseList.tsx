'use client'

import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Card, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Pagination,
  message,
  Modal,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined,
  HomeOutlined,
  CameraOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { HouseType, ConstructionStatus, PropertyType } from '../../../generated/prisma'

const { Search } = Input
const { Option } = Select

// 农房数据接口
interface House {
  id: string
  address: string
  buildingTime?: string
  floors?: number
  height?: number
  houseType: HouseType
  constructionStatus: ConstructionStatus
  propertyType?: PropertyType
  landArea?: number
  buildingArea?: number
  coordinates?: string
  approvalNumber?: string
  completionDate?: string
  regionName: string
  applicant: {
    id: string
    realName: string
    phone: string
  }
  _count: {
    housePhotos: number
    inspections: number
  }
  createdAt: string
  updatedAt: string
}

// 分页信息接口
interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 查询参数接口
interface QueryParams {
  page: number
  limit: number
  regionCode?: string
  houseType?: HouseType
  constructionStatus?: ConstructionStatus
  search?: string
}

// 组件属性接口
interface HouseListProps {
  onCreateHouse?: () => void
  onEditHouse?: (house: House) => void
  onViewHouse?: (house: House) => void
}

// 农房类型映射
const HOUSE_TYPE_MAP = {
  [HouseType.NEW_BUILD]: { text: '新建', color: 'blue' },
  [HouseType.RENOVATION]: { text: '改建', color: 'orange' },
  [HouseType.EXPANSION]: { text: '扩建', color: 'green' },
  [HouseType.REPAIR]: { text: '维修', color: 'purple' },
}

// 建设状态映射
const CONSTRUCTION_STATUS_MAP = {
  [ConstructionStatus.PLANNED]: { text: '规划中', color: 'default' },
  [ConstructionStatus.APPROVED]: { text: '已审批', color: 'blue' },
  [ConstructionStatus.IN_PROGRESS]: { text: '建设中', color: 'processing' },
  [ConstructionStatus.COMPLETED]: { text: '已完工', color: 'success' },
  [ConstructionStatus.SUSPENDED]: { text: '暂停', color: 'warning' },
  [ConstructionStatus.CANCELLED]: { text: '取消', color: 'error' },
}

// 属性类型映射
const PROPERTY_TYPE_MAP = {
  [PropertyType.RESIDENTIAL]: '住宅',
  [PropertyType.COMMERCIAL]: '商业',
  [PropertyType.MIXED]: '混合',
}

export default function HouseList({ onCreateHouse, onEditHouse, onViewHouse }: HouseListProps) {
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10
  })

  // 获取农房列表
  const fetchHouses = async (params: QueryParams = queryParams) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/houses?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (response.ok) {
        setHouses(result.data.houses)
        setPagination(result.data.pagination)
      } else {
        message.error(result.message || '获取农房列表失败')
      }
    } catch (error) {
      console.error('Fetch houses error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除农房
  const handleDelete = (house: House) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除农房"${house.address}"吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const token = localStorage.getItem('auth_token')
          const response = await fetch(`/api/houses/${house.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          const result = await response.json()

          if (response.ok) {
            message.success('农房删除成功')
            fetchHouses()
          } else {
            message.error(result.message || '删除失败')
          }
        } catch (error) {
          console.error('Delete house error:', error)
          message.error('网络错误，请稍后重试')
        }
      }
    })
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    const newParams = { ...queryParams, search: value, page: 1 }
    setQueryParams(newParams)
    fetchHouses(newParams)
  }

  // 筛选处理
  const handleFilter = (key: keyof QueryParams, value: any) => {
    const newParams = { ...queryParams, [key]: value, page: 1 }
    setQueryParams(newParams)
    fetchHouses(newParams)
  }

  // 分页处理
  const handlePageChange = (page: number, pageSize: number) => {
    const newParams = { ...queryParams, page, limit: pageSize }
    setQueryParams(newParams)
    fetchHouses(newParams)
  }

  // 表格列定义
  const columns: ColumnsType<House> = [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      render: (address) => (
        <Tooltip placement="topLeft" title={address}>
          <span>{address}</span>
        </Tooltip>
      ),
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
      title: '房屋类型',
      dataIndex: 'houseType',
      key: 'houseType',
      width: 100,
      render: (type: HouseType) => {
        const config = HOUSE_TYPE_MAP[type]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '建设状态',
      dataIndex: 'constructionStatus',
      key: 'constructionStatus',
      width: 100,
      render: (status: ConstructionStatus) => {
        const config = CONSTRUCTION_STATUS_MAP[status]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '层数',
      dataIndex: 'floors',
      key: 'floors',
      width: 80,
      render: (floors) => floors ? `${floors}层` : '-',
    },
    {
      title: '建筑面积',
      dataIndex: 'buildingArea',
      key: 'buildingArea',
      width: 100,
      render: (area) => area ? `${area}㎡` : '-',
    },
    {
      title: '照片数量',
      dataIndex: ['_count', 'housePhotos'],
      key: 'photoCount',
      width: 80,
      render: (count) => (
        <Space>
          <CameraOutlined />
          {count}
        </Space>
      ),
    },
    {
      title: '检查次数',
      dataIndex: ['_count', 'inspections'],
      key: 'inspectionCount',
      width: 80,
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
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onViewHouse?.(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEditHouse?.(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // 组件挂载时获取数据
  useEffect(() => {
    fetchHouses()
  }, [])

  return (
    <Card>
      {/* 搜索和筛选区域 */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="搜索地址、申请人、审批号"
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
          />
          <Select
            placeholder="房屋类型"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => handleFilter('houseType', value)}
          >
            {Object.entries(HOUSE_TYPE_MAP).map(([key, config]) => (
              <Option key={key} value={key}>
                {config.text}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="建设状态"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => handleFilter('constructionStatus', value)}
          >
            {Object.entries(CONSTRUCTION_STATUS_MAP).map(([key, config]) => (
              <Option key={key} value={key}>
                {config.text}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateHouse}
          >
            新增农房
          </Button>
        </Space>
      </div>

      {/* 农房列表表格 */}
      <Table
        columns={columns}
        dataSource={houses}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1400 }}
        size="middle"
      />

      {/* 分页组件 */}
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Pagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
          }
          onChange={handlePageChange}
          onShowSizeChange={handlePageChange}
        />
      </div>
    </Card>
  )
}