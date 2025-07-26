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
  Card,
  Tag,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const { Option } = Select
const { TextArea } = Input

interface Team {
  id: string
  name: string
  teamType: string
}

interface CraftsmanFormProps {
  craftsman?: any
  onSuccess: () => void
  onCancel: () => void
}

// 专业技能选项
const SPECIALTY_OPTIONS = [
  '砌筑工',
  '混凝土工',
  '钢筋工',
  '架子工',
  '防水工',
  '抹灰工',
  '油漆工',
  '木工',
  '电工',
  '水暖工',
  '瓦工',
  '装修工',
  '屋面工',
  '地面工',
  '门窗工',
]

export default function CraftsmanForm({ craftsman, onSuccess, onCancel }: CraftsmanFormProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [customSpecialty, setCustomSpecialty] = useState('')

  // 获取团队列表
  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        setTeams(result.data.teams)
      } else {
        console.error('Failed to fetch teams:', result.message)
      }
    } catch (error) {
      console.error('Fetch teams error:', error)
    }
  }

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const url = craftsman ? `/api/craftsmen/${craftsman.id}` : '/api/craftsmen'
      const method = craftsman ? 'PUT' : 'POST'

      // 处理数据
      const submitData = {
        ...values,
        specialties: values.specialties || [],
        teamId: values.teamId || null,
        emergencyContact: values.emergencyContact || null,
        emergencyPhone: values.emergencyPhone || null,
        address: values.address || null,
      }

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
        message.success(craftsman ? '工匠信息更新成功' : '工匠创建成功')
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

  // 添加自定义专业技能
  const handleAddCustomSpecialty = () => {
    if (customSpecialty.trim()) {
      const currentSpecialties = form.getFieldValue('specialties') || []
      if (!currentSpecialties.includes(customSpecialty.trim())) {
        form.setFieldsValue({
          specialties: [...currentSpecialties, customSpecialty.trim()]
        })
      }
      setCustomSpecialty('')
    }
  }

  // 获取团队类型显示名称
  const getTeamTypeName = (type: string) => {
    const names = {
      CONSTRUCTION_TEAM: '施工班组',
      COOPERATIVE: '合作社',
      PARTNERSHIP: '合伙制企业',
    }
    return names[type as keyof typeof names] || type
  }

  // 初始化数据
  useEffect(() => {
    fetchTeams()

    if (craftsman) {
      form.setFieldsValue({
        name: craftsman.name,
        phone: craftsman.phone,
        specialties: craftsman.specialties,
        skillLevel: craftsman.skillLevel,
        certificationLevel: craftsman.certificationLevel,
        teamId: craftsman.team?.id,
        address: craftsman.address,
        emergencyContact: craftsman.emergencyContact,
        emergencyPhone: craftsman.emergencyPhone,
        status: craftsman.status,
      })
    } else {
      // 新增时设置默认值
      const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}')
      form.setFieldsValue({
        regionCode: currentUser.regionCode,
        regionName: currentUser.regionName,
        skillLevel: 'BEGINNER',
        status: 'ACTIVE',
      })
    }
  }, [craftsman, form])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        skillLevel: 'BEGINNER',
        status: 'ACTIVE',
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="姓名"
            rules={[
              { required: true, message: '请输入姓名' },
              { max: 100, message: '姓名长度不能超过100字符' },
            ]}
          >
            <Input placeholder="请输入工匠姓名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Col>
      </Row>

      {!craftsman && (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="idNumber"
              label="身份证号"
              rules={[
                { required: true, message: '请输入身份证号' },
                { pattern: /^\d{17}[\dX]$/, message: '身份证号格式不正确' },
              ]}
            >
              <Input placeholder="请输入18位身份证号" />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="specialties"
            label="专业技能"
            rules={[{ required: true, message: '请选择至少一项专业技能' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择专业技能"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                    <Input.Group compact>
                      <Input
                        style={{ width: 'calc(100% - 32px)' }}
                        placeholder="输入自定义技能"
                        value={customSpecialty}
                        onChange={(e) => setCustomSpecialty(e.target.value)}
                        onPressEnter={handleAddCustomSpecialty}
                      />
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddCustomSpecialty}
                      />
                    </Input.Group>
                  </div>
                </>
              )}
            >
              {SPECIALTY_OPTIONS.map((specialty) => (
                <Option key={specialty} value={specialty}>
                  {specialty}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="skillLevel"
            label="技能等级"
            rules={[{ required: true, message: '请选择技能等级' }]}
          >
            <Select placeholder="请选择技能等级">
              <Option value="BEGINNER">初级</Option>
              <Option value="INTERMEDIATE">中级</Option>
              <Option value="ADVANCED">高级</Option>
              <Option value="EXPERT">专家级</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="certificationLevel" label="认证等级">
            <Select placeholder="请选择认证等级" allowClear>
              <Option value="LEVEL_1">一级</Option>
              <Option value="LEVEL_2">二级</Option>
              <Option value="LEVEL_3">三级</Option>
              <Option value="LEVEL_4">四级</Option>
              <Option value="LEVEL_5">五级</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="teamId" label="所属团队">
            <Select placeholder="请选择团队" allowClear>
              {teams.map((team) => (
                <Option key={team.id} value={team.id}>
                  <Space>
                    {team.name}
                    <Tag size="small">{getTeamTypeName(team.teamType)}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="address"
            label="联系地址"
            rules={[{ max: 500, message: '地址长度不能超过500字符' }]}
          >
            <TextArea
              rows={2}
              placeholder="请输入联系地址"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="emergencyContact"
            label="紧急联系人"
            rules={[{ max: 100, message: '联系人姓名长度不能超过100字符' }]}
          >
            <Input placeholder="请输入紧急联系人姓名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="emergencyPhone"
            label="紧急联系电话"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input placeholder="请输入紧急联系人电话" />
          </Form.Item>
        </Col>
      </Row>

      {craftsman && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value="ACTIVE">活跃</Option>
                <Option value="INACTIVE">不活跃</Option>
                <Option value="SUSPENDED">暂停</Option>
                <Option value="RETIRED">退休</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}

      {!craftsman && (
        <>
          <Form.Item name="regionCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="regionName" hidden>
            <Input />
          </Form.Item>
        </>
      )}

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {craftsman ? '更新' : '创建'}
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}