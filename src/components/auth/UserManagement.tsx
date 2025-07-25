'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message,
  Card,
  Typography,
  Popconfirm
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { getRoleDisplayName } from '@/lib/permissions'

const { Title } = Typography
const { Option } = Select

interface User {
  id: string
  username: string
  realName: string
  phone?: string
  email?: string
  role: string
  regionCode: string
  regionName: string
  status: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

interface UserManagementProps {
  token: string
  currentUser: any
}

export default function UserManagement({ token, currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  // 用户角色选项
  const roleOptions = [
    { value: 'SUPER_ADMIN', label: '超级管理员' },
    { value: 'CITY_ADMIN', label: '市级管理员' },
    { value: 'DISTRICT_ADMIN', label: '区市管理员' },
    { value: 'TOWN_ADMIN', label: '镇街管理员' },
    { value: 'VILLAGE_ADMIN', label: '村级管理员' },
    { value: 'CRAFTSMAN', label: '工匠' },
    { value: 'FARMER', label: '农户' },
    { value: 'INSPECTOR', label: '检查员' }
  ]

  // 用户状态选项
  const statusOptions = [
    { value: 'ACTIVE', label: '活跃', color: 'green' },
    { value: 'INACTIVE', label: '不活跃', color: 'orange' },
    { value: 'SUSPENDED', label: '暂停', color: 'red' }
  ]

  // 获取用户列表
  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/users?page=${page}&limit=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const result = await response.json()

      if (response.ok) {
        setUsers(result.data.users)
        setPagination({
          current: result.data.pagination.page,
          pageSize: result.data.pagination.limit,
          total: result.data.pagination.total
        })
      } else {
        message.error(result.message || '获取用户列表失败')
      }
    } catch (error) {
      console.error('Fetch users error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 创建用户
  const handleCreateUser = async (values: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      })

      const result = await response.json()

      if (response.ok) {
        message.success('用户创建成功')
        setModalVisible(false)
        form.resetFields()
        fetchUsers(pagination.current, pagination.pageSize)
      } else {
        message.error(result.message || '用户创建失败')
      }
    } catch (error) {
      console.error('Create user error:', error)
      message.error('网络错误，请稍后重试')
    }
  }

  // 重置密码
  const handleResetPassword = async (username: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          newPassword: '123456'
        })
      })

      const result = await response.json()

      if (response.ok) {
        message.success('密码重置成功，新密码为：123456')
      } else {
        message.error(result.message || '密码重置失败')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      message.error('网络错误，请稍后重试')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color="blue">{getRoleDisplayName(role as any)}</Tag>
      )
    },
    {
      title: '区域',
      dataIndex: 'regionName',
      key: 'regionName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusOption = statusOptions.find(opt => opt.value === status)
        return (
          <Tag color={statusOption?.color || 'default'}>
            {statusOption?.label || status}
          </Tag>
        )
      }
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : '从未登录'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleResetPassword(record.username)}
          >
            重置密码
          </Button>
        </Space>
      ),
    },
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={3}>用户管理</Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchUsers(pagination.current, pagination.pageSize)}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingUser(null)
                setModalVisible(true)
                form.resetFields()
              }}
            >
              新增用户
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              fetchUsers(page, pageSize)
            }
          }}
        />
      </Card>

      {/* 新增/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
          initialValues={editingUser || {}}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, max: 50, message: '用户名长度为2-50个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: !editingUser, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[
              { required: true, message: '请输入真实姓名' },
              { max: 100, message: '姓名长度不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入正确的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="regionCode"
            label="区域代码"
            rules={[
              { required: true, message: '请输入区域代码' },
              { max: 20, message: '区域代码不能超过20个字符' }
            ]}
          >
            <Input placeholder="请输入区域代码" />
          </Form.Item>

          <Form.Item
            name="regionName"
            label="区域名称"
            rules={[
              { required: true, message: '请输入区域名称' },
              { max: 100, message: '区域名称不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入区域名称" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}