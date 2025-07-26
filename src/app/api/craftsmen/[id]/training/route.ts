import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 培训记录创建数据验证
const createTrainingSchema = z.object({
  trainingType: z.string().min(1, '培训类型不能为空').max(100, '培训类型长度不能超过100字符'),
  trainingContent: z.string().min(1, '培训内容不能为空'),
  durationHours: z.number().min(1, '培训学时必须大于0').max(100, '单次培训学时不能超过100小时'),
  trainingDate: z.string().transform((str) => new Date(str)),
  instructor: z.string().min(1, '讲师姓名不能为空').max(100, '讲师姓名长度不能超过100字符'),
  trainingLocation: z.string().max(200, '培训地点长度不能超过200字符').optional(),
  certificateUrl: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  remarks: z.string().optional(),
  completionStatus: z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).default('IN_PROGRESS'),
})

// 培训记录更新数据验证
const updateTrainingSchema = createTrainingSchema.partial()

// 获取工匠的培训记录列表
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    // 检查权限
    if (!checkPermission(user.role, 'training', 'read')) {
      console.error('Training permission denied:', {
        userRole: user.role,
        resource: 'training',
        action: 'read',
        userId: user.id,
      })
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id: craftsmanId } = params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const year = searchParams.get('year')
    const trainingType = searchParams.get('trainingType') || ''
    const completionStatus = searchParams.get('completionStatus') || ''

    // 检查工匠是否存在
    const craftsman = await prisma.craftsman.findUnique({
      where: { id: craftsmanId },
    })

    if (!craftsman) {
      return NextResponse.json(
        { error: 'CRAFTSMAN_NOT_FOUND', message: '工匠不存在' },
        { status: 404 }
      )
    }

    // 权限检查：非管理员只能查看自己区域的工匠培训记录
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (craftsman.regionCode !== user.regionCode) {
        console.error('Region access denied:', {
          userRole: user.role,
          userRegion: user.regionCode,
          craftsmanRegion: craftsman.regionCode,
          craftsmanId,
        })
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    // 构建查询条件
    const where: any = {
      craftsmanId,
    }

    // 按年份筛选
    if (year) {
      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${year}-12-31`)
      where.trainingDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    // 按培训类型筛选
    if (trainingType) {
      where.trainingType = { contains: trainingType, mode: 'insensitive' }
    }

    // 按完成状态筛选
    if (completionStatus) {
      where.completionStatus = completionStatus
    }

    // 查询培训记录
    const [trainingRecords, total] = await Promise.all([
      prisma.trainingRecord.findMany({
        where,
        orderBy: { trainingDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.trainingRecord.count({ where }),
    ])

    // 计算培训统计信息
    const currentYear = new Date().getFullYear()
    const yearlyStats = await prisma.trainingRecord.aggregate({
      where: {
        craftsmanId,
        trainingDate: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`),
        },
        completionStatus: 'COMPLETED',
      },
      _sum: {
        durationHours: true,
      },
    })

    // 计算线下培训学时（假设培训类型包含"线下"的为线下培训）
    const offlineStats = await prisma.trainingRecord.aggregate({
      where: {
        craftsmanId,
        trainingDate: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`),
        },
        completionStatus: 'COMPLETED',
        trainingType: { contains: '线下', mode: 'insensitive' },
      },
      _sum: {
        durationHours: true,
      },
    })

    const totalHours = yearlyStats._sum.durationHours || 0
    const offlineHours = offlineStats._sum.durationHours || 0

    return NextResponse.json({
      message: '获取培训记录成功',
      data: {
        trainingRecords,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        statistics: {
          currentYear,
          totalHours,
          offlineHours,
          requiredTotalHours: 40,
          requiredOfflineHours: 24,
          totalProgress: Math.min((totalHours / 40) * 100, 100),
          offlineProgress: Math.min((offlineHours / 24) * 100, 100),
        },
      },
    })
  } catch (error) {
    console.error('Get training records error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取培训记录失败' },
      { status: 500 }
    )
  }
}

// 为工匠添加培训记录
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    // 检查权限
    if (!checkPermission(user.role, 'training', 'create')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id: craftsmanId } = params
    const body = await req.json()
    const validation = createTrainingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: '数据验证失败',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // 检查工匠是否存在
    const craftsman = await prisma.craftsman.findUnique({
      where: { id: craftsmanId },
    })

    if (!craftsman) {
      return NextResponse.json(
        { error: 'CRAFTSMAN_NOT_FOUND', message: '工匠不存在' },
        { status: 404 }
      )
    }

    // 权限检查：非管理员只能为自己区域的工匠添加培训记录
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (craftsman.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    // 创建培训记录
    const trainingRecord = await prisma.trainingRecord.create({
      data: {
        ...data,
        craftsmanId,
      },
    })

    return NextResponse.json(
      {
        message: '培训记录创建成功',
        data: trainingRecord,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create training record error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '创建培训记录失败' },
      { status: 500 }
    )
  }
}