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
  InputNumber,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

// 检查类型配置
const INSPECTION_TYPES = [
  { value: 'SURVEY', label: '勘察检查', color: 'blue' },
  { value: 'DESIGN', label: '设计检查', color: 'green' },
  { value: 'CONSTRUCTION', label: '施工检查', color: 'orange' },
  { value: 'SUPERVISION', label: '监理检查', color: 'purple' },
  { value: 'BUILDING', label: '建设检查', color: 'cyan' },
  { value: 'QUALITY', label: '质量检查', color: 'red' },
  { value: 'SAFETY', label: '安全检查', color: 'volcano' },
  { value: 'PROGRESS', label: '进度检查', color: 'geekblue' },
]

// 检查结果配置
const INSPECTION_RESULTS = {
  PASS: { label: '通过', color: 'success', icon: <CheckCircleOutlined /> },
  FAIL: { label: '不通过', color: 'error', icon: <CloseCircleOutlined /> },
  CONDITIONAL: { label: '有条件通过', color: 'warning', icon: <ExclamationCircleOutlined /> },
}

// 检查状态配置
const INSPECTION_STATUS = {
  PENDING: { label: '待检查', color: 'default' },
  COMPLETED: { label: '已完成', color: 'success' },
  RESCHEDULED: { label: '已重新安排', color: 'processing' },
}

interface QualityInspection {
  id: string
  inspectionType: string
  inspectionDate: string
  result: string
  score?: number
  issues?: string
  suggestions?: string
  photos: string[]
  followUpDate?: string
  status: string
  inspector: {
    id: string
    realName: string
    phone: string
  }
  createdAt: string
  updatedAt: string
}

interface QualityInspectionManagementProps {
  currentUser?: any
}

const QualityInspectionManagement: React.FC<QualityInspectionManagementProps> = ({
  currentUser
}) => {
  const [houses, setHouses] = useState<any[]>([])
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [loading, setLoading] = useState(false)
  const [isFormModalVisible, setIsFormModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [editingInspection, setEditingInspection] = useState<QualityInspection | null>(null)
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null)
  const [selectedHouse, setSelectedHouse] = useState<string>('')
  const [filters, setFilters] = useState({
    inspectionType: '',
    result: '',
    status: '',
    dateRange: null as any,
  })
  const [statistics, setStatistics] = useState({
    totalInspections: 0,
    passedInspections: 0,
    failedInspections: 0,
    passRate: 0,
  })

  const [form] = Form.useForm()

  // 获取农房列表
  const fetchHouses = async () => {
    try {
      const response = await fetch('/api/houses?limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const result = await response.json()

      if (response.ok) {
        setHouses(result.data.houses || [])
      }
    } catch (error) {
      console.error('Fetch houses error:', error)
    }
  }

  // 获取检查记录列表
  const fetchInspections = async () => {
    if (!selectedHouse) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.inspectionType) params.append('inspectionType', filters.inspectionType)
      if (filters.result) params.append('result', filters.result)
      if (filters.status) params.append('status', filters.status)
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'))
      }

      const response = await fetch(`/api/houses/${selectedHouse}/inspections?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const result = await response.json()

      if (response.ok) {
        setInspections(result.data.inspections)
        
        // 计算统计数据
        const total = result.data.inspections.length
        const passed = result.data.inspections.filter((i: any) => i.result === 'PASS').length
        const failed = result.data.inspections.filter((i: any) => i.result === 'FAIL').length
        const passRate = total > 0 ? (passed / total) * 100 : 0

        setStatistics({
          totalInspections: total,
          passedInspections: passed,
          failedInspections: failed,
          passRate,
        })
      } else {
        message.error(result.message || '获取检查记录失败')
      }
    } catch (error) {
      console.error('Fetch inspections error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHouses()
  }, [])

  useEffect(() => {
    fetchInspections()
  }, [selectedHouse, filters])

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        inspectionDate: values.inspectionDate.format('YYYY-MM-DD'),
        followUpDate: values.followUpDate ? values.followUpDate.format('YYYY-MM-DD') : undefined,
        photos: values.photos?.fileList?.map((file: any) => file.response?.url || file.url) || [],
      }

      const url = editingInspection
        ? `/api/inspections/${editingInspection.id}`
        : `/api/houses/${selectedHouse}/inspections`
      
      const method = editingInspection ? 'PUT' : 'POST'

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
        setEditingInspection(null)
        form.resetFields()
        fetchInspections()
      } else {
        message.error(result.message || '操作失败')
      }
    } catch (error) {
      console.error('Submit error:', error)
      message.error('网络错误，请稍后重试')
    }
  }

  // 处理删除
  const handleDelete = async (inspection: QualityInspection) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除这条${INSPECTION_TYPES.find(t => t.value === inspection.inspectionType)?.label}记录吗？`,
      onOk: async () => {
        try {
          const response = await fetch(`/api/inspections/${inspection.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          })

          const result = await response.json()

          if (response.ok) {
            message.success(result.message)
            fetchInspections()
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
    if (!selectedHouse) {
      message.warning('请先选择农房')
      return
    }
    setEditingInspection(null)
    form.resetFields()
    setIsFormModalVisible(true)
  }

  // 打开编辑表单
  const handleEdit = (inspection: QualityInspection) => {
    setEditingInspection(inspection)
    form.setFieldsValue({
      ...inspection,
      inspectionDate: inspection.inspectionDate ? dayjs(inspection.inspectionDate) : undefined,
      followUpDate: inspection.followUpDate ? dayjs(inspection.followUpDate) : undefined,
    })
    setIsFormModalVisible(true)
  }

  // 查看详情
  const handleViewDetail = (inspection: QualityInspection) => {
    setSelectedInspection(inspection)
    setIsDetailModalVisible(true)
  }

  // 表格列定义
  const columns = [
    {
      title: '检查类型',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      render: (type: string) => {
        const config = INSPECTION_TYPES.find(t => t.value === type)
        return <Tag color={config?.color}>{config?.label}</Tag>
      },
    },
    {
      title: '检查日期',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '检查员',
      dataIndex: ['inspector', 'realName'],
      key: 'inspector',
    },
    {
      title: '检查结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const config = INSPECTION_RESULTS[result as keyof typeof INSPECTION_RESULTS]
        return (
          <Space>
            {config?.icon}
            <Tag color={config?.color}>{config?.label}</Tag>
          </Space>
        )
      },
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => score ? `${score}分` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = INSPECTION_STATUS[status as keyof typeof INSPECTION_STATUS]
        return <Tag color={config?.color}>{config?.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: QualityInspection) => (
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
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 农房选择 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Select
              placeholder="请选择农房"
              value={selectedHouse}
              onChange={setSelectedHouse}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {houses.map(house => (
                <Option key={house.id} value={house.id}>
                  {house.address} - {house.applicant.realName}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {selectedHouse && (
        <>
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="检查总数"
                  value={statistics.totalInspections}
                  suffix="次"
                  prefix={<SafetyOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="通过检查"
                  value={statistics.passedInspections}
                  suffix="次"
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="未通过检查"
                  value={statistics.failedInspections}
                  suffix="次"
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="通过率"
                  value={statistics.passRate}
                  precision={1}
                  suffix="%"
                  prefix={
                    <Progress
                      type="circle"
                      size="small"
                      percent={statistics.passRate}
                      showInfo={false}
                    />
                  }
                />
              </Card>
            </Col>
          </Row>

          {/* 筛选和操作区域 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={4}>
                <Select
                  placeholder="检查类型"
                  allowClear
                  value={filters.inspectionType}
                  onChange={(value) => setFilters({ ...filters, inspectionType: value || '' })}
                  style={{ width: '100%' }}
                >
                  {INSPECTION_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="检查结果"
                  allowClear
                  value={filters.result}
                  onChange={(value) => setFilters({ ...filters, result: value || '' })}
                  style={{ width: '100%' }}
                >
                  {Object.entries(INSPECTION_RESULTS).map(([key, config]) => (
                    <Option key={key} value={key}>
                      {config.label}
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
                  {Object.entries(INSPECTION_STATUS).map(([key, config]) => (
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
                  新增检查
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 检查记录列表 */}
          <Card title="质量安全检查记录">
            <Table
              columns={columns}
              dataSource={inspections}
              rowKey="id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </>
      )}

      {/* 新增/编辑表单模态框 */}
      <Modal
        title={editingInspection ? '编辑检查记录' : '新增检查记录'}
        open={isFormModalVisible}
        onCancel={() => {
          setIsFormModalVisible(false)
          setEditingInspection(null)
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
                name="inspectionType"
                label="检查类型"
                rules={[{ required: true, message: '请选择检查类型' }]}
              >
                <Select placeholder="请选择检查类型">
                  {INSPECTION_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="inspectionDate"
                label="检查日期"
                rules={[{ required: true, message: '请选择检查日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="result"
                label="检查结果"
                rules={[{ required: true, message: '请选择检查结果' }]}
              >
                <Select placeholder="请选择检查结果">
                  {Object.entries(INSPECTION_RESULTS).map(([key, config]) => (
                    <Option key={key} value={key}>
                      {config.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="score" label="评分（0-100分）">
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="请输入评分"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  {Object.entries(INSPECTION_STATUS).map(([key, config]) => (
                    <Option key={key} value={key}>
                      {config.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="followUpDate" label="跟进日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="issues" label="发现问题">
            <TextArea rows={3} placeholder="请输入发现的问题" />
          </Form.Item>

          <Form.Item name="suggestions" label="整改建议">
            <TextArea rows={3} placeholder="请输入整改建议" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingInspection ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setIsFormModalVisible(false)
                setEditingInspection(null)
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
        title="检查记录详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedInspection && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="检查类型">
              <Tag color={INSPECTION_TYPES.find(t => t.value === selectedInspection.inspectionType)?.color}>
                {INSPECTION_TYPES.find(t => t.value === selectedInspection.inspectionType)?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="检查结果">
              <Space>
                {INSPECTION_RESULTS[selectedInspection.result as keyof typeof INSPECTION_RESULTS]?.icon}
                <Tag color={INSPECTION_RESULTS[selectedInspection.result as keyof typeof INSPECTION_RESULTS]?.color}>
                  {INSPECTION_RESULTS[selectedInspection.result as keyof typeof INSPECTION_RESULTS]?.label}
                </Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="检查日期">
              {dayjs(selectedInspection.inspectionDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="检查员">
              {selectedInspection.inspector.realName}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {selectedInspection.inspector.phone}
            </Descriptions.Item>
            <Descriptions.Item label="评分">
              {selectedInspection.score ? `${selectedInspection.score}分` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={INSPECTION_STATUS[selectedInspection.status as keyof typeof INSPECTION_STATUS]?.color}>
                {INSPECTION_STATUS[selectedInspection.status as keyof typeof INSPECTION_STATUS]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="跟进日期">
              {selectedInspection.followUpDate ? dayjs(selectedInspection.followUpDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="发现问题" span={2}>
              {selectedInspection.issues || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="整改建议" span={2}>
              {selectedInspection.suggestions || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedInspection.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(selectedInspection.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default QualityInspectionManagement