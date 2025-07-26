'use client'

import { useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  DatePicker,
  InputNumber,
  Upload,
  Card,
  Alert,
  Divider,
} from 'antd'
import { UploadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface CreditEvaluationFormProps {
  craftsmanId: string
  currentScore: number
  onSuccess: () => void
  onCancel: () => void
}

// 评价类型配置
const EVALUATION_TYPES = [
  {
    type: '工程质量',
    description: '工程质量优秀、符合标准',
    positivePoints: [5, 10, 15],
    negativePoints: [-5, -10, -15, -20],
  },
  {
    type: '安全施工',
    description: '严格遵守安全规范',
    positivePoints: [3, 5, 8],
    negativePoints: [-10, -15, -20],
  },
  {
    type: '工期管理',
    description: '按时完工、工期管理良好',
    positivePoints: [3, 5, 8],
    negativePoints: [-5, -8, -10],
  },
  {
    type: '服务态度',
    description: '服务态度良好、客户满意',
    positivePoints: [2, 3, 5],
    negativePoints: [-3, -5, -8],
  },
  {
    type: '技能水平',
    description: '技能水平提升、获得认证',
    positivePoints: [5, 8, 10],
    negativePoints: [-3, -5],
  },
  {
    type: '违规行为',
    description: '违反规定、不当行为',
    positivePoints: [],
    negativePoints: [-10, -15, -20, -30],
  },
  {
    type: '投诉处理',
    description: '客户投诉、纠纷处理',
    positivePoints: [2, 3],
    negativePoints: [-5, -8, -10, -15],
  },
  {
    type: '培训参与',
    description: '积极参与培训、学习提升',
    positivePoints: [2, 3, 5],
    negativePoints: [-2, -3],
  },
]

export default function CreditEvaluationForm({ 
  craftsmanId, 
  currentScore,
  onSuccess, 
  onCancel 
}: CreditEvaluationFormProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('')
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([])

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      // 处理数据
      const submitData = {
        ...values,
        evaluationDate: values.evaluationDate.format('YYYY-MM-DD'),
        evidenceUrls: evidenceFiles.map(file => file.response?.url || file.url).filter(Boolean),
      }

      const response = await fetch(`/api/craftsmen/${craftsmanId}/credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (response.ok) {
        message.success(`信用评价成功，当前信用分：${result.data.newCreditScore}`)
        onSuccess()
      } else {
        message.error(result.message || '信用评价失败')
      }
    } catch (error) {
      console.error('Submit error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理评价类型变化
  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    form.setFieldsValue({ pointsChange: undefined })
  }

  // 处理证据文件上传
  const handleEvidenceUpload = (info: any) => {
    let fileList = [...info.fileList]
    
    // 限制文件数量
    fileList = fileList.slice(-5)
    
    // 更新文件状态
    fileList = fileList.map(file => {
      if (file.response) {
        file.url = file.response.url
      }
      return file
    })

    setEvidenceFiles(fileList)
  }

  // 获取当前选择类型的配置
  const currentTypeConfig = EVALUATION_TYPES.find(t => t.type === selectedType)

  // 计算预期新分数
  const pointsChange = form.getFieldValue('pointsChange') || 0
  const expectedScore = Math.max(0, Math.min(100, currentScore + pointsChange))

  return (
    <div>
      {/* 当前信用分显示 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentScore}</div>
              <div className="text-gray-600">当前信用分</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ 
                color: pointsChange > 0 ? '#52c41a' : pointsChange < 0 ? '#ff4d4f' : '#666' 
              }}>
                {pointsChange > 0 ? '+' : ''}{pointsChange || 0}
              </div>
              <div className="text-gray-600">分数变化</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ 
                color: expectedScore >= 90 ? '#52c41a' : expectedScore >= 70 ? '#faad14' : '#ff4d4f' 
              }}>
                {expectedScore}
              </div>
              <div className="text-gray-600">预期新分数</div>
            </div>
          </Col>
        </Row>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          evaluationDate: dayjs(),
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="evaluationType"
              label="评价类型"
              rules={[{ required: true, message: '请选择评价类型' }]}
            >
              <Select 
                placeholder="请选择评价类型" 
                onChange={handleTypeChange}
                showSearch
              >
                {EVALUATION_TYPES.map((type) => (
                  <Option key={type.type} value={type.type}>
                    {type.type}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="evaluationDate"
              label="评价日期"
              rules={[{ required: true, message: '请选择评价日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择评价日期"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>
        </Row>

        {currentTypeConfig && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="pointsChange"
                label="分数变化"
                rules={[{ required: true, message: '请选择分数变化' }]}
              >
                <Select placeholder="请选择分数变化">
                  <Option disabled>
                    <div style={{ color: '#999', fontSize: '12px' }}>加分项</div>
                  </Option>
                  {currentTypeConfig.positivePoints.map((points) => (
                    <Option key={points} value={points}>
                      <span style={{ color: '#52c41a' }}>+{points} 分</span>
                    </Option>
                  ))}
                  {currentTypeConfig.negativePoints.length > 0 && (
                    <Option disabled>
                      <div style={{ color: '#999', fontSize: '12px' }}>扣分项</div>
                    </Option>
                  )}
                  {currentTypeConfig.negativePoints.map((points) => (
                    <Option key={points} value={points}>
                      <span style={{ color: '#ff4d4f' }}>{points} 分</span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="reason"
              label="评价原因"
              rules={[{ required: true, message: '请输入评价原因' }]}
            >
              <TextArea
                rows={3}
                placeholder="请详细描述评价原因和具体情况"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="evidenceFiles"
              label="证据材料"
            >
              <Upload
                name="evidence"
                action="/api/upload"
                headers={{
                  authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                }}
                onChange={handleEvidenceUpload}
                fileList={evidenceFiles}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                multiple
                maxCount={5}
              >
                <Button icon={<UploadOutlined />}>上传证据材料</Button>
              </Upload>
              <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                支持PDF、图片、Word文档，最多5个文件，单个文件不超过10MB
              </div>
            </Form.Item>
          </Col>
        </Row>

        {/* 评分规则说明 */}
        <Alert
          message="信用评分规则"
          description={
            <div>
              <p>• 工匠初始信用分为100分，分数范围0-100分</p>
              <p>• 90-100分：优秀；80-89分：良好；70-79分：一般；70分以下：较差</p>
              <p>• 单次加分不超过20分，单次扣分不超过50分</p>
              <p>• 评价记录将影响工匠推荐排序和项目分配</p>
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          className="mb-4"
        />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交评价
            </Button>
            <Button onClick={onCancel}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}