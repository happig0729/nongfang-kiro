import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Switch, message, Tag } from 'antd'
import { PlusOutlined, EditOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons'

interface VillagePortal {
  id: string
  villageName: string
  villageCode: string
  regionCode: string
  portalUrl: string
  isActive: boolean
  dataTemplates: string[]
  permissions: string[]
  createdAt: string
  usageCount?: number
}

const DATA_TEMPLATES = [
  { value: 'house_basic', label: '农房基础信息' },
  { value: 'house_construction', label: '建设过程信息' },
  { value: 'craftsman_info', label: '工匠信息' },
  { value: 'inspection_record', label: '检查记录' },
  { value: 'training_record', label: '培训记录' },
]

const REGION_OPTIONS = [
  { value: '370200', label: '青岛市市南区' },
  { value: '370201', label: '青岛市市北区' },
  { value: '370202', label: '青岛市李沧区' },
  { value: '370203', label: '青岛市崂山区' },
  { value: '370204', label: '青岛市城阳区' },
  { value: '370205', label: '青岛市即墨区' },
  { value: '370206', label: '青岛市胶州市' },
]

interface VillagePortalConfigProps {
  currentUser: {
    id: string
    role: string
    regionCode: string
    realName: string
  }
}

export default function VillagePortalConfig({ currentUser }: VillagePortalConfigProps) {
  const [villages, setVillages] = useState<VillagePortal[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingVillage, setEditingVillage] = useState<VillagePortal | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchVillages()
  }, [])

  const fetchVillages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data-collection/villages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setVillages(result.data || [])
      } else {
        message.error('获取村庄列表失败')
      }
    } catch (error) {
      console.error('获取村庄列表失败:', error)
      message.error('获取村庄列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePortal = () => {
    setEditingVillage(null)
    form.resetFields()
    form.setFieldsValue({
      isActive: true,
      dataTemplates: ['house_basic'],
    })
    setIsModalVisible(true)
  }

  const handleEditPortal = (village: VillagePortal) => {
    setEditingVillage(village)
    form.setFieldsValue({
      ...village,
      dataTemplates: village.dataTemplates || ['house_basic'],
    })
    setIsModalVisible(true)
  }

  const handleDeletePortal = (village: VillagePortal) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除村庄"${village.villageName}"的填报端口吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          const response = await fetch(`/api/data-collection/villages/${village.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          })

          if (response.ok) {
            message.success('删除成功')
            fetchVillages()
          } else {
            message.error('删除失败')
          }
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async (values: any) => {
    try {
      const url = editingVillage 
        ? `/api/data-collection/villages/${editingVillage.id}`
        : '/api/data-collection/villages'
      
      const method = editingVillage ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(values)
      })

      if (response.ok) {
        message.success(editingVillage ? '更新成功' : '创建成功')
        setIsModalVisible(false)
        fetchVillages()
      } else {
        const result = await response.json()
        message.error(result.message || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleConfigureTemplate = (village: VillagePortal) => {
    // TODO: 实现模板配置功能
    message.info('模板配置功能开发中')
  }

  const columns = [
    {
      title: '村庄名称',
      dataIndex: 'villageName',
      key: 'villageName',
      width: 150,
    },
    {
      title: '村庄代码',
      dataIndex: 'villageCode',
      key: 'villageCode',
      width: 120,
    },
    {
      title: '所属区域',
      dataIndex: 'regionCode',
      key: 'regionCode',
      width: 150,
      render: (regionCode: string) => {
        const region = REGION_OPTIONS.find(r => r.value === regionCode)
        return region?.label || regionCode
      }
    },
    {
      title: '数据模板',
      dataIndex: 'dataTemplates',
      key: 'dataTemplates',
      width: 200,
      render: (templates: string[]) => (
        <div>
          {templates?.map(template => {
            const templateInfo = DATA_TEMPLATES.find(t => t.value === template)
            return (
              <Tag key={template} size="small" style={{ marginBottom: 4 }}>
                {templateInfo?.label || template}
              </Tag>
            )
          })}
        </div>
      ),
    },
    {
      title: '填报入口',
      dataIndex: 'portalUrl',
      key: 'portalUrl',
      width: 200,
      render: (url: string, record: VillagePortal) => {
        const fullUrl = `${window.location.origin}/data-collection/village/${record.villageCode}`
        return (
          <a href={fullUrl} target="_blank" rel="noopener noreferrer">
            {fullUrl}
          </a>
        )
      },
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      render: (count: number) => count || 0,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: VillagePortal) => (
        <div>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditPortal(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => handleConfigureTemplate(record)}
            size="small"
          >
            配置
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePortal(record)}
            danger
            size="small"
          >
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card title="村庄数据填报端口管理">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreatePortal}
        >
          新建填报端口
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={villages}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingVillage ? '编辑填报端口' : '新建填报端口'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="villageName"
            label="村庄名称"
            rules={[{ required: true, message: '请输入村庄名称' }]}
          >
            <Input placeholder="请输入村庄名称" />
          </Form.Item>

          <Form.Item
            name="villageCode"
            label="村庄代码"
            rules={[
              { required: true, message: '请输入村庄代码' },
              { pattern: /^[0-9]{6,12}$/, message: '村庄代码格式不正确' }
            ]}
          >
            <Input placeholder="请输入村庄代码（6-12位数字）" />
          </Form.Item>

          <Form.Item
            name="regionCode"
            label="所属区域"
            rules={[{ required: true, message: '请选择所属区域' }]}
          >
            <Select placeholder="请选择所属区域">
              {REGION_OPTIONS.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dataTemplates"
            label="数据模板"
            rules={[{ required: true, message: '请选择数据模板' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择数据模板"
            >
              {DATA_TEMPLATES.map(template => (
                <Select.Option key={template.value} value={template.value}>
                  {template.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" style={{ marginLeft: 8 }}>
                {editingVillage ? '更新' : '创建'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}