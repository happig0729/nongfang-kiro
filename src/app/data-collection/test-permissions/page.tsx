'use client'

import React, { useEffect, useState } from 'react'
import { Card, Descriptions, Tag, Button } from 'antd'

export default function TestPermissionsPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>({})
  const [villages, setVillages] = useState<any[]>([])

  useEffect(() => {
    fetchUserInfo()
    fetchVillages()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setUserInfo(result.data.user)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const fetchVillages = async () => {
    try {
      const response = await fetch('/api/data-collection/villages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setVillages(result.data || [])
      }
    } catch (error) {
      console.error('获取村庄列表失败:', error)
    }
  }

  const testPermissions = async () => {
    const tests = [
      { name: '获取村庄列表', url: '/api/data-collection/villages', method: 'GET' },
      { name: '创建村庄', url: '/api/data-collection/villages', method: 'POST', body: {
        villageName: '测试村庄',
        villageCode: '370200001',
        regionCode: '370200',
        dataTemplates: ['house_basic'],
        isActive: true
      }},
    ]

    const results = {}
    
    for (const test of tests) {
      try {
        const response = await fetch(test.url, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: test.body ? JSON.stringify(test.body) : undefined
        })
        
        results[test.name] = {
          status: response.status,
          success: response.ok,
          message: response.ok ? '成功' : `失败 (${response.status})`
        }
      } catch (error) {
        results[test.name] = {
          status: 0,
          success: false,
          message: '网络错误'
        }
      }
    }
    
    setTestResults(results)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card title="权限测试页面" style={{ marginBottom: 16 }}>
        <Descriptions title="当前用户信息" bordered>
          <Descriptions.Item label="用户名">{userInfo?.username}</Descriptions.Item>
          <Descriptions.Item label="真实姓名">{userInfo?.realName}</Descriptions.Item>
          <Descriptions.Item label="角色">
            <Tag color="blue">{userInfo?.role}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="区域代码">{userInfo?.regionCode}</Descriptions.Item>
        </Descriptions>
        
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={testPermissions}>
            测试数据采集权限
          </Button>
        </div>
      </Card>

      {villages.length > 0 && (
        <Card title="村庄列表" style={{ marginBottom: 16 }}>
          <Descriptions bordered>
            <Descriptions.Item label="村庄总数">{villages.length}</Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            {villages.map(village => (
              <Tag key={village.id} color={village.isActive ? 'green' : 'red'} style={{ marginBottom: 8 }}>
                {village.villageName} ({village.villageCode})
              </Tag>
            ))}
          </div>
        </Card>
      )}

      {Object.keys(testResults).length > 0 && (
        <Card title="权限测试结果">
          <Descriptions bordered>
            {Object.entries(testResults).map(([testName, result]: [string, any]) => (
              <Descriptions.Item key={testName} label={testName}>
                <Tag color={result.success ? 'green' : 'red'}>
                  {result.message}
                </Tag>
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
      )}
    </div>
  )
}