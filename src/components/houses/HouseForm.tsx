'use client'

import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  message,
  Space,
} from 'antd'
import { SaveOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { HouseType, ConstructionStatus, PropertyType } from '../../../generated/prisma'

const { Option } = Select
const { TextArea } = Input

// 农房数据接口
interface HouseFormData {
  id?: string
  address: string
  buildingTime?: string
  floors?: number
  height?: number
  houseType: HouseType
  constructionStatus?: ConstructionStatus
  landArea?: number
  buildingArea?: number
  propertyType?: PropertyType
  coordinates?: string
  approvalNumber?: string
  completionDate?: string
}

// 组件属性接口
interface HouseFormProps {
  initialData?: HouseFormData
  onSubmit: (data: HouseFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

// 农房类型选项
const HOUSE_TYPE_OPTIONS = [
  { value: HouseType.NEW_BUILD, label: '新建' },
  { value: HouseType.RENOVATION, label: '改建' },
  { value: HouseType.EXPANSION, label: '扩建' },
  { value: HouseType.REPAIR, label: '维修' },
]

// 建设状态选项
const CONSTRUCTION_STATUS_OPTIONS = [
  { value: ConstructionStatus.PLANNED, label: '规划中' },
  { value: ConstructionStatus.APPROVED, label: '已审批' },
  { value: ConstructionStatus.IN_PROGRESS, label: '建设中' },
  { value: ConstructionStatus.COMPLETED, label: '已完工' },
  { value: ConstructionStatus.SUSPENDED, label: '暂停' },
  { value: ConstructionStatus.CANCELLED, label: '取消' },
]

// 属性类型选项
const PROPERTY_TYPE_OPTIONS = [
  { value: PropertyType.RESIDENTIAL, label: '住宅' },
  { value: PropertyType.COMMERCIAL, label: '商业' },
  { value: PropertyType.MIXED, label: '混合' },
]

export default function HouseForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false 
}: HouseFormProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // 表单提交处理
  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      // 处理日期字段
      const formData: HouseFormData = {
        ...values,
        buildingTime: values.buildingTime ? values.buildingTime.format('YYYY-MM-DD') : undefined,
        completionDate: values.completionDate ? values.completionDate.format('YYYY-MM-DD') : undefined,
      }

      // 如果是编辑模式，添加ID
      if (initialData?.id) {
        formData.id = initialData.id
      }

      await onSubmit(formData)
      message.success(initialData?.id ? '农房信息更新成功' : '农房记录创建成功')
    } catch (error) {
      console.error('Form submit error:', error)
      message.error('操作失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 坐标格式验证
  const validateCoordinates = (_: any, value: string) => {
    if (!value) return Promise.resolve()
    
    const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/
    if (!coordPattern.test(value)) {
      return Promise.reject(new Error('坐标格式错误，请输入"纬度,经度"格式，如：36.0671,120.3826'))
    }
    
    const [lat, lng] = value.split(',').map(Number)
    if (lat < -90 || lat > 90) {
      return Promise.reject(new Error('纬度必须在-90到90之间'))
    }
    if (lng < -180 || lng > 180) {
      return Promise.reject(new Error('经度必须在-180到180之间'))
    }
    
    return Promise.resolve()
  }

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        buildingTime: initialData.buildingTime ? dayjs(initialData.buildingTime) : undefined,
        completionDate: initialData.completionDate ? dayjs(initialData.completionDate) : undefined,
      })
    } else {
      form.resetFields()
    }
  }, [initialData, form])

  return (
    <Card title={initialData?.id ? '编辑农房信息' : '新增农房记录'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          houseType: HouseType.NEW_BUILD,
          constructionStatus: ConstructionStatus.PLANNED,
          propertyType: PropertyType.RESIDENTIAL,
        }}
      >
        <Row gutter={16}>
          {/* 基础信息 */}
          <Col span={24}>
            <h3 style={{ marginBottom: 16 }}>基础信息</h3>
          </Col>
          
          <Col span={24}>
            <Form.Item
              name="address"
              label="农房地址"
              rules={[
                { required: true, message: '请输入农房地址' },
                { max: 500, message: '地址长度不能超过500字符' }
              ]}
            >
              <Input placeholder="请输入详细地址" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="houseType"
              label="房屋类型"
              rules={[{ required: true, message: '请选择房屋类型' }]}
            >
              <Select placeholder="请选择房屋类型">
                {HOUSE_TYPE_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="constructionStatus"
              label="建设状态"
            >
              <Select placeholder="请选择建设状态">
                {CONSTRUCTION_STATUS_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="propertyType"
              label="属性类型"
            >
              <Select placeholder="请选择属性类型">
                {PROPERTY_TYPE_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* 建筑信息 */}
          <Col span={24}>
            <h3 style={{ marginBottom: 16, marginTop: 24 }}>建筑信息</h3>
          </Col>

          <Col span={8}>
            <Form.Item
              name="floors"
              label="房屋层数"
              rules={[
                { type: 'number', min: 1, max: 10, message: '层数必须在1-10层之间' }
              ]}
            >
              <InputNumber
                placeholder="请输入层数"
                style={{ width: '100%' }}
                min={1}
                max={10}
                addonAfter="层"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="height"
              label="房屋高度"
              rules={[
                { type: 'number', min: 0.1, max: 99.99, message: '高度必须在0.1-99.99米之间' }
              ]}
            >
              <InputNumber
                placeholder="请输入高度"
                style={{ width: '100%' }}
                min={0.1}
                max={99.99}
                step={0.1}
                precision={2}
                addonAfter="米"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="buildingTime"
              label="建筑时间"
            >
              <DatePicker
                placeholder="请选择建筑时间"
                style={{ width: '100%' }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="landArea"
              label="占地面积"
              rules={[
                { type: 'number', min: 0.1, message: '占地面积必须大于0' }
              ]}
            >
              <InputNumber
                placeholder="请输入占地面积"
                style={{ width: '100%' }}
                min={0.1}
                step={0.1}
                precision={2}
                addonAfter="㎡"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="buildingArea"
              label="建筑面积"
              rules={[
                { type: 'number', min: 0.1, message: '建筑面积必须大于0' }
              ]}
            >
              <InputNumber
                placeholder="请输入建筑面积"
                style={{ width: '100%' }}
                min={0.1}
                step={0.1}
                precision={2}
                addonAfter="㎡"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="completionDate"
              label="完工时间"
            >
              <DatePicker
                placeholder="请选择完工时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          {/* 其他信息 */}
          <Col span={24}>
            <h3 style={{ marginBottom: 16, marginTop: 24 }}>其他信息</h3>
          </Col>

          <Col span={12}>
            <Form.Item
              name="approvalNumber"
              label="审批号"
              rules={[
                { max: 100, message: '审批号长度不能超过100字符' }
              ]}
            >
              <Input placeholder="请输入审批号" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="coordinates"
              label="地理坐标"
              rules={[
                { validator: validateCoordinates }
              ]}
            >
              <Input 
                placeholder="请输入坐标，格式：纬度,经度（如：36.0671,120.3826）"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <Row>
          <Col span={24} style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={onCancel}>
                <CloseOutlined />
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting || loading}
              >
                <SaveOutlined />
                {initialData?.id ? '更新' : '创建'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  )
}