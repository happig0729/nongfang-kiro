'use client'

import { useState } from 'react'
import { Button, Form, Input, message, Card, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'

const { Title } = Typography

interface LoginFormData {
  username: string
  password: string
}

interface LoginFormProps {
  onLogin?: (token: string, user: any) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (response.ok) {
        message.success('登录成功')
        
        // 保存token到localStorage
        localStorage.setItem('auth_token', result.data.token)
        localStorage.setItem('user_info', JSON.stringify(result.data.user))
        
        // 调用回调函数
        if (onLogin) {
          onLogin(result.data.token, result.data.user)
        }
      } else {
        message.error(result.message || '登录失败')
      }
    } catch (error) {
      console.error('Login error:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Title level={2} className="text-blue-600">
            青岛市农房建设管理平台
          </Title>
          <p className="text-gray-600">乡村建设工匠培训信息系统</p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名至少2个字符' },
              { max: 50, message: '用户名不能超过50个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>测试账户：</p>
          <p>管理员 - 用户名: admin, 密码: admin123456</p>
          <p>工匠 - 用户名: craftsman001, 密码: 123456</p>
        </div>
      </Card>
    </div>
  )
}