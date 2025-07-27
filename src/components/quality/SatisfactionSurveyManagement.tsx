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
  Rate,
  message,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Tooltip,
  Progress,
  Descriptions,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  FileSearchOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

// 调查类型配置
const SURVEY_TYPES = [
  { value: 'NEW_BUILD_SATISFACTION', label: '新建农房满意度', color: 'blue' },
  { value: 'RENOVATION_SATISFACTION', label: '改建农房满意度', color: 'green' },
  { value: 'EXPANSION_SATISFACTION', label: '扩建农房满意度', color: 'orange' },
  { value: 'REPAIR_SATISFACTION', label: '危房改造满意度', color: 'red' },
]

// 调查状态配置
const SURVEY_STATUS = {
  PENDING: { label: '待调查', color: 'default' },
  COMPLETED: { label: '已完成', color: 'success' },
  CANCELLED: { label: '已取消', color: 'error' },
}

// 满意度等级配置
const SATISFACTION_LEVELS = {
  5: { label: '非常满意', color: '#52c41a', icon: <SmileOutlined /> },
  4: { label: '满意', color: '#1890ff', icon: <SmileOutlined /> },
  3: { label: '一般', color: '#faad14', icon: <MehOutlined /> },
  2: { label: '不满意', color: '#ff7a45', icon: <FrownOutlined /> },
  1: { label: '非常不满意', color: '#ff4d4f', icon: <FrownOutlined /> },
}

interface SatisfactionSurvey {
  id: string
  surveyType: string
  overallScore: number
  qualityScore?: number
  serviceScore?: number
  timeScore?: number
  feedback?: string
  respondent: string
  phone?: string
  surveyDate: string
  status: string
  createdAt: string
}

interface SatisfactionSurveyManagementProps {
  currentUser?: any
}

const SatisfactionSurveyManagement: React.FC<SatisfactionSurveyManagementProps> = ({
  currentUser
}) => {
  const [houses, setHouses] = useState<any[]>([])
  const [surveys, setSurveys] = useState<SatisfactionSurvey[]>([])
  const [loading, setLoading] = useState(false)
  const [isFormModalVisible, setIsFormModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState<SatisfactionSurvey | null>(null)
  const [selectedSurvey, setSelectedSurvey] = useState<SatisfactionSurvey | null>(null)
  const [selectedHouse, setSelectedHouse] = useState<string>('')
  const [filters, setFilters] = useState({
    surveyType: '',
    status: '',
    dateRange: null as any,
  })
  const [statistics, setStatistics] = useState({
    totalSurveys: 0,
    averageOverallScore: 0,
    averageQualityScore: 0,
    averageServiceScore: 0,
    averageTimeScore: 0,
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

  // 获取满意度调查列表
  const fetchSurveys = async () => {
    if (!selectedHouse) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.surveyType) params.append('surveyType', filters.surveyType)
      if (filters.status) params.append('status', filters.status)
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'))
      }

      const response = await fetch(`/api/houses/${selectedHouse}/satisfaction-surveys?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const result = await response.json()

      if (response.ok) {
        setSurveys(result.data.surveys)
        
        // 计算统计数据
        const averageScores = result.data.averageScores
        setStatistics({
          totalSurveys: result.data.surveys.length,
          averageOverallScore: averageScores._avg.overallScore || 0,
          averageQualityScore: averageScores._avg.qualityScore || 0,
          averageServiceScore: averageScores._avg.serviceScore || 0,
          averageTimeScore: averageScores._avg.timeScore || 0,
        })
      } else {
        message.error(result.message || '获取满意度调查记录失败')
      }
    } catch (error) {
      console.error('Fetch surveys error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHouses()
  }, [])

  useEffect(() => {
    fetchSurveys()
  }, [selectedHouse, filters])

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        surveyDate: values.surveyDate.format('YYYY-MM-DD'),
      }

      const url = editingSurvey
        ? `/api/satisfaction-surveys/${editingSurvey.id}`
        : `/api/houses/${selectedHouse}/satisfaction-surveys`
      
      const method = editingSurvey ? 'PUT' : 'POST'

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
        setEditingSurvey(null)
        form.resetFields()
        fetchSurveys()
      } else {
        message.error(result.message || '操作失败')
      }
    } catch (error) {
      console.error('Submit error:', error)
      message.error('网络错误，请稍后重试')
    }
  }

  // 打开新增表单
  const handleAdd = () => {
    if (!selectedHouse) {
      message.warning('请先选择农房')
      return
    }
    setEditingSurvey(null)
    form.resetFields()
    form.setFieldsValue({
      surveyDate: dayjs(),
      status: 'COMPLETED',
    })
    setIsFormModalVisible(true)
  }

  // 打开编辑表单
  const handleEdit = (survey: SatisfactionSurvey) => {
    setEditingSurvey(survey)
    form.setFieldsValue({
      ...survey,
      surveyDate: survey.surveyDate ? dayjs(survey.surveyDate) : undefined,
    })
    setIsFormModalVisible(true)
  }

  // 查看详情
  const handleViewDetail = (survey: SatisfactionSurvey) => {
    setSelectedSurvey(survey)
    setIsDetailModalVisible(true)
  }

  // 获取满意度颜色
  const getSatisfactionColor = (score: number) => {
    return SATISFACTION_LEVELS[score as keyof typeof SATISFACTION_LEVELS]?.color || '#d9d9d9'
  }

  // 表格列定义
  const columns = [
    {
      title: '调查类型',
      dataIndex: 'surveyType',
      key: 'surveyType',
      render: (type: string) => {
        const config = SURVEY_TYPES.find(t => t.value === type)
        return <Tag color={config?.color}>{config?.label}</Tag>
      },
    },
    {
      title: '调查日期',
      dataIndex: 'surveyDate',
      key: 'surveyDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '受访者',
      dataIndex: 'respondent',
      key: 'respondent',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: '总体满意度',
      dataIndex: 'overallScore',
      key: 'overallScore',
      render: (score: number) => (
        <Space>
          <Rate disabled value={score} style={{ fontSize: 16 }} />
          <span style={{ color: getSatisfactionColor(score) }}>
            {SATISFACTION_LEVELS[score as keyof typeof SATISFACTION_LEVELS]?.label}
          </span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = SURVEY_STATUS[status as keyof typeof SURVEY_STATUS]
        return <Tag color={config?.color}>{config?.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: SatisfactionSurvey) => (
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
                  title="调查总数"
                  value={statistics.totalSurveys}
                  suffix="份"
                  prefix={<FileSearchOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总体满意度"
                  value={statistics.averageOverallScore}
                  precision={1}
                  suffix="分"
                  prefix={<SmileOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="质量满意度"
                  value={statistics.averageQualityScore}
                  precision={1}
                  suffix="分"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="服务满意度"
                  value={statistics.averageServiceScore}
                  precision={1}
                  suffix="分"
                />
              </Card>
            </Col>
          </Row>

          {/* 筛选和操作区域 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={4}>
                <Select
                  placeholder="调查类型"
                  allowClear
                  value={filters.surveyType}
                  onChange={(value) => setFilters({ ...filters, surveyType: value || '' })}
                  style={{ width: '100%' }}
                >
                  {SURVEY_TYPES.map(type => (
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
                  {Object.entries(SURVEY_STATUS).map(([key, config]) => (
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
                  新增调查
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 满意度调查列表 */}
          <Card title="满意度调查记录">
            <Table
              columns={columns}
              dataSource={surveys}
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
        title={editingSurvey ? '编辑满意度调查' : '新增满意度调查'}
        open={isFormModalVisible}
        onCancel={() => {
          setIsFormModalVisible(false)
          setEditingSurvey(null)
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
                name="surveyType"
                label="调查类型"
                rules={[{ required: true, message: '请选择调查类型' }]}
              >
                <Select placeholder="请选择调查类型">
                  {SURVEY_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="surveyDate"
                label="调查日期"
                rules={[{ required: true, message: '请选择调查日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="respondent"
                label="受访者姓名"
                rules={[{ required: true, message: '请输入受访者姓名' }]}
              >
                <Input placeholder="请输入受访者姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="overallScore"
                label="总体满意度"
                rules={[{ required: true, message: '请选择总体满意度' }]}
              >
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="qualityScore" label="质量满意度">
                <Rate />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="serviceScore" label="服务满意度">
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="timeScore" label="时效满意度">
                <Rate />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="feedback" label="意见反馈">
            <TextArea rows={4} placeholder="请输入意见反馈" />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              {Object.entries(SURVEY_STATUS).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingSurvey ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setIsFormModalVisible(false)
                setEditingSurvey(null)
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
        title="满意度调查详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedSurvey && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="调查类型">
              <Tag color={SURVEY_TYPES.find(t => t.value === selectedSurvey.surveyType)?.color}>
                {SURVEY_TYPES.find(t => t.value === selectedSurvey.surveyType)?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="调查日期">
              {dayjs(selectedSurvey.surveyDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="受访者">{selectedSurvey.respondent}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedSurvey.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="总体满意度">
              <Space>
                <Rate disabled value={selectedSurvey.overallScore} style={{ fontSize: 16 }} />
                <span style={{ color: getSatisfactionColor(selectedSurvey.overallScore) }}>
                  {SATISFACTION_LEVELS[selectedSurvey.overallScore as keyof typeof SATISFACTION_LEVELS]?.label}
                </span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="质量满意度">
              {selectedSurvey.qualityScore ? (
                <Rate disabled value={selectedSurvey.qualityScore} style={{ fontSize: 16 }} />
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="服务满意度">
              {selectedSurvey.serviceScore ? (
                <Rate disabled value={selectedSurvey.serviceScore} style={{ fontSize: 16 }} />
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="时效满意度">
              {selectedSurvey.timeScore ? (
                <Rate disabled value={selectedSurvey.timeScore} style={{ fontSize: 16 }} />
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={SURVEY_STATUS[selectedSurvey.status as keyof typeof SURVEY_STATUS]?.color}>
                {SURVEY_STATUS[selectedSurvey.status as keyof typeof SURVEY_STATUS]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedSurvey.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="意见反馈" span={2}>
              {selectedSurvey.feedback || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default SatisfactionSurveyManagement