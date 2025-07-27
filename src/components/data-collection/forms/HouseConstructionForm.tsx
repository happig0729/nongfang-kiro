import React, { useEffect } from 'react'
import { Form, Input, Select, DatePicker, Row, Col, Card, Upload, Button } from 'antd'
import { BuildOutlined, CalendarOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

interface HouseConstructionFormProps {
  data: any
  onNext: (data: any) => void
  isFirst: boolean
  isLast: boolean
}

const CONSTRUCTION_PHASES = [
  { value: 'FOUNDATION', label: '地基施工' },
  { value: 'STRUCTURE', label: '主体结构' },
  { value: 'ROOFING', label: '屋面施工' },
  { value: 'WALLS', label: '墙体施工' },
  { value: 'INTERIOR', label: '内部装修' },
  { value: 'EXTERIOR', label: '外部装修' },
  { value: 'UTILITIES', label: '水电安装' },
  { value: 'FINISHING', label: '收尾工程' },
]

const CONSTRUCTION_METHODS = [
  { value: 'TRADITIONAL', label: '传统建造' },
  { value: 'PREFAB', label: '装配式建造' },
  { value: 'MIXED', label: '混合建造' },
]

const MATERIALS = [
  { value: 'BRICK', label: '砖混结构' },
  { value: 'CONCRETE', label: '钢筋混凝土' },
  { value: 'STEEL', label: '钢结构' },
  { value: 'WOOD', label: '木结构' },
  { value: 'MIXED', label: '混合结构' },
]

export default function HouseConstructionForm({ data, onNext, isFirst, isLast }: HouseConstructionFormProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        ...data,
        startDate: data.startDate ? dayjs(data.startDate) : undefined,
        expectedCompletionDate: data.expectedCompletionDate ? dayjs(data.expectedCompletionDate) : undefined,
        actualCompletionDate: data.actualCompletionDate ? dayjs(data.actualCompletionDate) : undefined,
        constructionPhotos: data.constructionPhotos?.map((url: string, index: number) => ({
          uid: `photo-${index}`,
          name: `photo-${index}.jpg`,
          status: 'done',
          url: url,
        })) || [],
      })
    }
  }, [data, form])

  const handleSubmit = (values: any) => {
    const processedValues = {
      ...values,
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
      expectedCompletionDate: values.expectedCompletionDate ? values.expectedCompletionDate.format('YYYY-MM-DD') : undefined,
      actualCompletionDate: values.actualCompletionDate ? values.actualCompletionDate.format('YYYY-MM-DD') : undefined,
      constructionPhotos: values.constructionPhotos?.fileList?.map((file: any) => 
        file.response?.url || file.url
      ).filter(Boolean) || [],
    }
    onNext(processedValues)
  }

  const handlePhotoUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'construction_photo')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        return result.data.url
      } else {
        throw new Error('上传失败')
      }
    } catch (error) {
      throw error
    }
  }

  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    customRequest: async ({ file, onSuccess, onError }: any) => {
      try {
        const url = await handlePhotoUpload(file)
        onSuccess({ url })
      } catch (error) {
        onError(error)
      }
    },
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件')
        return false
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error('图片大小不能超过5MB')
        return false
      }
      
      return true
    },
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Card title={<><BuildOutlined /> 建设进度信息</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="currentPhase"
              label="当前施工阶段"
              rules={[{ required: true, message: '请选择当前施工阶段' }]}
            >
              <Select placeholder="请选择当前施工阶段">
                {CONSTRUCTION_PHASES.map(phase => (
                  <Option key={phase.value} value={phase.value}>
                    {phase.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="constructionMethod"
              label="建造方式"
            >
              <Select placeholder="请选择建造方式">
                {CONSTRUCTION_METHODS.map(method => (
                  <Option key={method.value} value={method.value}>
                    {method.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="structureMaterial"
              label="主要结构材料"
            >
              <Select placeholder="请选择主要结构材料">
                {MATERIALS.map(material => (
                  <Option key={material.value} value={material.value}>
                    {material.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="progressDescription"
              label="进度描述"
              rules={[
                { max: 1000, message: '进度描述长度不能超过1000字符' }
              ]}
            >
              <TextArea 
                rows={3}
                placeholder="请描述当前建设进度和完成情况"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={<><CalendarOutlined /> 时间节点</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="startDate"
              label="开工日期"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const constructionStatus = getFieldValue('constructionStatus') || data?.constructionStatus
                    if (constructionStatus === 'UNDER_CONSTRUCTION' && !value) {
                      return Promise.reject(new Error('建设中的农房必须填写开工日期'))
                    }
                    return Promise.resolve()
                  },
                }),
              ]}
            >
              <DatePicker
                placeholder="请选择开工日期"
                style={{ width: '100%' }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="expectedCompletionDate"
              label="预计完工日期"
            >
              <DatePicker
                placeholder="请选择预计完工日期"
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  const startDate = form.getFieldValue('startDate')
                  return current && startDate && current < startDate
                }}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="actualCompletionDate"
              label="实际完工日期"
            >
              <DatePicker
                placeholder="请选择实际完工日期"
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  const startDate = form.getFieldValue('startDate')
                  return current && ((startDate && current < startDate) || current > dayjs().endOf('day'))
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={<><PictureOutlined /> 施工照片</>} style={{ marginBottom: 16 }}>
        <Form.Item
          name="constructionPhotos"
          label="上传施工照片"
          extra="支持JPG、PNG格式，单个文件不超过5MB，最多上传10张"
        >
          <Upload.Dragger
            {...uploadProps}
            listType="picture-card"
            maxCount={10}
          >
            <div>
              <UploadOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>点击或拖拽上传施工照片</div>
            </div>
          </Upload.Dragger>
        </Form.Item>
      </Card>

      <Card title="质量和安全信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="qualityInspector"
              label="质量检查员"
              rules={[
                { max: 100, message: '姓名长度不能超过100字符' }
              ]}
            >
              <Input placeholder="请输入质量检查员姓名" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="safetyOfficer"
              label="安全员"
              rules={[
                { max: 100, message: '姓名长度不能超过100字符' }
              ]}
            >
              <Input placeholder="请输入安全员姓名" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="safetyMeasures"
              label="安全措施"
              rules={[
                { max: 1000, message: '安全措施描述长度不能超过1000字符' }
              ]}
            >
              <TextArea 
                rows={3}
                placeholder="请描述采取的安全措施"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="qualityStandards"
              label="质量标准"
              rules={[
                { max: 1000, message: '质量标准描述长度不能超过1000字符' }
              ]}
            >
              <TextArea 
                rows={3}
                placeholder="请描述执行的质量标准"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="其他信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="constructionNotes"
              label="施工备注"
              rules={[
                { max: 1000, message: '备注长度不能超过1000字符' }
              ]}
            >
              <TextArea 
                rows={4}
                placeholder="请输入施工相关的其他信息和备注"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  )
}