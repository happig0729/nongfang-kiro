import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 信用评价创建数据验证
const createCreditEvaluationSchema = z.object({
  evaluationType: z.string().min(1, '评价类型不能为空').max(50, '评价类型长度不能超过50字符'),
  pointsChange: z.number().int().min(-50, '单次扣分不能超过50分').max(20, '单次加分不能超过20分'),
  reason: z.string().min(1, '评价原因不能为空'),
  evidenceUrls: z.array(z.string()).optional().default([]),
  evaluationDate: z.string().transform((str) => new Date(str)).optional(),
})

// 获取工匠的信用评价记录列表
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
    if (!checkPermission(user.role, 'credit', 'view')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id: craftsmanId } = params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const evaluationType = searchParams.get('evaluationType') || ''
    const year = searchParams.get('year')

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

    // 权限检查：非管理员只能查看自己区域的工匠信用记录
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (craftsman.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    // 构建查询条件
    const where: any = {
      craftsmanId,
      status: 'ACTIVE', // 只查询有效的评价记录
    }

    // 按评价类型筛选
    if (evaluationType) {
      where.evaluationType = { contains: evaluationType, mode: 'insensitive' }
    }

    // 按年份筛选
    if (year) {
      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${year}-12-31`)
      where.evaluationDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    // 查询信用评价记录
    const [creditEvaluations, total] = await Promise.all([
      prisma.creditEvaluation.findMany({
        where,
        include: {
          evaluator: {
            select: {
              id: true,
              realName: true,
              role: true,
            },
          },
        },
        orderBy: { evaluationDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.creditEvaluation.count({ where }),
    ])

    // 计算信用统计信息
    const currentYear = new Date().getFullYear()
    const yearlyStats = await prisma.creditEvaluation.aggregate({
      where: {
        craftsmanId,
        evaluationDate: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`),
        },
        status: 'ACTIVE',
      },
      _sum: {
        pointsChange: true,
      },
      _count: {
        id: true,
      },
    })

    // 计算加分和减分统计
    const positiveStats = await prisma.creditEvaluation.aggregate({
      where: {
        craftsmanId,
        pointsChange: { gt: 0 },
        status: 'ACTIVE',
      },
      _sum: { pointsChange: true },
      _count: { id: true },
    })

    const negativeStats = await prisma.creditEvaluation.aggregate({
      where: {
        craftsmanId,
        pointsChange: { lt: 0 },
        status: 'ACTIVE',
      },
      _sum: { pointsChange: true },
      _count: { id: true },
    })

    return NextResponse.json({
      message: '获取信用评价记录成功',
      data: {
        creditEvaluations,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        statistics: {
          currentYear,
          currentScore: craftsman.creditScore,
          yearlyChange: yearlyStats._sum.pointsChange || 0,
          yearlyEvaluations: yearlyStats._count.id || 0,
          positivePoints: positiveStats._sum.pointsChange || 0,
          positiveCount: positiveStats._count.id || 0,
          negativePoints: negativeStats._sum.pointsChange || 0,
          negativeCount: negativeStats._count.id || 0,
        },
      },
    })
  } catch (error) {
    console.error('Get credit evaluations error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取信用评价记录失败' },
      { status: 500 }
    )
  }
}

// 为工匠添加信用评价记录
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
    if (!checkPermission(user.role, 'credit', 'evaluate')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id: craftsmanId } = params
    const body = await req.json()
    const validation = createCreditEvaluationSchema.safeParse(body)

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

    // 权限检查：非管理员只能为自己区域的工匠添加信用评价
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (craftsman.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    // 计算新的信用分
    const newCreditScore = Math.max(0, Math.min(100, craftsman.creditScore + data.pointsChange))

    // 使用事务同时创建评价记录和更新工匠信用分
    const result = await prisma.$transaction(async (tx) => {
      // 创建信用评价记录
      const creditEvaluation = await tx.creditEvaluation.create({
        data: {
          ...data,
          craftsmanId,
          evaluatorId: user.id,
          evaluationDate: data.evaluationDate || new Date(),
          status: 'ACTIVE',
        },
        include: {
          evaluator: {
            select: {
              id: true,
              realName: true,
              role: true,
            },
          },
        },
      })

      // 更新工匠信用分
      const updatedCraftsman = await tx.craftsman.update({
        where: { id: craftsmanId },
        data: { creditScore: newCreditScore },
      })

      return { creditEvaluation, updatedCraftsman }
    })

    return NextResponse.json(
      {
        message: '信用评价记录创建成功',
        data: {
          creditEvaluation: result.creditEvaluation,
          newCreditScore: result.updatedCraftsman.creditScore,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create credit evaluation error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '创建信用评价记录失败' },
      { status: 500 }
    )
  }
}