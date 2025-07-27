'use client'

import React, { useState, useEffect } from 'react'
import { Badge, Tooltip, Typography } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons'

const { Text } = Typography

interface SystemStatusProps {
  className?: string
}

type SystemHealth = 'healthy' | 'warning' | 'error' | 'loading'

export default function SystemStatus({ className }: SystemStatusProps) {
  const [status, setStatus] = useState<SystemHealth>('loading')
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  // 检查系统状态
  const checkSystemHealth = async () => {
    try {
      setStatus('loading')
      
      // 模拟系统健康检查API调用
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data.status === 'healthy' ? 'healthy' : 'warning')
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
    } finally {
      setLastCheck(new Date())
    }
  }

  // 定期检查系统状态
  useEffect(() => {
    checkSystemHealth()
    
    const interval = setInterval(checkSystemHealth, 60000) // 每分钟检查一次
    
    return () => clearInterval(interval)
  }, [])

  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          color: 'green',
          icon: <CheckCircleOutlined className="text-green-500" />,
          text: '系统正常',
          description: '所有服务运行正常'
        }
      case 'warning':
        return {
          color: 'orange',
          icon: <ExclamationCircleOutlined className="text-orange-500" />,
          text: '系统警告',
          description: '部分服务存在异常'
        }
      case 'error':
        return {
          color: 'red',
          icon: <ExclamationCircleOutlined className="text-red-500" />,
          text: '系统异常',
          description: '系统服务不可用'
        }
      case 'loading':
      default:
        return {
          color: 'blue',
          icon: <LoadingOutlined className="text-blue-500" />,
          text: '检查中',
          description: '正在检查系统状态'
        }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Tooltip 
        title={
          <div>
            <div>{statusConfig.description}</div>
            <div className="text-xs mt-1">
              最后检查: {lastCheck.toLocaleTimeString()}
            </div>
          </div>
        }
      >
        <Badge 
          color={statusConfig.color} 
          className="cursor-pointer"
          onClick={checkSystemHealth}
        >
          <div className="flex items-center space-x-1">
            {statusConfig.icon}
            <Text className="text-xs text-gray-500 hidden lg:inline">
              {statusConfig.text}
            </Text>
          </div>
        </Badge>
      </Tooltip>
    </div>
  )
}