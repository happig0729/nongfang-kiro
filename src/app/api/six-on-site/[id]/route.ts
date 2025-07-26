import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

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

// 获取单个六到场记录详情
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

    const recordId = params.id

    // 查询六到场记录
    const sixOnSiteRecord = await prisma.sixOnSiteRecord.findUnique({
      where: { id: recordId },
      include: {
        house: {
          select: {
            id: true,
            address: true,
            regionCode: true,
            applicant: {
              select: {
                id: true,
                realName: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!sixOnSiteRecord) {
      return NextResponse.json({ error: 'RECORD_NOT_FOUND', message: '六到场记录不存在' }, { status: 404 })
    }

    // 检查区域权限
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (sixOnSiteRecord.house.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权访问该区域的记录' }, { status: 403 })
      }
    }

    return NextResponse.json({
      message: '获取六到场记录详情成功',
      data: sixOnSiteRecord,
    })
  } catch (error) {
    console.error('Get six on-site record error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取六到场记录详情失败' },
      { status: 500 }
    )
  }
}

// 更新六到场记录
export async function PUT(
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

    const recordId = params.id

    // 验证记录是否存在
    const existingRecord = await prisma.sixOnSiteRecord.findUnique({
      where: { id: recordId },
      include: {
        house: {
          select: { regionCode: true },
        },
      },
    })

    if (!existingRecord) {
      return NextResponse.json({ error: 'RECORD_NOT_FOUND', message: '六到场记录不存在' }, { status: 404 })
    }

    // 检查区域权限
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (existingRecord.house.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权操作该区域的记录' }, { status: 403 })
      }
    }

    // 验证请求数据
    const body = await req.json()
    const validation = updateSixOnSiteSchema.safeParse(body)

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

    // 更新六到场记录
    const updatedRecord = await prisma.sixOnSiteRecord.update({
      where: { id: recordId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        house: {
          select: {
            id: true,
            address: true,
            applicant: {
              select: {
                realName: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      message: '更新六到场记录成功',
      data: updatedRecord,
    })
  } catch (error) {
    console.error('Update six on-site record error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '更新六到场记录失败' },
      { status: 500 }
    )
  }
}

// 删除六到场记录
export async function DELETE(
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
    if (!checkPermission(user.role, 'house', 'delete')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const recordId = params.id

    // 验证记录是否存在
    const existingRecord = await prisma.sixOnSiteRecord.findUnique({
      where: { id: recordId },
      include: {
        house: {
          select: { regionCode: true },
        },
      },
    })

    if (!existingRecord) {
      return NextResponse.json({ error: 'RECORD_NOT_FOUND', message: '六到场记录不存在' }, { status: 404 })
    }

    // 检查区域权限
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (existingRecord.house.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权操作该区域的记录' }, { status: 403 })
      }
    }

    // 检查记录状态，已完成的记录不能删除
    if (existingRecord.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'CANNOT_DELETE_COMPLETED', message: '已完成的记录不能删除' },
        { status: 400 }
      )
    }

    // 删除六到场记录
    await prisma.sixOnSiteRecord.delete({
      where: { id: recordId },
    })

    return NextResponse.json({
      message: '删除六到场记录成功',
    })
  } catch (error) {
    console.error('Delete six on-site record error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '删除六到场记录失败' },
      { status: 500 }
    )
  }
}