import React, { useEffect } from 'react'
import { Form, Input, Select, InputNumber, DatePicker, Row, Col, Card } from 'antd'
import { HomeOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

interface HouseBasicFormProps {
  data: any
  onNext: (data: any) => void
  isFirst: boolean
  isLast: boolean
}

const HOUSE_TYPES = [
  { value: 'RURAL_HOUSE', label: '农村住宅' },
  { value: 'COMMERCIAL', label: '商业用房' },
  { value: 'MIXED_USE', label: '商住混合' },
  { value: 'OTHER', label: '其他' },
]

const CONSTRUCTION_STATUS = [
  { value: 'PLANNING', label: '规划中' },
  { value: 'APPROVED', label: '已审批' },
  { value: 'UNDER_CONSTRUCTION', label: '建设中' },
  { value: 'COMPLETED', label: '已完工' },
  { value: 'SUSPENDED', label: '暂停施工' },
]

export default function HouseBasicForm({ data, onNext, isFirst, isLast }: HouseBasicFormProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        ...data,
        buildingTime: data.buildingTime ? dayjs(data.buildingTime) : undefined,
        completionTime: data.completionTime ? dayjs(data.completionTime) : undefined,
      })
    }
  }, [data, form])

  const handleSubmit = (values: any) => {
    const processedValues = {
      ...values,
      buildingTime: values.buildingTime ? values.buildingTime.format('YYYY-MM-DD') : undefined,
      completionTime: values.completionTime ? values.completionTime.format('YYYY-MM-DD') : undefined,
    }
    onNext(processedValues)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        houseType: 'RURAL_HOUSE',
        constructionStatus: 'PLANNING',
        floors: 2,
      }}
    >
      <Card title={<><HomeOutlined /> 农房基础信息</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="address"
              label="农房地址"
              rules={[
                { required: true, message: '请输入农房地址' },
                { max: 500, message: '地址长度不能超过500字符' }
              ]}
            >
              <Input 
                prefix={<EnvironmentOutlined />}
                placeholder="请输入详细的农房地址"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="houseType"
              label="房屋类型"
              rules={[{ required: true, message: '请选择房屋类型' }]}
            >
              <Select placeholder="请选择房屋类型">
                {HOUSE_TYPES.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="constructionStatus"
              label="建设状态"
              rules={[{ required: true, message: '请选择建设状态' }]}
            >
              <Select placeholder="请选择建设状态">
                {CONSTRUCTION_STATUS.map(status => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="floors"
              label="房屋层数"
              rules={[
                { type: 'number', min: 1, max: 10, message: '房屋层数应在1-10层之间' }
              ]}
            >
              <InputNumber
                min={1}
                max={10}
                placeholder="层数"
                style={{ width: '100%' }}
                addonAfter="层"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="height"
              label="房屋高度"
              rules={[
                { type: 'number', min: 0.1, max: 99.99, message: '房屋高度应在0.1-99.99米之间' }
              ]}
            >
              <InputNumber
                min={0.1}
                max={99.99}
                step={0.1}
                precision={2}
                placeholder="高度"
                style={{ width: '100%' }}
                addonAfter="米"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="area"
              label="建筑面积"
              rules={[
                { type: 'number', min: 1, max: 9999.99, message: '建筑面积应在1-9999.99平方米之间' }
              ]}
            >
              <InputNumber
                min={1}
                max={9999.99}
                step={0.01}
                precision={2}
                placeholder="面积"
                style={{ width: '100%' }}
                addonAfter="㎡"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="landArea"
              label="占地面积"
              rules={[
                { type: 'number', min: 1, max: 9999.99, message: '占地面积应在1-9999.99平方米之间' }
              ]}
            >
              <InputNumber
                min={1}
                max={9999.99}
                step={0.01}
                precision={2}
                placeholder="占地面积"
                style={{ width: '100%' }}
                addonAfter="㎡"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
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

          <Col span={12}>
            <Form.Item
              name="completionTime"
              label="完工时间"
            >
              <DatePicker
                placeholder="请选择完工时间"
                style={{ width: '100%' }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={<><UserOutlined /> 申请人信息</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="applicantName"
              label="申请人姓名"
              rules={[
                { required: true, message: '请输入申请人姓名' },
                { max: 100, message: '姓名长度不能超过100字符' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />}
                placeholder="请输入申请人姓名"
                maxLength={100}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="phone"
              label="联系电话"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined />}
                placeholder="请输入手机号码"
                maxLength={11}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="idNumber"
              label="身份证号"
              rules={[
                { pattern: /^\d{17}[\dX]$/, message: '请输入正确的身份证号码' }
              ]}
            >
              <Input 
                placeholder="请输入身份证号码"
                maxLength={18}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="applicantAddress"
              label="申请人地址"
              rules={[
                { max: 500, message: '地址长度不能超过500字符' }
              ]}
            >
              <Input 
                placeholder="请输入申请人详细地址"
                maxLength={500}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="其他信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="coordinates"
              label="地理坐标"
              extra="格式：纬度,经度（如：36.307,120.071）"
              rules={[
                { 
                  pattern: /^-?\d+\.?\d*,-?\d+\.?\d*$/, 
                  message: '坐标格式不正确，应为：纬度,经度' 
                }
              ]}
            >
              <Input 
                placeholder="请输入地理坐标（可选）"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="remarks"
              label="备注信息"
              rules={[
                { max: 1000, message: '备注长度不能超过1000字符' }
              ]}
            >
              <TextArea 
                rows={4}
                placeholder="请输入备注信息（可选）"
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