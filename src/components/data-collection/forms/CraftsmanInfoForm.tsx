import React, { useEffect, useState } from 'react'
import { Form, Input, Select, Row, Col, Card, Button, Tag, message } from 'antd'
import { UserOutlined, TeamOutlined, StarOutlined, PlusOutlined } from '@ant-design/icons'

const { Option } = Select
const { TextArea } = Input

interface CraftsmanInfoFormProps {
  data: any
  onNext: (data: any) => void
  isFirst: boolean
  isLast: boolean
}

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: '初级', color: 'default' },
  { value: 'INTERMEDIATE', label: '中级', color: 'blue' },
  { value: 'ADVANCED', label: '高级', color: 'green' },
  { value: 'EXPERT', label: '专家级', color: 'gold' },
]

const SPECIALTY_OPTIONS = [
  '砌筑工', '混凝土工', '钢筋工', '架子工', '防水工',
  '抹灰工', '油漆工', '木工', '电工', '水暖工',
  '瓦工', '装修工', '屋面工', '地面工', '门窗工'
]

const TEAM_TYPES = [
  { value: 'CONSTRUCTION_TEAM', label: '施工班组' },
  { value: 'COOPERATIVE', label: '合作社' },
  { value: 'PARTNERSHIP', label: '合伙制企业' },
]

export default function CraftsmanInfoForm({ data, onNext, isFirst, isLast }: CraftsmanInfoFormProps) {
  const [form] = Form.useForm()
  const [craftsmen, setCraftsmen] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCraftsmen()
    fetchTeams()
  }, [])

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data)
    }
  }, [data, form])

  const fetchCraftsmen = async () => {
    try {
      const response = await fetch('/api/craftsmen?pageSize=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setCraftsmen(result.data.craftsmen || [])
      }
    } catch (error) {
      console.error('获取工匠列表失败:', error)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setTeams(result.data || [])
      }
    } catch (error) {
      console.error('获取团队列表失败:', error)
    }
  }

  const handleSubmit = (values: any) => {
    onNext(values)
  }

  const handleAddCustomSpecialty = () => {
    if (customSpecialty.trim()) {
      const currentSpecialties = form.getFieldValue('specialties') || []
      if (!currentSpecialties.includes(customSpecialty.trim())) {
        form.setFieldsValue({
          specialties: [...currentSpecialties, customSpecialty.trim()]
        })
        setCustomSpecialty('')
        message.success('自定义技能已添加')
      } else {
        message.warning('该技能已存在')
      }
    }
  }

  const handleCreateNewCraftsman = () => {
    // 清空工匠选择，显示新建工匠表单
    form.setFieldsValue({
      craftsmanId: undefined,
      isNewCraftsman: true,
    })
  }

  const handleSelectExistingCraftsman = (craftsmanId: string) => {
    const craftsman = craftsmen.find(c => c.id === craftsmanId)
    if (craftsman) {
      form.setFieldsValue({
        craftsmanId,
        craftsmanName: craftsman.name,
        craftsmanPhone: craftsman.phone,
        craftsmanIdNumber: craftsman.idNumber,
        specialties: craftsman.specialties,
        skillLevel: craftsman.skillLevel,
        teamId: craftsman.teamId,
        isNewCraftsman: false,
      })
    }
  }

  const isNewCraftsman = Form.useWatch('isNewCraftsman', form)
  const selectedCraftsmanId = Form.useWatch('craftsmanId', form)

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        isNewCraftsman: false,
        skillLevel: 'INTERMEDIATE',
      }}
    >
      <Card title={<><UserOutlined /> 工匠信息</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="工匠选择">
              <div style={{ marginBottom: 16 }}>
                <Button 
                  type={!isNewCraftsman ? 'primary' : 'default'}
                  onClick={() => form.setFieldsValue({ isNewCraftsman: false })}
                  style={{ marginRight: 8 }}
                >
                  选择现有工匠
                </Button>
                <Button 
                  type={isNewCraftsman ? 'primary' : 'default'}
                  onClick={handleCreateNewCraftsman}
                >
                  新建工匠
                </Button>
              </div>
            </Form.Item>
          </Col>
        </Row>

        {!isNewCraftsman && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="craftsmanId"
                label="选择工匠"
                rules={[{ required: true, message: '请选择工匠' }]}
              >
                <Select
                  placeholder="请选择工匠"
                  showSearch
                  filterOption={(input, option) =>
                    option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={handleSelectExistingCraftsman}
                >
                  {craftsmen.map(craftsman => (
                    <Option key={craftsman.id} value={craftsman.id}>
                      {craftsman.name} - {craftsman.phone} 
                      {craftsman.specialties?.length > 0 && (
                        <span style={{ color: '#666', marginLeft: 8 }}>
                          ({craftsman.specialties.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        {(isNewCraftsman || selectedCraftsmanId) && (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="craftsmanName"
                  label="工匠姓名"
                  rules={[
                    { required: true, message: '请输入工匠姓名' },
                    { max: 100, message: '姓名长度不能超过100字符' }
                  ]}
                >
                  <Input 
                    placeholder="请输入工匠姓名"
                    disabled={!isNewCraftsman}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="craftsmanPhone"
                  label="联系电话"
                  rules={[
                    { required: true, message: '请输入联系电话' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
                  ]}
                >
                  <Input 
                    placeholder="请输入手机号码"
                    disabled={!isNewCraftsman}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="craftsmanIdNumber"
                  label="身份证号"
                  rules={[
                    { required: isNewCraftsman, message: '请输入身份证号' },
                    { pattern: /^\d{17}[\dX]$/, message: '请输入正确的身份证号码' }
                  ]}
                >
                  <Input 
                    placeholder="请输入身份证号码"
                    disabled={!isNewCraftsman}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="specialties"
                  label="专业技能"
                  rules={[{ required: true, message: '请选择至少一项专业技能' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择专业技能"
                    disabled={!isNewCraftsman}
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        {isNewCraftsman && (
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
                        )}
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

              <Col span={12}>
                <Form.Item
                  name="skillLevel"
                  label="技能等级"
                  rules={[{ required: true, message: '请选择技能等级' }]}
                >
                  <Select 
                    placeholder="请选择技能等级"
                    disabled={!isNewCraftsman}
                  >
                    {SKILL_LEVELS.map(level => (
                      <Option key={level.value} value={level.value}>
                        <Tag color={level.color}>{level.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Card>

      <Card title={<><TeamOutlined /> 团队信息</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="teamId"
              label="所属团队"
            >
              <Select
                placeholder="请选择所属团队（可选）"
                allowClear
                disabled={!isNewCraftsman}
              >
                {teams.map(team => (
                  <Option key={team.id} value={team.id}>
                    {team.name} ({TEAM_TYPES.find(t => t.value === team.teamType)?.label})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="workRole"
              label="工作角色"
            >
              <Select placeholder="请选择工作角色（可选）">
                <Option value="LEADER">负责人</Option>
                <Option value="MEMBER">成员</Option>
                <Option value="SUPERVISOR">监督员</Option>
                <Option value="TECHNICIAN">技术员</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={<><StarOutlined /> 工作安排</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="workDescription"
              label="工作内容描述"
              rules={[
                { max: 1000, message: '工作描述长度不能超过1000字符' }
              ]}
            >
              <TextArea 
                rows={4}
                placeholder="请描述工匠在本项目中的具体工作内容和职责"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="expectedDuration"
              label="预计工期（天）"
              rules={[
                { type: 'number', min: 1, max: 365, message: '工期应在1-365天之间' }
              ]}
            >
              <Input
                type="number"
                placeholder="请输入预计工期"
                addonAfter="天"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="dailyWage"
              label="日工资（元）"
              rules={[
                { type: 'number', min: 0, max: 9999, message: '日工资应在0-9999元之间' }
              ]}
            >
              <Input
                type="number"
                placeholder="请输入日工资"
                addonAfter="元"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="specialRequirements"
              label="特殊要求"
              rules={[
                { max: 500, message: '特殊要求描述长度不能超过500字符' }
              ]}
            >
              <TextArea 
                rows={3}
                placeholder="请描述对工匠的特殊要求或注意事项"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Form.Item name="isNewCraftsman" hidden>
        <Input />
      </Form.Item>
    </Form>
  )
}