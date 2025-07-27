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

    if (!hasPermission(user.role, Permission.DATA_COLLECTION_MANAGE)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const action = searchParams.get('action')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const userId = searchParams.get('userId')
    const isExport = searchParams.get('export') === 'true'

    // 构建查询条件
    const where: any = {}

    // 时间范围过滤
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    }

    // 操作类型过滤
    if (action) {
      where.action = action
    }

    // 状态过滤
    if (status) {
      where.status = status
    }

    // 用户过滤
    if (userId) {
      where.userId = userId
    }

    // 搜索过滤
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { resourceId: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 区域权限过滤
    const regionFilter = buildRegionFilter(user)
    if (Object.keys(regionFilter).length > 0) {
      // 这里需要根据实际的审计日志表结构来调整
      // 假设审计日志表有regionCode字段
      Object.assign(where, regionFilter)
    }

    if (isExport) {
      // 导出功能
      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              realName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10000 // 限制导出数量
      })

      // 这里应该生成Excel文件并返回
      // 暂时返回JSON格式
      return NextResponse.json({
        message: '导出成功',
        data: logs
      })
    }

    // 获取总数
    const total = await prisma.auditLog.count({ where })

    // 获取分页数据
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            realName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // 格式化数据
    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.realName || '未知用户',
      userRole: log.user?.role || 'UNKNOWN',
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.createdAt,
      status: log.status,
      duration: log.details?.duration || null
    }))

    return NextResponse.json({
      message: '获取成功',
      data: {
        logs: formattedLogs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

function buildRegionFilter(user: any) {
  // 超级管理员和市级管理员可以查看所有区域的日志
  if (user.role === 'SUPER_ADMIN' || user.role === 'CITY_ADMIN') {
    return {}
  }

  // 区市管理员可以查看本区市及下属区域的日志
  if (user.role === 'DISTRICT_ADMIN') {
    return { regionCode: { startsWith: user.regionCode } }
  }

  // 其他角色只能查看自己区域的日志
  return { regionCode: user.regionCode }
}