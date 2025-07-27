import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { hasPermission, Permission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const regionCode = searchParams.get('regionCode') || user.regionCode

    // 构建区域过滤条件
    const regionFilter = buildRegionFilter(user, regionCode)

    // 获取统计数据
    const stats = await getStatistics(regionFilter, startDate, endDate)
    
    // 获取图表数据
    const charts = await getChartData(regionFilter, startDate, endDate)

    return NextResponse.json({
      message: '获取成功',
      data: {
        stats,
        charts
      }
    })
  } catch (error) {
    console.error('Dashboard statistics error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

function buildRegionFilter(user: any, requestedRegion: string) {
  // 超级管理员和市级管理员可以查看所有区域
  if (user.role === 'SUPER_ADMIN' || user.role === 'CITY_ADMIN') {
    return requestedRegion ? { regionCode: requestedRegion } : {}
  }

  // 区市管理员可以查看本区市及下属区域
  if (user.role === 'DISTRICT_ADMIN') {
    return { regionCode: { startsWith: user.regionCode } }
  }

  // 其他角色只能查看自己区域
  return { regionCode: user.regionCode }
}

async function getStatistics(regionFilter: any, startDate: string, endDate: string) {
  const dateFilter = {
    gte: new Date(startDate),
    lte: new Date(endDate)
  }

  // 农房统计
  const housesTotal = await prisma.house.count({ where: regionFilter })
  const housesUnderConstruction = await prisma.house.count({
    where: { ...regionFilter, constructionStatus: 'IN_PROGRESS' }
  })
  const housesCompleted = await prisma.house.count({
    where: { ...regionFilter, constructionStatus: 'COMPLETED' }
  })
  const housesPlanning = await prisma.house.count({
    where: { ...regionFilter, constructionStatus: 'PLANNED' }
  })

  // 计算农房增长率（与上个周期对比）
  const previousPeriodStart = new Date(new Date(startDate).getTime() - (new Date(endDate).getTime() - new Date(startDate).getTime()))
  const previousHousesTotal = await prisma.house.count({
    where: {
      ...regionFilter,
      createdAt: {
        gte: previousPeriodStart,
        lt: new Date(startDate)
      }
    }
  })
  const housesGrowth = previousHousesTotal > 0 ? ((housesTotal - previousHousesTotal) / previousHousesTotal * 100) : 0

  // 工匠统计
  const craftsmenTotal = await prisma.craftsman.count({ where: regionFilter })
  const craftsmenActive = await prisma.craftsman.count({
    where: { ...regionFilter, status: 'ACTIVE' }
  })
  const craftsmenExpert = await prisma.craftsman.count({
    where: { ...regionFilter, skillLevel: 'EXPERT' }
  })
  const craftsmenHighCredit = await prisma.craftsman.count({
    where: { ...regionFilter, creditScore: { gte: 90 } }
  })

  const previousCraftsmenTotal = await prisma.craftsman.count({
    where: {
      ...regionFilter,
      createdAt: {
        gte: previousPeriodStart,
        lt: new Date(startDate)
      }
    }
  })
  const craftsmenGrowth = previousCraftsmenTotal > 0 ? ((craftsmenTotal - previousCraftsmenTotal) / previousCraftsmenTotal * 100) : 0

  // 培训统计
  const trainingHours = await prisma.trainingRecord.aggregate({
    where: {
      craftsman: regionFilter,
      trainingDate: dateFilter,
      completionStatus: 'COMPLETED'
    },
    _sum: { durationHours: true }
  })

  const completedTrainings = await prisma.trainingRecord.count({
    where: {
      craftsman: regionFilter,
      trainingDate: dateFilter,
      completionStatus: 'COMPLETED'
    }
  })

  const averageScore = await prisma.trainingRecord.aggregate({
    where: {
      craftsman: regionFilter,
      trainingDate: dateFilter,
      completionStatus: 'COMPLETED',
      score: { not: null }
    },
    _avg: { score: true }
  })

  const previousTrainingHours = await prisma.trainingRecord.aggregate({
    where: {
      craftsman: regionFilter,
      trainingDate: {
        gte: previousPeriodStart,
        lt: new Date(startDate)
      },
      completionStatus: 'COMPLETED'
    },
    _sum: { durationHours: true }
  })
  const trainingGrowth = (previousTrainingHours._sum.durationHours || 0) > 0 ? 
    (((trainingHours._sum.durationHours || 0) - (previousTrainingHours._sum.durationHours || 0)) / (previousTrainingHours._sum.durationHours || 1) * 100) : 0

  // 质量监管统计
  const inspections = await prisma.inspection.count({
    where: {
      inspectionDate: dateFilter
    }
  })

  const passedInspections = await prisma.inspection.count({
    where: {
      inspectionDate: dateFilter,
      result: 'PASS'
    }
  })

  const satisfactionSurveys = await prisma.satisfactionSurvey.aggregate({
    where: {
      surveyDate: dateFilter
    },
    _avg: { overallScore: true }
  })

  const previousInspections = await prisma.inspection.count({
    where: {
      inspectionDate: {
        gte: previousPeriodStart,
        lt: new Date(startDate)
      }
    }
  })
  const qualityGrowth = previousInspections > 0 ? ((inspections - previousInspections) / previousInspections * 100) : 0

  return {
    houses: {
      total: housesTotal,
      underConstruction: housesUnderConstruction,
      completed: housesCompleted,
      planning: housesPlanning,
      recentGrowth: Math.round(housesGrowth * 100) / 100
    },
    craftsmen: {
      total: craftsmenTotal,
      active: craftsmenActive,
      expert: craftsmenExpert,
      highCredit: craftsmenHighCredit,
      recentGrowth: Math.round(craftsmenGrowth * 100) / 100
    },
    training: {
      totalHours: trainingHours._sum.durationHours || 0,
      completedTrainings,
      averageScore: Math.round((averageScore._avg.score || 0) * 100) / 100,
      recentGrowth: Math.round(trainingGrowth * 100) / 100
    },
    quality: {
      inspections,
      passRate: inspections > 0 ? Math.round((passedInspections / inspections) * 100) : 0,
      satisfactionRate: Math.round((satisfactionSurveys._avg.overallScore || 0) * 20), // 转换为百分制
      recentGrowth: Math.round(qualityGrowth * 100) / 100
    }
  }
}

async function getChartData(regionFilter: any, startDate: string, endDate: string) {
  // 农房建设趋势数据
  const housesByMonth = await getHousesByMonth(regionFilter, startDate, endDate)
  
  // 工匠技能分布数据
  const craftsmenBySkill = await getCraftsmenBySkill(regionFilter)
  
  // 培训进度数据
  const trainingProgress = await getTrainingProgress(regionFilter, startDate, endDate)
  
  // 质量趋势数据
  const qualityTrends = await getQualityTrends(regionFilter, startDate, endDate)

  return {
    housesByMonth,
    craftsmenBySkill,
    trainingProgress,
    qualityTrends
  }
}

async function getHousesByMonth(regionFilter: any, startDate: string, endDate: string) {
  const houses = await prisma.house.findMany({
    where: {
      ...regionFilter,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    select: {
      createdAt: true,
      constructionStatus: true
    }
  })

  // 按月份和状态分组
  const monthlyData: Record<string, Record<string, number>> = {}
  
  houses.forEach(house => {
    const month = house.createdAt.toISOString().slice(0, 7) // YYYY-MM
    const status = house.constructionStatus || 'PLANNING'
    
    if (!monthlyData[month]) {
      monthlyData[month] = {}
    }
    
    monthlyData[month][status] = (monthlyData[month][status] || 0) + 1
  })

  // 转换为图表数据格式
  const result: Array<{ month: string; count: number; type: string }> = []
  
  Object.entries(monthlyData).forEach(([month, statusData]) => {
    Object.entries(statusData).forEach(([status, count]) => {
      const statusMap: Record<string, string> = {
        'PLANNED': '规划中',
        'IN_PROGRESS': '建设中',
        'COMPLETED': '已完工'
      }
      
      result.push({
        month,
        count,
        type: statusMap[status] || status
      })
    })
  })

  return result.sort((a, b) => a.month.localeCompare(b.month))
}

async function getCraftsmenBySkill(regionFilter: any) {
  const craftsmen = await prisma.craftsman.findMany({
    where: regionFilter,
    select: {
      specialties: true
    }
  })

  // 统计技能分布
  const skillCount: Record<string, number> = {}
  
  craftsmen.forEach(craftsman => {
    craftsman.specialties.forEach(skill => {
      skillCount[skill] = (skillCount[skill] || 0) + 1
    })
  })

  return Object.entries(skillCount)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // 取前10个技能
}

async function getTrainingProgress(regionFilter: any, startDate: string, endDate: string) {
  const trainings = await prisma.trainingRecord.findMany({
    where: {
      craftsman: regionFilter,
      trainingDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      completionStatus: 'COMPLETED'
    },
    select: {
      trainingDate: true,
      durationHours: true
    }
  })

  // 按月份统计学时
  const monthlyHours: Record<string, number> = {}
  
  trainings.forEach(training => {
    const month = training.trainingDate.toISOString().slice(0, 7) // YYYY-MM
    monthlyHours[month] = (monthlyHours[month] || 0) + training.durationHours
  })

  return Object.entries(monthlyHours)
    .map(([month, hours]) => ({ month, hours }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

async function getQualityTrends(regionFilter: any, startDate: string, endDate: string) {
  const inspections = await prisma.inspection.findMany({
    where: {
      inspectionDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    select: {
      inspectionDate: true,
      result: true
    }
  })

  const satisfactionSurveys = await prisma.satisfactionSurvey.findMany({
    where: {
      surveyDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    select: {
      surveyDate: true,
      overallScore: true
    }
  })

  // 按月份统计质量数据
  const monthlyQuality: Record<string, { total: number; passed: number; satisfactionSum: number; satisfactionCount: number }> = {}
  
  inspections.forEach(inspection => {
    const month = inspection.inspectionDate.toISOString().slice(0, 7)
    if (!monthlyQuality[month]) {
      monthlyQuality[month] = { total: 0, passed: 0, satisfactionSum: 0, satisfactionCount: 0 }
    }
    
    monthlyQuality[month].total++
    if (inspection.result === 'PASS') {
      monthlyQuality[month].passed++
    }
  })

  satisfactionSurveys.forEach(survey => {
    const month = survey.surveyDate.toISOString().slice(0, 7)
    if (!monthlyQuality[month]) {
      monthlyQuality[month] = { total: 0, passed: 0, satisfactionSum: 0, satisfactionCount: 0 }
    }
    
    monthlyQuality[month].satisfactionSum += survey.overallScore
    monthlyQuality[month].satisfactionCount++
  })

  return Object.entries(monthlyQuality)
    .map(([month, data]) => ({
      month,
      passRate: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
      satisfactionRate: data.satisfactionCount > 0 ? Math.round((data.satisfactionSum / data.satisfactionCount) * 20) : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}