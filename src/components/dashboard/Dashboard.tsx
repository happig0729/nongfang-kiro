import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Button, DatePicker, Select, Spin, Avatar, Typography, Space } from 'antd'
import { 
  HomeOutlined, 
  ToolOutlined, 
  SafetyOutlined, 
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  BarChartOutlined,
  RightOutlined,
  PlusOutlined,
  SearchOutlined,
  BellOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { Line, Column, Pie, Area } from '@ant-design/plots'
import { hasPermission, Permission } from '@/lib/permissions'
import { UserRole } from '../../../generated/prisma'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text } = Typography

interface DashboardProps {
  currentUser: {
    id: string
    role: UserRole
    regionCode: string
    realName: string
  }
}

interface DashboardStats {
  houses: {
    total: number
    underConstruction: number
    completed: number
    planning: number
    recentGrowth: number
  }
  craftsmen: {
    total: number
    active: number
    expert: number
    highCredit: number
    recentGrowth: number
  }
  training: {
    totalHours: number
    completedTrainings: number
    averageScore: number
    recentGrowth: number
  }
  quality: {
    inspections: number
    passRate: number
    satisfactionRate: number
    recentGrowth: number
  }
}

interface ChartData {
  housesByMonth: Array<{ month: string; count: number; type: string }>
  craftsmenBySkill: Array<{ skill: string; count: number }>
  trainingProgress: Array<{ month: string; hours: number }>
  qualityTrends: Array<{ month: string; passRate: number; satisfactionRate: number }>
}

function getRoleDisplayName(role: UserRole): string {
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

export default function Dashboard({ currentUser }: DashboardProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(6, 'month'),
    dayjs()
  ])
  const [selectedRegion, setSelectedRegion] = useState(currentUser.regionCode)

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange, selectedRegion])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        regionCode: selectedRegion
      })

      const response = await fetch(`/api/dashboard/statistics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStats(result.data.stats)
        setChartData(result.data.charts)
      }
    } catch (error) {
      console.error('获取仪表板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 现代化统计卡片
  const renderModernStatisticCards = () => {
    if (!stats) return null

    const cards = []

    // 农房统计卡片
    if (hasPermission(currentUser.role, Permission.HOUSE_VIEW)) {
      cards.push(
        <Col xs={24} sm={12} lg={6} key="houses">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <HomeOutlined className="text-xl text-blue-600" />
              </div>
              <div className={`flex items-center text-sm ${stats.houses.recentGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.houses.recentGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                <span className="ml-1">{Math.abs(stats.houses.recentGrowth)}%</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-800">{stats.houses.total}</div>
              <div className="text-sm text-gray-500">农房总数</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">建设中</span>
                <span className="font-medium text-blue-600">{stats.houses.underConstruction}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">已完工</span>
                <span className="font-medium text-green-600">{stats.houses.completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">规划中</span>
                <span className="font-medium text-orange-600">{stats.houses.planning}</span>
              </div>
            </div>
          </Card>
        </Col>
      )
    }

    // 工匠统计卡片
    if (hasPermission(currentUser.role, Permission.CRAFTSMAN_VIEW)) {
      cards.push(
        <Col xs={24} sm={12} lg={6} key="craftsmen">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <ToolOutlined className="text-xl text-orange-600" />
              </div>
              <div className={`flex items-center text-sm ${stats.craftsmen.recentGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.craftsmen.recentGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                <span className="ml-1">{Math.abs(stats.craftsmen.recentGrowth)}%</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-800">{stats.craftsmen.total}</div>
              <div className="text-sm text-gray-500">工匠总数</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">活跃工匠</span>
                <span className="font-medium text-green-600">{stats.craftsmen.active}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">专家级</span>
                <span className="font-medium text-purple-600">{stats.craftsmen.expert}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">高信用</span>
                <span className="font-medium text-blue-600">{stats.craftsmen.highCredit}</span>
              </div>
            </div>
          </Card>
        </Col>
      )
    }

    // 培训统计卡片
    if (hasPermission(currentUser.role, Permission.TRAINING_VIEW)) {
      cards.push(
        <Col xs={24} sm={12} lg={6} key="training">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <FileTextOutlined className="text-xl text-green-600" />
              </div>
              <div className={`flex items-center text-sm ${stats.training.recentGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.training.recentGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                <span className="ml-1">{Math.abs(stats.training.recentGrowth)}%</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-800">{stats.training.totalHours}</div>
              <div className="text-sm text-gray-500">培训总学时</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">完成培训</span>
                <span className="font-medium text-green-600">{stats.training.completedTrainings}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">平均分数</span>
                <span className="font-medium text-blue-600">{stats.training.averageScore}</span>
              </div>
              <Progress 
                percent={Math.round((stats.training.totalHours / 4000) * 100)} 
                size="small"
                strokeColor="#10b981"
                showInfo={false}
                className="mt-2"
              />
              <div className="text-xs text-gray-500">年度目标进度</div>
            </div>
          </Card>
        </Col>
      )
    }

    // 质量监管统计卡片
    if (hasPermission(currentUser.role, Permission.INSPECTION_VIEW)) {
      cards.push(
        <Col xs={24} sm={12} lg={6} key="quality">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <SafetyOutlined className="text-xl text-red-600" />
              </div>
              <div className={`flex items-center text-sm ${stats.quality.recentGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.quality.recentGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                <span className="ml-1">{Math.abs(stats.quality.recentGrowth)}%</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-800">{stats.quality.inspections}</div>
              <div className="text-sm text-gray-500">质量检查</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">合格率</span>
                <span className="font-medium text-green-600">{stats.quality.passRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">满意度</span>
                <span className="font-medium text-blue-600">{stats.quality.satisfactionRate}%</span>
              </div>
              <Progress 
                percent={stats.quality.passRate} 
                size="small"
                strokeColor="#ef4444"
                showInfo={false}
                className="mt-2"
              />
              <div className="text-xs text-gray-500">质量达标率</div>
            </div>
          </Card>
        </Col>
      )
    }

    return cards
  }

  // 现代化图表
  const renderModernCharts = () => {
    if (!chartData) return null

    const charts = []

    // 农房建设趋势图
    if (hasPermission(currentUser.role, Permission.HOUSE_VIEW) && chartData.housesByMonth) {
      const areaConfig = {
        data: chartData.housesByMonth,
        xField: 'month',
        yField: 'count',
        seriesField: 'type',
        smooth: true,
        areaStyle: {
          fillOpacity: 0.6,
        },
        color: ['#3b82f6', '#10b981', '#f59e0b'],
        animation: {
          appear: {
            animation: 'wave-in',
            duration: 1500,
          },
        },
      }

      charts.push(
        <Col xs={24} lg={12} key="house-trend">
          <Card 
            title="农房建设趋势" 
            className="border-0 shadow-lg"
            extra={<Button type="text" icon={<EyeOutlined />} size="small">详情</Button>}
          >
            <Area {...areaConfig} height={300} />
          </Card>
        </Col>
      )
    }

    // 工匠技能分布图
    if (hasPermission(currentUser.role, Permission.CRAFTSMAN_VIEW) && chartData.craftsmenBySkill) {
      const columnConfig = {
        data: chartData.craftsmenBySkill,
        xField: 'skill',
        yField: 'count',
        color: '#f59e0b',
        columnStyle: {
          radius: [4, 4, 0, 0],
        },
        animation: {
          appear: {
            animation: 'grow-in-y',
            duration: 1500,
          },
        },
      }

      charts.push(
        <Col xs={24} lg={12} key="craftsmen-skill">
          <Card 
            title="工匠技能分布" 
            className="border-0 shadow-lg"
            extra={<Button type="text" icon={<TrophyOutlined />} size="small">详情</Button>}
          >
            <Column {...columnConfig} height={300} />
          </Card>
        </Col>
      )
    }

    // 培训进度图
    if (hasPermission(currentUser.role, Permission.TRAINING_VIEW) && chartData.trainingProgress) {
      const lineConfig = {
        data: chartData.trainingProgress,
        xField: 'month',
        yField: 'hours',
        smooth: true,
        color: '#10b981',
        point: {
          size: 6,
          shape: 'circle',
          style: {
            fill: '#10b981',
            stroke: '#ffffff',
            lineWidth: 2,
          },
        },
        animation: {
          appear: {
            animation: 'path-in',
            duration: 1500,
          },
        },
      }

      charts.push(
        <Col xs={24} lg={12} key="training-progress">
          <Card 
            title="培训学时趋势" 
            className="border-0 shadow-lg"
            extra={<Button type="text" icon={<FileTextOutlined />} size="small">详情</Button>}
          >
            <Line {...lineConfig} height={300} />
          </Card>
        </Col>
      )
    }

    // 质量趋势图
    if (hasPermission(currentUser.role, Permission.INSPECTION_VIEW) && chartData.qualityTrends) {
      const qualityConfig = {
        data: chartData.qualityTrends,
        xField: 'month',
        yField: 'passRate',
        smooth: true,
        color: '#ef4444',
        point: {
          size: 6,
          shape: 'circle',
          style: {
            fill: '#ef4444',
            stroke: '#ffffff',
            lineWidth: 2,
          },
        },
        animation: {
          appear: {
            animation: 'fade-in',
            duration: 1500,
          },
        },
      }

      charts.push(
        <Col xs={24} lg={12} key="quality-trend">
          <Card 
            title="质量合格率趋势" 
            className="border-0 shadow-lg"
            extra={<Button type="text" icon={<SafetyOutlined />} size="small">详情</Button>}
          >
            <Line {...qualityConfig} height={300} />
          </Card>
        </Col>
      )
    }

    return charts
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4 text-gray-600">正在加载数据...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div>
              <Title level={3} className="mb-0 text-gray-800">
                工作台
              </Title>
              <Text type="secondary">
                {dayjs().format('YYYY年MM月DD日')} · {getRoleDisplayName(currentUser.role)}
              </Text>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button icon={<SearchOutlined />} type="text" size="large" />
            <Button icon={<BellOutlined />} type="text" size="large" />
            <Button icon={<SettingOutlined />} type="text" size="large" />
            <Avatar icon={<UserOutlined />} />
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <Title level={2} className="text-white mb-2">
                  早上好，{currentUser.realName}！
                </Title>
                <Text className="text-blue-100 text-lg">
                  今天是美好的一天，让我们开始工作吧
                </Text>
              </div>
              <div className="text-right">
                <div className="text-blue-100 mb-2">今日天气</div>
                <div className="text-2xl">☀️ 晴朗</div>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作卡片 */}
        <div className="mb-8">
          <Title level={4} className="mb-4">快速操作</Title>
          <Row gutter={[16, 16]}>
            {hasPermission(currentUser.role, Permission.DATA_COLLECTION_CREATE) && (
              <Col xs={12} sm={8} md={6}>
                <Card 
                  hoverable 
                  className="text-center border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileTextOutlined className="text-2xl text-blue-600" />
                  </div>
                  <div className="font-medium text-gray-800">数据填报</div>
                  <div className="text-sm text-gray-500 mt-1">录入农房信息</div>
                </Card>
              </Col>
            )}
            
            {hasPermission(currentUser.role, Permission.HOUSE_CREATE) && (
              <Col xs={12} sm={8} md={6}>
                <Card 
                  hoverable 
                  className="text-center border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <HomeOutlined className="text-2xl text-green-600" />
                  </div>
                  <div className="font-medium text-gray-800">新建农房</div>
                  <div className="text-sm text-gray-500 mt-1">添加农房记录</div>
                </Card>
              </Col>
            )}
            
            {hasPermission(currentUser.role, Permission.CRAFTSMAN_CREATE) && (
              <Col xs={12} sm={8} md={6}>
                <Card 
                  hoverable 
                  className="text-center border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ToolOutlined className="text-2xl text-orange-600" />
                  </div>
                  <div className="font-medium text-gray-800">添加工匠</div>
                  <div className="text-sm text-gray-500 mt-1">注册新工匠</div>
                </Card>
              </Col>
            )}
            
            {hasPermission(currentUser.role, Permission.INSPECTION_CREATE) && (
              <Col xs={12} sm={8} md={6}>
                <Card 
                  hoverable 
                  className="text-center border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <SafetyOutlined className="text-2xl text-red-600" />
                  </div>
                  <div className="font-medium text-gray-800">质量检查</div>
                  <div className="text-sm text-gray-500 mt-1">开始检查任务</div>
                </Card>
              </Col>
            )}
          </Row>
        </div>

        {/* 数据概览 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Title level={4} className="mb-0">数据概览</Title>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [dayjs().subtract(6, 'month'), dayjs()])}
                format="MM-DD"
                size="small"
              />
              {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.CITY_ADMIN) && (
                <Select
                  value={selectedRegion}
                  onChange={setSelectedRegion}
                  style={{ width: 120 }}
                  placeholder="区域"
                  size="small"
                >
                  <Option value="">全部</Option>
                  <Option value="370200">市南区</Option>
                  <Option value="370201">市北区</Option>
                  <Option value="370202">李沧区</Option>
                  <Option value="370203">崂山区</Option>
                  <Option value="370204">城阳区</Option>
                  <Option value="370205">即墨区</Option>
                  <Option value="370206">胶州市</Option>
                </Select>
              )}
            </Space>
          </div>
          
          <Row gutter={[24, 24]}>
            {renderModernStatisticCards()}
          </Row>
        </div>

        {/* 图表分析 */}
        <div>
          <Title level={4} className="mb-4">数据分析</Title>
          <Row gutter={[24, 24]}>
            {renderModernCharts()}
          </Row>
        </div>
      </div>
    </div>
  )
}