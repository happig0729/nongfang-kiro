'use client'

import { useState, useEffect } from 'react'
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
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface TrainingFormProps {
  craftsmanId: string
  trainingRecord?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function TrainingForm({ 
  craftsmanId, 
  trainingRecord, 
  onSuccess, 
  onCancel 
}: TrainingFormProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [certificateFile, setCertificateFile] = useState<any>(null)

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      // 处理数据
      const submitData = {
        ...values,
        trainingDate: values.trainingDate.format('YYYY-MM-DD'),
        certificateUrl: certificateFile ? `/uploads/certificates/${certificateFile.name}` : trainingRecord?.certificateUrl,
      }

      const url = trainingRecord 
        ? `/api/training/${trainingRecord.id}` 
        : `/api/craftsmen/${craftsmanId}/training`
      const method = trainingRecord ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (response.ok) {
        message.success(trainingRecord ? '培训记录更新成功' : '培训记录创建成功')
        onSuccess()
      } else {
        message.error(result.message || '操作失败')
      }
    } catch (error) {
      console.error('Submit error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理证书文件上传
  const handleCertificateUpload = (info: any) => {
    if (info.file.status === 'done') {
      setCertificateFile(info.file)
      message.success('证书上传成功')
    } else if (info.file.status === 'error') {
      message.error('证书上传失败')
    }
  }

  // 初始化表单数据
  useEffect(() => {
    if (trainingRecord) {
      form.setFieldsValue({
        trainingType: trainingRecord.trainingType,
        trainingContent: trainingRecord.trainingContent,
        durationHours: trainingRecord.durationHours,
        trainingDate: dayjs(trainingRecord.trainingDate),
        instructor: trainingRecord.instructor,
        trainingLocation: trainingRecord.trainingLocation,
        score: trainingRecord.score,
        remarks: trainingRecord.remarks,
        completionStatus: trainingRecord.completionStatus,
      })
    } else {
      // 新增时设置默认值
      form.setFieldsValue({
        trainingDate: dayjs(),
        completionStatus: 'IN_PROGRESS',
      })
    }
  }, [trainingRecord, form])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        completionStatus: 'IN_PROGRESS',
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="trainingType"
            label="培训类型"
            rules={[
              { required: true, message: '请输入培训类型' },
              { max: 100, message: '培训类型长度不能超过100字符' },
            ]}
          >
            <Select placeholder="请选择或输入培训类型" showSearch allowClear>
              <Option value="理论培训">理论培训</Option>
              <Option value="实操培训">实操培训</Option>
              <Option value="安全培训">安全培训</Option>
              <Option value="技术培训">技术培训</Option>
              <Option value="线下培训">线下培训</Option>
              <Option value="线上培训">线上培训</Option>
              <Option value="基础知识培训">基础知识培训</Option>
              <Option value="专业技能培训">专业技能培训</Option>
              <Option value="法规培训">法规培训</Option>
              <Option value="质量管理培训">质量管理培训</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="durationHours"
            label="培训学时"
            rules={[
              { required: true, message: '请输入培训学时' },
              { type: 'number', min: 1, max: 100, message: '培训学时必须在1-100小时之间' },
            ]}
          >
            <InputNumber
              placeholder="请输入培训学时"
              style={{ width: '100%' }}
              min={1}
              max={100}
              addonAfter="小时"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="trainingContent"
            label="培训内容"
            rules={[{ required: true, message: '请输入培训内容' }]}
          >
            <TextArea
              rows={3}
              placeholder="请详细描述培训内容"
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="trainingDate"
            label="培训日期"
            rules={[{ required: true, message: '请选择培训日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择培训日期"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="instructor"
            label="讲师姓名"
            rules={[
              { required: true, message: '请输入讲师姓名' },
              { max: 100, message: '讲师姓名长度不能超过100字符' },
            ]}
          >
            <Input placeholder="请输入讲师姓名" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="trainingLocation"
            label="培训地点"
            rules={[{ max: 200, message: '培训地点长度不能超过200字符' }]}
          >
            <Input placeholder="请输入培训地点" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="completionStatus"
            label="完成状态"
            rules={[{ required: true, message: '请选择完成状态' }]}
          >
            <Select placeholder="请选择完成状态">
              <Option value="IN_PROGRESS">进行中</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="FAILED">未通过</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="score"
            label="培训成绩"
            rules={[
              { type: 'number', min: 0, max: 100, message: '成绩必须在0-100分之间' },
            ]}
          >
            <InputNumber
              placeholder="请输入培训成绩"
              style={{ width: '100%' }}
              min={0}
              max={100}
              addonAfter="分"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="certificateFile"
            label="培训证书"
          >
            <Upload
              name="certificate"
              action="/api/upload"
              headers={{
                authorization: `Bearer ${localStorage.getItem('auth_token')}`,
              }}
              onChange={handleCertificateUpload}
              accept=".pdf,.jpg,.jpeg,.png"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>上传证书</Button>
            </Upload>
            <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
              支持PDF、JPG、PNG格式，文件大小不超过5MB
            </div>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="remarks"
            label="备注"
          >
            <TextArea
              rows={2}
              placeholder="请输入备注信息"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {trainingRecord ? '更新' : '创建'}
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}