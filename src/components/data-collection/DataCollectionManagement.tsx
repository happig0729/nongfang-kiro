import React, { useState, useEffect } from 'react'
import { Card, Tabs, Button, Space, Row, Col, Statistic, Progress, Alert, Tag, Typography, Avatar, Divider } from 'antd'
import { 
  DatabaseOutlined, 
  UploadOutlined, 
  SettingOutlined, 
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import { hasPermission, Permission } from '@/lib/permissions'
import { UserRole } from '../../../generated/prisma'
import VillagePortalConfig from './VillagePortalConfig'
import BatchImport from './BatchImport'
import DataTemplateManager from './DataTemplateManager'
import AuditLog from './AuditLog'

const { Title, Text } = Typography

interface DataCollectionManagementProps {
  currentUser: {
    id: string
    role: UserRole
    regionCode: string
    realName: string
  }
}

interface DataCollectionStats {
  villages: {
    total: number
    active: number
    inactive: number
  }
  submissions: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
  }
  templates: {
    total: number
    active: number
  }
  users: {
    online: number
    total: number
  }
}

export default function DataCollectionManagement({ currentUser }: DataCollectionManagementProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DataCollectionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/data-collection/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 根据用户角色构建标签页
  const buildTabItems = () => {
    const items = []

    // 概览页面 - 所有用户都可以看到
    items.push({
      key: 'overview',
      label: (
        <span>
          <BarChartOutlined />
          数据概览
        </span>
      ),
      children: renderOverview(),
    })

    // 村庄填报端口 - 需要管理权限
    if (hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE)) {
      items.push({
        key: 'villages',
        label: (
          <span>
            <DatabaseOutlined />
            村庄填报端口
          </span>
        ),
        children: <VillagePortalConfig currentUser={currentUser} />,
      })
    }

    // 批量数据导入 - 需要导入权限
    if (hasPermission(currentUser.role, Permission.DATA_COLLECTION_IMPORT)) {
      items.push({
        key: 'batch-import',
        label: (
          <span>
            <UploadOutlined />
            批量数据导入
          </span>
        ),
        children: <BatchImport currentUser={currentUser} />,
      })
    }

    // 数据模板管理 - 需要管理权限
    if (hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE)) {
      items.push({
        key: 'templates',
        label: (
          <span>
            <FileTextOutlined />
            数据模板管理
          </span>
        ),
        children: <DataTemplateManager currentUser={currentUser} />,
      })
    }

    // 操作审计 - 需要管理权限
    if (hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE)) {
      items.push({
        key: 'audit',
        label: (
          <span>
            <SettingOutlined />
            操作审计
          </span>
        ),
        children: <AuditLog currentUser={currentUser} />,
      })
    }

    return items
  }

  const renderOverview = () => {
    if (!stats) return null

    return (
      <div>
        {/* 欢迎信息 */}
        <Alert
          message={`欢迎，${currentUser.realName}`}
          description={`您当前的角色是${getRoleDisplayName(currentUser.role)}，可以使用以下数据采集功能。`}
          type="info"
          showIcon
          className="mb-6"
        />

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="村庄填报端口"
                value={stats.villages.total}
                prefix={<DatabaseOutlined />}
                suffix={
                  <div className="text-sm">
                    <div className="text-green-600">活跃: {stats.villages.active}</div>
                    <div className="text-gray-500">停用: {stats.villages.inactive}</div>
                  </div>
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="数据提交"
                value={stats.submissions.total}
                prefix={<UploadOutlined />}
                suffix={
                  <div className="text-sm">
                    <div className="text-blue-600">今日: {stats.submissions.today}</div>
                    <div className="text-purple-600">本周: {stats.submissions.thisWeek}</div>
                  </div>
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="数据模板"
                value={stats.templates.total}
                prefix={<FileTextOutlined />}
                suffix={
                  <div className="text-sm">
                    <div className="text-green-600">启用: {stats.templates.active}</div>
                  </div>
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="在线用户"
                value={stats.users.online}
                prefix={<UserOutlined />}
                suffix={`/ ${stats.users.total}`}
              />
              <Progress 
                percent={Math.round((stats.users.online / stats.users.total) * 100)} 
                size="small"
                showInfo={false}
                className="mt-2"
              />
            </Card>
          </Col>
        </Row>

        {/* 快速操作 */}
        <Card title="快速操作" className="mb-6">
          <Space wrap>
            {hasPermission(currentUser.role, Permission.DATA_COLLECTION_CREATE) && (
              <Button 
                type="primary" 
                icon={<DatabaseOutlined />}
                onClick={() => setActiveTab('villages')}
              >
                配置填报端口
              </Button>
            )}
            
            {hasPermission(currentUser.role, Permission.DATA_COLLECTION_IMPORT) && (
              <Button 
                icon={<UploadOutlined />}
                onClick={() => setActiveTab('batch-import')}
              >
                批量导入数据
              </Button>
            )}
            
            {hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE) && (
              <Button 
                icon={<FileTextOutlined />}
                onClick={() => setActiveTab('templates')}
              >
                管理数据模板
              </Button>
            )}
            
            {hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE) && (
              <Button 
                icon={<SettingOutlined />}
                onClick={() => setActiveTab('audit')}
              >
                查看操作日志
              </Button>
            )}
          </Space>
        </Card>

        {/* 权限说明 */}
        <Card title="功能权限说明">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <h4>您可以使用的功能：</h4>
              <Space direction="vertical">
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_VIEW) && (
                  <Tag icon={<CheckCircleOutlined />} color="success">数据查看</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_CREATE) && (
                  <Tag icon={<CheckCircleOutlined />} color="success">数据录入</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_EDIT) && (
                  <Tag icon={<CheckCircleOutlined />} color="success">数据编辑</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_IMPORT) && (
                  <Tag icon={<CheckCircleOutlined />} color="success">批量导入</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_EXPORT) && (
                  <Tag icon={<CheckCircleOutlined />} color="success">数据导出</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE) && (
                  <Tag icon={<CheckCircleOutlined />} color="success">系统管理</Tag>
                )}
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <h4>数据访问范围：</h4>
              <div className="text-gray-600">
                {currentUser.role === 'SUPER_ADMIN' && '全系统数据'}
                {currentUser.role === 'CITY_ADMIN' && '全市数据'}
                {currentUser.role === 'DISTRICT_ADMIN' && '本区市数据'}
                {currentUser.role === 'TOWN_ADMIN' && '本镇街数据'}
                {currentUser.role === 'VILLAGE_ADMIN' && '本村数据'}
                {!['SUPER_ADMIN', 'CITY_ADMIN', 'DISTRICT_ADMIN', 'TOWN_ADMIN', 'VILLAGE_ADMIN'].includes(currentUser.role) && '个人数据'}
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    )
  }

  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: '超级管理员',
      [UserRole.CITY_ADMIN]: '市级管理员',
      [UserRole.DISTRICT_ADMIN]: '区市管理员',
      [UserRole.TOWN_ADMIN]: '镇街管理员',
      [UserRole.VILLAGE_ADMIN]: '村级管理员',
      [UserRole.CRAFTSMAN]: '工匠',
      [UserRole.FARMER]: '农户',
      [UserRole.INSPECTOR]: '检查员',
    }
    return roleNames[role] || '未知角色'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="text-white mb-2">
                数据采集工作台
              </Title>
              <Text className="text-blue-100 text-lg">
                欢迎，{currentUser.realName} · {getRoleDisplayName(currentUser.role)}
              </Text>
            </div>
            <div className="text-right">
              <Avatar size={64} icon={<UserOutlined />} className="bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* 快速操作卡片 */}
        <div className="mb-8">
          <Title level={4} className="mb-4">快速操作</Title>
          <Row gutter={[20, 20]}>
            {hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE) && (
              <Col xs={12} sm={8} md={6}>
                <Card 
                  hoverable 
                  className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  bodyStyle={{ padding: '32px 24px' }}
                  onClick={() => setActiveTab('villages')}
                >
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DatabaseOutlined className="text-2xl text-blue-600" />
                  </div>
                  <Title level={5} className="mb-2">村庄填报端口</Title>
                  <Text type="secondary">配置村庄数据填报</Text>
                </Card>
              </Col>
            )}
            
            {hasPermission(currentUser.role, Permission.DATA_COLLECTION_IMPORT) && (
              <Col xs={12} sm={8} md={6}>
                <Card 
                  hoverable 
                  className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  bodyStyle={{ padding: '32px 24px' }}
                  onClick={() => setActiveTab('batch-import')}
                >
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadOutlined className="text-2xl text-green-600" />
                  </div>
                  <Title level={5} className="mb-2">批量数据导入</Title>
                  <Text type="secondary">Excel批量导入数据</Text>
                </Card>
              </Col>
            )}
            
            {hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE) && (
              <Col xs={12} sm={8} md={6}>
                <Card 
                  hoverable 
                  className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  bodyStyle={{ padding: '32px 24px' }}
                  onClick={() => setActiveTab('templates')}
                >
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileTextOutlined className="text-2xl text-orange-600" />
                  </div>
                  <Title level={5} className="mb-2">数据模板管理</Title>
                  <Text type="secondary">管理填报模板</Text>
                </Card>
              </Col>
            )}
            
            {hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE) && (
              <Col xs={12} sm={8} md={6}>
                <Card 
                  hoverable 
                  className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  bodyStyle={{ padding: '32px 24px' }}
                  onClick={() => setActiveTab('audit')}
                >
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SettingOutlined className="text-2xl text-purple-600" />
                  </div>
                  <Title level={5} className="mb-2">操作审计</Title>
                  <Text type="secondary">查看操作日志</Text>
                </Card>
              </Col>
            )}
          </Row>
        </div>

        {/* 数据统计概览 */}
        {stats && (
          <div className="mb-8">
            <Title level={4} className="mb-4">数据概览</Title>
            <Row gutter={[20, 20]}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="border-0 shadow-lg">
                  <div className="flex items-center">
                    <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                      <DatabaseOutlined className="text-xl text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{stats.villages.total}</div>
                      <div className="text-sm text-gray-500">村庄填报端口</div>
                      <div className="text-xs text-green-600 mt-1">
                        活跃: {stats.villages.active} | 停用: {stats.villages.inactive}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="border-0 shadow-lg">
                  <div className="flex items-center">
                    <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                      <UploadOutlined className="text-xl text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{stats.submissions.total}</div>
                      <div className="text-sm text-gray-500">数据提交总数</div>
                      <div className="text-xs text-blue-600 mt-1">
                        今日: {stats.submissions.today} | 本周: {stats.submissions.thisWeek}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="border-0 shadow-lg">
                  <div className="flex items-center">
                    <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                      <FileTextOutlined className="text-xl text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{stats.templates.total}</div>
                      <div className="text-sm text-gray-500">数据模板</div>
                      <div className="text-xs text-green-600 mt-1">
                        启用: {stats.templates.active}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="border-0 shadow-lg">
                  <div className="flex items-center">
                    <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                      <UserOutlined className="text-xl text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{stats.users.online}</div>
                      <div className="text-sm text-gray-500">在线用户</div>
                      <Progress 
                        percent={Math.round((stats.users.online / stats.users.total) * 100)} 
                        size="small"
                        strokeColor="#8b5cf6"
                        showInfo={false}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* 功能权限说明 */}
        <Card title="您的功能权限" className="border-0 shadow-lg mb-8">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <div className="mb-4">
                <Text strong>可用功能：</Text>
              </div>
              <Space wrap>
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_VIEW) && (
                  <Tag icon={<EyeOutlined />} color="blue">数据查看</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_CREATE) && (
                  <Tag icon={<PlusOutlined />} color="green">数据录入</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_EDIT) && (
                  <Tag icon={<SettingOutlined />} color="orange">数据编辑</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_IMPORT) && (
                  <Tag icon={<UploadOutlined />} color="purple">批量导入</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_EXPORT) && (
                  <Tag icon={<ArrowRightOutlined />} color="cyan">数据导出</Tag>
                )}
                {hasPermission(currentUser.role, Permission.DATA_COLLECTION_MANAGE) && (
                  <Tag icon={<SafetyOutlined />} color="red">系统管理</Tag>
                )}
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <div className="mb-4">
                <Text strong>数据访问范围：</Text>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <Text className="text-gray-700">
                  {currentUser.role === 'SUPER_ADMIN' && '🌐 全系统数据'}
                  {currentUser.role === 'CITY_ADMIN' && '🏙️ 全市数据'}
                  {currentUser.role === 'DISTRICT_ADMIN' && '🏘️ 本区市数据'}
                  {currentUser.role === 'TOWN_ADMIN' && '🏠 本镇街数据'}
                  {currentUser.role === 'VILLAGE_ADMIN' && '🏡 本村数据'}
                  {!['SUPER_ADMIN', 'CITY_ADMIN', 'DISTRICT_ADMIN', 'TOWN_ADMIN', 'VILLAGE_ADMIN'].includes(currentUser.role) && '👤 个人数据'}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 详细功能区域 */}
        <div className="bg-white rounded-lg shadow-lg">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={buildTabItems()}
            size="large"
            className="px-6"
            tabBarStyle={{ marginBottom: 0, borderBottom: '1px solid #f0f0f0' }}
          />
        </div>
      </div>
    </div>
  )
}