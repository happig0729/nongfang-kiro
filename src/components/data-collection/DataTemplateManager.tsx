import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Switch, Tag, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, CopyOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { UserRole } from '@/lib/permissions'

const { Option } = Select
const { TextArea } = Input

interface DataTemplateManagerProps {
  currentUser: {
    id: string
    role: UserRole
    regionCode: string
    realName: string
  }
}

interface DataTemplate {
  id: string
  name: string
  type: string
  description: string
  fields: TemplateField[]
  isActive: boolean
  usageCount: number
  createdAt: string
  createdBy: string
}

interface TemplateField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox'
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  placeholder?: string
  defaultValue?: any
}

export default function DataTemplateManager({ currentUser }: DataTemplateManagerProps) {
  const [templates, setTemplates] = useState<DataTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DataTemplate | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data-collection/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('获取模板列表失败:', error)
      message.error('获取模板列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    form.resetFields()
    form.setFieldsValue({
      fields: [
        {
          name: 'address',
          label: '农房地址',
          type: 'text',
          required: true,
          placeholder: '请输入农房地址'
        }
      ]
    })
    setIsModalVisible(true)
  }

  const handleEditTemplate = (template: DataTemplate) => {
    setEditingTemplate(template)
    form.setFieldsValue(template)
    setIsModalVisible(true)
  }

  const handleCopyTemplate = async (template: DataTemplate) => {
    try {
      const response = await fetch('/api/data-collection/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...template,
          name: `${template.name} - 副本`,
          id: undefined,
          usageCount: 0
        })
      })

      if (response.ok) {
        message.success('模板复制成功')
        fetchTemplates()
      } else {
        throw new Error('复制失败')
      }
    } catch (error) {
      message.error('复制失败')
    }
  }

  const handleDeleteTemplate = async (template: DataTemplate) => {
    try {
      const response = await fetch(`/api/data-collection/templates/${template.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        message.success('删除成功')
        fetchTemplates()
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const url = editingTemplate 
        ? `/api/data-collection/templates/${editingTemplate.id}`
        : '/api/data-collection/templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(values)
      })

      if (response.ok) {
        message.success(editingTemplate ? '更新成功' : '创建成功')
        setIsModalVisible(false)
        fetchTemplates()
      } else {
        throw new Error('操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DataTemplate) => (
        <div>
          <div className="font-medium">{name}</div>
          {record.description && (
            <div className="text-sm text-gray-500">{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: '模板类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          'house_basic': { label: '农房基础信息', color: 'blue' },
          'house_construction': { label: '建设过程信息', color: 'green' },
          'craftsman_info': { label: '工匠信息', color: 'orange' },
          'inspection_record': { label: '检查记录', color: 'purple' },
          'training_record': { label: '培训记录', color: 'cyan' }
        }
        const typeInfo = typeMap[type] || { label: type, color: 'default' }
        return <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
      }
    },
    {
      title: '字段数量',
      dataIndex: 'fields',
      key: 'fieldCount',
      render: (fields: TemplateField[]) => (
        <span className="text-blue-600">{fields?.length || 0} 个字段</span>
      )
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      render: (count: number) => (
        <span className={count > 0 ? 'text-green-600' : 'text-gray-500'}>
          {count} 次
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: DataTemplate) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewTemplate(record)}
            size="small"
          >
            预览
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopyTemplate(record)}
            size="small"
          >
            复制
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除模板"${record.name}"吗？${record.usageCount > 0 ? '该模板已被使用，删除后可能影响相关功能。' : ''}`}
            onConfirm={() => handleDeleteTemplate(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              size="small"
              disabled={record.usageCount > 0}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const handleViewTemplate = (template: DataTemplate) => {
    Modal.info({
      title: `模板预览 - ${template.name}`,
      width: 800,
      content: (
        <div className="mt-4">
          <div className="mb-4">
            <strong>描述：</strong>{template.description || '无'}
          </div>
          <div className="mb-4">
            <strong>字段配置：</strong>
          </div>
          <div className="space-y-2">
            {template.fields?.map((field, index) => (
              <div key={index} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    <div className="text-sm text-gray-500">
                      字段名: {field.name} | 类型: {field.type}
                    </div>
                    {field.placeholder && (
                      <div className="text-sm text-gray-400">
                        占位符: {field.placeholder}
                      </div>
                    )}
                  </div>
                  <Tag size="small">{field.type}</Tag>
                </div>
                {field.options && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">选项: </span>
                    {field.options.map((option, optIndex) => (
                      <Tag key={optIndex} size="small" className="mr-1">
                        {option}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    })
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">数据模板管理</h3>
          <p className="text-gray-600">管理数据填报模板，定义表单字段和验证规则</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateTemplate}
        >
          新建模板
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个模板`
        }}
      />

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="模板类型"
            rules={[{ required: true, message: '请选择模板类型' }]}
          >
            <Select placeholder="请选择模板类型">
              <Option value="house_basic">农房基础信息</Option>
              <Option value="house_construction">建设过程信息</Option>
              <Option value="craftsman_info">工匠信息</Option>
              <Option value="inspection_record">检查记录</Option>
              <Option value="training_record">培训记录</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="模板描述"
          >
            <TextArea 
              placeholder="请输入模板描述" 
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <div className="text-center">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTemplate ? '更新' : '创建'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  )
}