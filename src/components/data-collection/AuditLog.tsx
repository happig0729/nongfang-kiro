import React, { useState, useEffect } from 'react'
import { Card, Table, DatePicker, Select, Input, Button, Tag, Space, Modal, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { UserRole } from '@/lib/permissions'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

interface AuditLogProps {
  currentUser: {
    id: string
    role: UserRole
    regionCode: string
    realName: string
  }
}

interface AuditLogEntry {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  resource: string
  resourceId: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: string
  status: 'SUCCESS' | 'FAILED'
  duration?: number
}

export default function AuditLog({ currentUser }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(7, 'day'), dayjs()],
    action: '',
    status: '',
    search: '',
    userId: ''
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  useEffect(() => {
    fetchLogs()
  }, [filters, pagination.current, pagination.pageSize])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        pageSize: pagination.pageSize.toString(),
        startDate: filters.dateRange[0].format('YYYY-MM-DD'),
        endDate: filters.dateRange[1].format('YYYY-MM-DD'),
        action: filters.action,
        status: filters.status,
        search: filters.search,
        userId: filters.userId
      })

      const response = await fetch(`/api/data-collection/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setLogs(result.data.logs)
        setPagination(prev => ({
          ...prev,
          total: result.data.total
        }))
      }
    } catch (error) {
      console.error('获取审计日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTableChange = (paginationInfo: any) => {
    setPagination({
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
      total: pagination.total
    })
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        startDate: filters.dateRange[0].format('YYYY-MM-DD'),
        endDate: filters.dateRange[1].format('YYYY-MM-DD'),
        action: filters.action,
        status: filters.status,
        search: filters.search,
        userId: filters.userId,
        export: 'true'
      })

      const response = await fetch(`/api/data-collection/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${dayjs().format('YYYY-MM-DD')}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  const showLogDetails = (log: AuditLogEntry) => {
    Modal.info({
      title: '操作详情',
      width: 800,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>操作用户：</strong>{log.userName} ({log.userRole})
            </div>
            <div>
              <strong>操作时间：</strong>{dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
            </div>
            <div>
              <strong>操作类型：</strong>{getActionDisplayName(log.action)}
            </div>
            <div>
              <strong>操作状态：</strong>
              <Tag color={log.status === 'SUCCESS' ? 'green' : 'red'}>
                {log.status === 'SUCCESS' ? '成功' : '失败'}
              </Tag>
            </div>
            <div>
              <strong>资源类型：</strong>{getResourceDisplayName(log.resource)}
            </div>
            <div>
              <strong>资源ID：</strong>{log.resourceId}
            </div>
            <div>
              <strong>IP地址：</strong>{log.ipAddress}
            </div>
            <div>
              <strong>响应时间：</strong>{log.duration ? `${log.duration}ms` : '未知'}
            </div>
          </div>
          
          <div>
            <strong>用户代理：</strong>
            <div className="text-sm text-gray-600 mt-1 break-all">
              {log.userAgent}
            </div>
          </div>

          {log.details && (
            <div>
              <strong>操作详情：</strong>
              <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-auto max-h-60">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )
    })
  }

  const getActionDisplayName = (action: string): string => {
    const actionMap: Record<string, string> = {
      'CREATE': '创建',
      'UPDATE': '更新',
      'DELETE': '删除',
      'IMPORT': '导入',
      'EXPORT': '导出',
      'LOGIN': '登录',
      'LOGOUT': '登出',
      'VIEW': '查看',
      'DOWNLOAD': '下载'
    }
    return actionMap[action] || action
  }

  const getResourceDisplayName = (resource: string): string => {
    const resourceMap: Record<string, string> = {
      'village_portal': '村庄填报端口',
      'data_template': '数据模板',
      'batch_import': '批量导入',
      'house': '农房信息',
      'craftsman': '工匠信息',
      'training': '培训记录',
      'user': '用户信息'
    }
    return resourceMap[resource] || resource
  }

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: string) => (
        <Tooltip title={dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(timestamp).format('MM-DD HH:mm')}
        </Tooltip>
      ),
      sorter: true
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
      render: (name: string, record: AuditLogEntry) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">{record.userRole}</div>
        </div>
      )
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => (
        <Tag color="blue">{getActionDisplayName(action)}</Tag>
      )
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 120,
      render: (resource: string, record: AuditLogEntry) => (
        <div>
          <div>{getResourceDisplayName(resource)}</div>
          {record.resourceId && record.resourceId !== 'unknown' && (
            <div className="text-xs text-gray-500">ID: {record.resourceId.slice(0, 8)}...</div>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'SUCCESS' ? 'green' : 'red'}>
          {status === 'SUCCESS' ? '成功' : '失败'}
        </Tag>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (ip: string) => (
        <span className="font-mono text-sm">{ip}</span>
      )
    },
    {
      title: '响应时间',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => (
        duration ? (
          <span className={duration > 2000 ? 'text-red-500' : duration > 1000 ? 'text-orange-500' : 'text-green-500'}>
            {duration}ms
          </span>
        ) : '-'
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record: AuditLogEntry) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => showLogDetails(record)}
        >
          详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">操作审计日志</h3>
        <p className="text-gray-600">记录系统中所有用户的操作行为，用于安全审计和问题排查</p>
      </div>

      {/* 筛选控件 */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">时间范围</label>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates || [dayjs().subtract(7, 'day'), dayjs()] })}
              format="YYYY-MM-DD"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">操作类型</label>
            <Select
              value={filters.action}
              onChange={(value) => setFilters({ ...filters, action: value })}
              placeholder="选择操作类型"
              allowClear
              className="w-full"
            >
              <Option value="CREATE">创建</Option>
              <Option value="UPDATE">更新</Option>
              <Option value="DELETE">删除</Option>
              <Option value="IMPORT">导入</Option>
              <Option value="EXPORT">导出</Option>
              <Option value="LOGIN">登录</Option>
              <Option value="LOGOUT">登出</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">操作状态</label>
            <Select
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              placeholder="选择状态"
              allowClear
              className="w-full"
            >
              <Option value="SUCCESS">成功</Option>
              <Option value="FAILED">失败</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">搜索</label>
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="搜索用户或资源"
              prefix={<SearchOutlined />}
              allowClear
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchLogs}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出日志
            </Button>
          </Space>
        </div>
      </Card>

      {/* 日志表格 */}
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
        size="small"
      />
    </div>
  )
}