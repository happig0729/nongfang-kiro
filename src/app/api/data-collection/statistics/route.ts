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

    if (!hasPermission(user.role, Permission.DATA_COLLECTION_VIEW)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    // 构建区域过滤条件
    const regionFilter = buildRegionFilter(user)

    // 获取村庄统计
    const villagesTotal = await prisma.villagePortal.count({
      where: regionFilter
    })
    
    const villagesActive = await prisma.villagePortal.count({
      where: { ...regionFilter, isActive: true }
    })

    // 获取数据提交统计
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)
    thisWeek.setHours(0, 0, 0, 0)
    
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    // 这里假设有一个数据提交记录表，实际需要根据具体业务调整
    const submissionsToday = await getSubmissionCount(regionFilter, today)
    const submissionsThisWeek = await getSubmissionCount(regionFilter, thisWeek)
    const submissionsThisMonth = await getSubmissionCount(regionFilter, thisMonth)
    const submissionsTotal = await getSubmissionCount(regionFilter)

    // 获取模板统计
    const templatesTotal = await prisma.dataTemplate?.count() || 0
    const templatesActive = await prisma.dataTemplate?.count({
      where: { isActive: true }
    }) || 0

    // 获取用户统计（简化版本）
    const usersTotal = await prisma.user.count({
      where: regionFilter
    })
    
    // 模拟在线用户数（实际应该从缓存或会话管理中获取）
    const usersOnline = Math.floor(usersTotal * 0.1) // 假设10%的用户在线

    const stats = {
      villages: {
        total: villagesTotal,
        active: villagesActive,
        inactive: villagesTotal - villagesActive
      },
      submissions: {
        today: submissionsToday,
        thisWeek: submissionsThisWeek,
        thisMonth: submissionsThisMonth,
        total: submissionsTotal
      },
      templates: {
        total: templatesTotal,
        active: templatesActive
      },
      users: {
        online: usersOnline,
        total: usersTotal
      }
    }

    return NextResponse.json({
      message: '获取成功',
      data: stats
    })
  } catch (error) {
    console.error('Data collection statistics error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

function buildRegionFilter(user: any) {
  // 超级管理员和市级管理员可以查看所有区域
  if (user.role === 'SUPER_ADMIN' || user.role === 'CITY_ADMIN') {
    return {}
  }

  // 区市管理员可以查看本区市及下属区域
  if (user.role === 'DISTRICT_ADMIN') {
    return { regionCode: { startsWith: user.regionCode } }
  }

  // 其他角色只能查看自己区域
  return { regionCode: user.regionCode }
}

async function getSubmissionCount(regionFilter: any, startDate?: Date) {
  // 这里需要根据实际的数据提交记录表来实现
  // 暂时返回模拟数据
  const baseCount = 100
  
  if (startDate) {
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) return Math.floor(Math.random() * 10) + 5 // 今日
    if (daysDiff <= 7) return Math.floor(Math.random() * 50) + 20 // 本周
    if (daysDiff <= 30) return Math.floor(Math.random() * 200) + 80 // 本月
  }
  
  return baseCount + Math.floor(Math.random() * 50) // 总计
}