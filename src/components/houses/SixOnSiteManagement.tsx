'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  message,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Tooltip,
  Progress,
  Timeline,
  Descriptions,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
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

interface SixOnSiteRecord {
  id: string
  onSiteType: string
  scheduledDate: string
  actualDate?: string
  responsibleUnit: string
  contactPerson: string
  contactPhone: string
  status: string
  arrivalTime?: string
  departureTime?: string
  workContent?: string
  findings?: string
  suggestions?: string
  photos: string[]
  documents: string[]
  remarks?: string
  createdAt: string
  updatedAt: string
}

interface SixOnSiteManagementProps {
  houseId: string
  houseAddress: string
  onClose?: () => void
}

const SixOnSiteManagement: React.FC<SixOnSiteManagementProps> = ({
  houseId,
  houseAddress,
  onClose,
}) => {
  const [records, setRecords] = useState<SixOnSiteRecord[]>([])
  const [statistics, setStatistics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isFormModalVisible, setIsFormModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SixOnSiteRecord | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<SixOnSiteRecord | null>(null)
  const [filters, setFilters] = useState({
    onSiteType: '',
    status: '',
    dateRange: null as any,
  })

  const [form] = Form.useForm()

  // 获取六到场记录列表
  const fetchRecords = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.onSiteType) params.append('onSiteType', filters.onSiteType)
      if (filters.status) params.append('status', filters.status)
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'))
      }

      const response = await fetch(`/api/houses/${houseId}/six-on-site?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const result = await response.json()

      if (response.ok) {
        setRecords(result.data.records)
        setStatistics(result.data.statistics)
      } else {
        message.error(result.message || '获取六到场记录失败')
      }
    } catch (error) {
      console.error('Fetch records error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [houseId, filters])

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        scheduledDate: values.scheduledDate.format('YYYY-MM-DD'),
        actualDate: values.actualDate ? values.actualDate.format('YYYY-MM-DD') : undefined,
        arrivalTime: values.arrivalTime ? values.arrivalTime.toISOString() : undefined,
        departureTime: values.departureTime ? values.departureTime.toISOString() : undefined,
        photos: values.photos?.fileList?.map((file: any) => file.response?.url || file.url) || [],
        documents: values.documents?.fileList?.map((file: any) => file.response?.url || file.url) || [],
      }

      const url = editingRecord
        ? `/api/six-on-site/${editingRecord.id}`
        : `/api/houses/${houseId}/six-on-site`
      
      const method = editingRecord ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        message.success(result.message)
        setIsFormModalVisible(false)
        setEditingRecord(null)
        form.resetFields()
        fetchRecords()
      } else {
        message.error(result.message || '操作失败')
      }
    } catch (error) {
      console.error('Submit error:', error)
      message.error('网络错误，请稍后重试')
    }
  }

  // 处理删除
  const handleDelete = async (record: SixOnSiteRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除${ON_SITE_TYPES.find(t => t.value === record.onSiteType)?.label}记录吗？`,
      onOk: async () => {
        try {
          const response = await fetch(`/api/six-on-site/${record.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          })

          const result = await response.json()

          if (response.ok) {
            message.success(result.message)
            fetchRecords()
          } else {
            message.error(result.message || '删除失败')
          }
        } catch (error) {
          console.error('Delete error:', error)
          message.error('网络错误，请稍后重试')
        }
      },
    })
  }

  // 打开新增表单
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setIsFormModalVisible(true)
  }

  // 打开编辑表单
  const handleEdit = (record: SixOnSiteRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      scheduledDate: record.scheduledDate ? dayjs(record.scheduledDate) : undefined,
      actualDate: record.actualDate ? dayjs(record.actualDate) : undefined,
      arrivalTime: record.arrivalTime ? dayjs(record.arrivalTime) : undefined,
      departureTime: record.departureTime ? dayjs(record.departureTime) : undefined,
    })
    setIsFormModalVisible(true)
  }

  // 查看详情
  const handleViewDetail = (record: SixOnSiteRecord) => {
    setSelectedRecord(record)
    setIsDetailModalVisible(true)
  }

  // 计算统计数据
  const getStatistics = () => {
    const totalTypes = ON_SITE_TYPES.length
    const completedTypes = new Set(
      records.filter(r => r.status === 'COMPLETED').map(r => r.onSiteType)
    ).size
    const completionRate = totalTypes > 0 ? (completedTypes / totalTypes) * 100 : 0

    const statusCounts = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalTypes,
      completedTypes,
      completionRate,
      statusCounts,
    }
  }

  const stats = getStatistics()

  // 表格列定义
  const columns = [
    {
      title: '到场类型',
      dataIndex: 'onSiteType',
      key: 'onSiteType',
      render: (type: string) => {
        const config = ON_SITE_TYPES.find(t => t.value === type)
        return <Tag color={config?.color}>{config?.label}</Tag>
      },
    },
    {
      title: '负责单位',
      dataIndex: 'responsibleUnit',
      key: 'responsibleUnit',
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
    },
    {
      title: '计划日期',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '实际日期',
      dataIndex: 'actualDate',
      key: 'actualDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
        return <Tag color={config?.color}>{config?.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: SixOnSiteRecord) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              disabled={record.status === 'COMPLETED'}
            />
          </Tooltip>
        </Space>
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
              title="总到场类型"
              value={stats.totalTypes}
              suffix="项"
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成类型"
              value={stats.completedTypes}
              suffix="项"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={stats.completionRate}
              precision={1}
              suffix="%"
              prefix={<Progress type="circle" size="small" percent={stats.completionRate} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.statusCounts.IN_PROGRESS || 0}
              suffix="项"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和操作区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Select
              placeholder="到场类型"
              allowClear
              value={filters.onSiteType}
              onChange={(value) => setFilters({ ...filters, onSiteType: value || '' })}
              style={{ width: '100%' }}
            >
              {ON_SITE_TYPES.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
              style={{ width: '100%' }}
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.label}
                </Option>
              ))}
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
          <Col span={4}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增记录
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 记录列表 */}
      <Card title={`农房地址：${houseAddress}`}>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑表单模态框 */}
      <Modal
        title={editingRecord ? '编辑六到场记录' : '新增六到场记录'}
        open={isFormModalVisible}
        onCancel={() => {
          setIsFormModalVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="onSiteType"
                label="到场类型"
                rules={[{ required: true, message: '请选择到场类型' }]}
              >
                <Select placeholder="请选择到场类型" disabled={!!editingRecord}>
                  {ON_SITE_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="scheduledDate"
                label="计划日期"
                rules={[{ required: true, message: '请选择计划日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="responsibleUnit"
                label="负责单位"
                rules={[{ required: true, message: '请输入负责单位' }]}
              >
                <Input placeholder="请输入负责单位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPerson"
                label="联系人"
                rules={[{ required: true, message: '请输入联系人' }]}
              >
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <Option key={key} value={key}>
                      {config.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="actualDate" label="实际日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="arrivalTime" label="到场时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="workContent" label="工作内容">
            <TextArea rows={3} placeholder="请输入工作内容" />
          </Form.Item>

          <Form.Item name="findings" label="发现问题">
            <TextArea rows={3} placeholder="请输入发现的问题" />
          </Form.Item>

          <Form.Item name="suggestions" label="建议措施">
            <TextArea rows={3} placeholder="请输入建议措施" />
          </Form.Item>

          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setIsFormModalVisible(false)
                setEditingRecord(null)
                form.resetFields()
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情查看模态框 */}
      <Modal
        title="六到场记录详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedRecord && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="到场类型">
              <Tag color={ON_SITE_TYPES.find(t => t.value === selectedRecord.onSiteType)?.color}>
                {ON_SITE_TYPES.find(t => t.value === selectedRecord.onSiteType)?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_CONFIG[selectedRecord.status as keyof typeof STATUS_CONFIG]?.color}>
                {STATUS_CONFIG[selectedRecord.status as keyof typeof STATUS_CONFIG]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="负责单位">{selectedRecord.responsibleUnit}</Descriptions.Item>
            <Descriptions.Item label="联系人">{selectedRecord.contactPerson}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedRecord.contactPhone}</Descriptions.Item>
            <Descriptions.Item label="计划日期">
              {dayjs(selectedRecord.scheduledDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="实际日期">
              {selectedRecord.actualDate ? dayjs(selectedRecord.actualDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="到场时间">
              {selectedRecord.arrivalTime ? dayjs(selectedRecord.arrivalTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="工作内容" span={2}>
              {selectedRecord.workContent || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="发现问题" span={2}>
              {selectedRecord.findings || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="建议措施" span={2}>
              {selectedRecord.suggestions || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {selectedRecord.remarks || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(selectedRecord.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default SixOnSiteManagement