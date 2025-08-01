import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 检查记录创建验证schema
const createInspectionSchema = z.object({
  inspectionType: z.enum(['SURVEY', 'DESIGN', 'CONSTRUCTION', 'SUPERVISION', 'BUILDING', 'QUALITY', 'SAFETY', 'PROGRESS']),
  inspectionDate: z.string().transform((str) => new Date(str)),
  result: z.enum(['PASS', 'FAIL', 'CONDITIONAL']),
  score: z.number().int().min(0).max(100).optional(),
  issues: z.string().optional(),
  suggestions: z.string().optional(),
  photos: z.array(z.string()).default([]),
  followUpDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'RESCHEDULED']).default('PENDING'),
})

// 检查记录更新验证schema
const updateInspectionSchema = z.object({
  inspectionDate: z.string().transform((str) => new Date(str)).optional(),
  result: z.enum(['PASS', 'FAIL', 'CONDITIONAL']).optional(),
  score: z.number().int().min(0).max(100).optional(),
  issues: z.string().optional(),
  suggestions: z.string().optional(),
  photos: z.array(z.string()).optional(),
  followUpDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'RESCHEDULED']).optional(),
})

// 获取农房的检查记录列表
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
    if (!checkPermission(user.role, 'inspection', 'view')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const houseId = params.id

    // 验证农房是否存在
    const house = await prisma.house.findUnique({
      where: { id: houseId },
      select: { id: true, regionCode: true, address: true },
    })

    if (!house) {
      return NextResponse.json({ error: 'HOUSE_NOT_FOUND', message: '农房不存在' }, { status: 404 })
    }

    // 检查区域权限
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!house.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权访问该区域的农房信息' }, { status: 403 })
      }
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url)
    const inspectionType = searchParams.get('inspectionType')
    const result = searchParams.get('result')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 构建查询条件
    const where: any = { houseId }

    if (inspectionType) {
      where.inspectionType = inspectionType
    }

    if (result) {
      where.result = result
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.inspectionDate = {}
      if (startDate) {
        where.inspectionDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.inspectionDate.lte = new Date(endDate)
      }
    }

    // 查询检查记录
    const inspections = await prisma.inspection.findMany({
      where,
      include: {
        inspector: {
          select: {
            id: true,
            realName: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { inspectionDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // 统计检查情况
    const statistics = await prisma.inspection.groupBy({
      by: ['inspectionType', 'result'],
      where: { houseId },
      _count: { id: true },
    })

    return NextResponse.json({
      message: '获取检查记录成功',
      data: {
        house: {
          id: house.id,
          address: house.address,
        },
        inspections,
        statistics,
      },
    })
  } catch (error) {
    console.error('Get inspections error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取检查记录失败' },
      { status: 500 }
    )
  }
}

// 创建检查记录
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
    if (!checkPermission(user.role, 'inspection', 'create')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const houseId = params.id

    // 验证农房是否存在
    const house = await prisma.house.findUnique({
      where: { id: houseId },
      select: { id: true, regionCode: true },
    })

    if (!house) {
      return NextResponse.json({ error: 'HOUSE_NOT_FOUND', message: '农房不存在' }, { status: 404 })
    }

    // 检查区域权限
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!house.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权操作该区域的农房信息' }, { status: 403 })
      }
    }

    // 验证请求数据
    const body = await req.json()
    const validation = createInspectionSchema.safeParse(body)

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

    // 创建检查记录
    const inspection = await prisma.inspection.create({
      data: {
        ...data,
        houseId,
        inspectorId: user.id,
      },
      include: {
        inspector: {
          select: {
            id: true,
            realName: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: '创建检查记录成功',
      data: inspection,
    }, { status: 201 })
  } catch (error) {
    console.error('Create inspection error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '创建检查记录失败' },
      { status: 500 }
    )
  }
}