import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 六到场记录创建验证schema
const createSixOnSiteSchema = z.object({
  onSiteType: z.enum(['SURVEY', 'DESIGN', 'CONSTRUCTION', 'SUPERVISION', 'BUILDING', 'QUALITY']),
  scheduledDate: z.string().transform((str) => new Date(str)),
  responsibleUnit: z.string().min(1, '负责单位不能为空').max(200, '负责单位名称过长'),
  contactPerson: z.string().min(1, '联系人不能为空').max(100, '联系人姓名过长'),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  actualDate: z.string().transform((str) => new Date(str)).optional(),
  arrivalTime: z.string().transform((str) => new Date(str)).optional(),
  departureTime: z.string().transform((str) => new Date(str)).optional(),
  workContent: z.string().optional(),
  findings: z.string().optional(),
  suggestions: z.string().optional(),
  photos: z.array(z.string()).default([]),
  documents: z.array(z.string()).default([]),
  remarks: z.string().optional(),
})

// 六到场记录更新验证schema
const updateSixOnSiteSchema = z.object({
  scheduledDate: z.string().transform((str) => new Date(str)).optional(),
  responsibleUnit: z.string().min(1).max(200).optional(),
  contactPerson: z.string().min(1).max(100).optional(),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED', 'RESCHEDULED']).optional(),
  actualDate: z.string().transform((str) => new Date(str)).optional(),
  arrivalTime: z.string().transform((str) => new Date(str)).optional(),
  departureTime: z.string().transform((str) => new Date(str)).optional(),
  workContent: z.string().optional(),
  findings: z.string().optional(),
  suggestions: z.string().optional(),
  photos: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  remarks: z.string().optional(),
})

// 获取农房的六到场记录列表
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
    if (!checkPermission(user.role, 'house', 'read')) {
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
      if (house.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权访问该区域的农房信息' }, { status: 403 })
      }
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url)
    const onSiteType = searchParams.get('onSiteType')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 构建查询条件
    const where: any = { houseId }

    if (onSiteType) {
      where.onSiteType = onSiteType
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.scheduledDate = {}
      if (startDate) {
        where.scheduledDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.scheduledDate.lte = new Date(endDate)
      }
    }

    // 查询六到场记录
    const sixOnSiteRecords = await prisma.sixOnSiteRecord.findMany({
      where,
      orderBy: [
        { scheduledDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // 统计各类型到场情况
    const statistics = await prisma.sixOnSiteRecord.groupBy({
      by: ['onSiteType', 'status'],
      where: { houseId },
      _count: { id: true },
    })

    return NextResponse.json({
      message: '获取六到场记录成功',
      data: {
        house: {
          id: house.id,
          address: house.address,
        },
        records: sixOnSiteRecords,
        statistics,
      },
    })
  } catch (error) {
    console.error('Get six on-site records error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取六到场记录失败' },
      { status: 500 }
    )
  }
}

// 创建六到场记录
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
    if (!checkPermission(user.role, 'house', 'update')) {
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
      if (house.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权操作该区域的农房信息' }, { status: 403 })
      }
    }

    // 验证请求数据
    const body = await req.json()
    const validation = createSixOnSiteSchema.safeParse(body)

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

    // 检查是否已存在相同类型的记录
    const existingRecord = await prisma.sixOnSiteRecord.findFirst({
      where: {
        houseId,
        onSiteType: data.onSiteType,
        status: { not: 'CANCELLED' },
      },
    })

    if (existingRecord) {
      return NextResponse.json(
        { error: 'DUPLICATE_RECORD', message: '该类型的到场记录已存在' },
        { status: 400 }
      )
    }

    // 创建六到场记录
    const sixOnSiteRecord = await prisma.sixOnSiteRecord.create({
      data: {
        ...data,
        houseId,
        recordedBy: user.id,
        status: 'SCHEDULED',
      },
    })

    return NextResponse.json({
      message: '创建六到场记录成功',
      data: sixOnSiteRecord,
    }, { status: 201 })
  } catch (error) {
    console.error('Create six on-site record error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '创建六到场记录失败' },
      { status: 500 }
    )
  }
}