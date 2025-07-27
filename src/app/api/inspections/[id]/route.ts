import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

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

// 获取单个检查记录详情
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

    const inspectionId = params.id

    // 查询检查记录
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
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
        inspector: {
          select: {
            id: true,
            realName: true,
            phone: true,
          },
        },
      },
    })

    if (!inspection) {
      return NextResponse.json({ error: 'INSPECTION_NOT_FOUND', message: '检查记录不存在' }, { status: 404 })
    }

    // 检查区域权限
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!inspection.house.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权访问该区域的记录' }, { status: 403 })
      }
    }

    return NextResponse.json({
      message: '获取检查记录详情成功',
      data: inspection,
    })
  } catch (error) {
    console.error('Get inspection error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取检查记录详情失败' },
      { status: 500 }
    )
  }
}

// 更新检查记录
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
    if (!checkPermission(user.role, 'inspection', 'edit')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const inspectionId = params.id

    // 验证记录是否存在
    const existingInspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        house: {
          select: { regionCode: true },
        },
      },
    })

    if (!existingInspection) {
      return NextResponse.json({ error: 'INSPECTION_NOT_FOUND', message: '检查记录不存在' }, { status: 404 })
    }

    // 检查区域权限
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!existingInspection.house.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权操作该区域的记录' }, { status: 403 })
      }
    }

    // 验证请求数据
    const body = await req.json()
    const validation = updateInspectionSchema.safeParse(body)

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

    // 更新检查记录
    const updatedInspection = await prisma.inspection.update({
      where: { id: inspectionId },
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
      message: '更新检查记录成功',
      data: updatedInspection,
    })
  } catch (error) {
    console.error('Update inspection error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '更新检查记录失败' },
      { status: 500 }
    )
  }
}

// 删除检查记录
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
    if (!checkPermission(user.role, 'inspection', 'delete')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const inspectionId = params.id

    // 验证记录是否存在
    const existingInspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        house: {
          select: { regionCode: true },
        },
      },
    })

    if (!existingInspection) {
      return NextResponse.json({ error: 'INSPECTION_NOT_FOUND', message: '检查记录不存在' }, { status: 404 })
    }

    // 检查区域权限
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (!existingInspection.house.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权操作该区域的记录' }, { status: 403 })
      }
    }

    // 删除检查记录
    await prisma.inspection.delete({
      where: { id: inspectionId },
    })

    return NextResponse.json({
      message: '删除检查记录成功',
    })
  } catch (error) {
    console.error('Delete inspection error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '删除检查记录失败' },
      { status: 500 }
    )
  }
}