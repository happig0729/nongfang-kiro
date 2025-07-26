import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 培训记录更新数据验证
const updateTrainingSchema = z.object({
  trainingType: z.string().min(1, '培训类型不能为空').max(100, '培训类型长度不能超过100字符').optional(),
  trainingContent: z.string().min(1, '培训内容不能为空').optional(),
  durationHours: z.number().min(1, '培训学时必须大于0').max(100, '单次培训学时不能超过100小时').optional(),
  trainingDate: z.string().transform((str) => new Date(str)).optional(),
  instructor: z.string().min(1, '讲师姓名不能为空').max(100, '讲师姓名长度不能超过100字符').optional(),
  trainingLocation: z.string().max(200, '培训地点长度不能超过200字符').optional(),
  certificateUrl: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  remarks: z.string().optional(),
  completionStatus: z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
})

// 获取单个培训记录详情
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
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id } = params

    // 查询培训记录详情
    const trainingRecord = await prisma.trainingRecord.findUnique({
      where: { id },
      include: {
        craftsman: {
          select: {
            id: true,
            name: true,
            regionCode: true,
            regionName: true,
          },
        },
      },
    })

    if (!trainingRecord) {
      return NextResponse.json(
        { error: 'TRAINING_NOT_FOUND', message: '培训记录不存在' },
        { status: 404 }
      )
    }

    // 权限检查：非管理员只能查看自己区域的培训记录
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (trainingRecord.craftsman.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    return NextResponse.json({
      message: '获取培训记录详情成功',
      data: trainingRecord,
    })
  } catch (error) {
    console.error('Get training record error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取培训记录详情失败' },
      { status: 500 }
    )
  }
}

// 更新培训记录
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
    if (!checkPermission(user.role, 'training', 'update')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()
    const validation = updateTrainingSchema.safeParse(body)

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

    // 检查培训记录是否存在
    const existingRecord = await prisma.trainingRecord.findUnique({
      where: { id },
      include: {
        craftsman: {
          select: {
            regionCode: true,
          },
        },
      },
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'TRAINING_NOT_FOUND', message: '培训记录不存在' },
        { status: 404 }
      )
    }

    // 权限检查：非管理员只能修改自己区域的培训记录
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (existingRecord.craftsman.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    // 更新培训记录
    const updatedRecord = await prisma.trainingRecord.update({
      where: { id },
      data,
      include: {
        craftsman: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: '培训记录更新成功',
      data: updatedRecord,
    })
  } catch (error) {
    console.error('Update training record error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '更新培训记录失败' },
      { status: 500 }
    )
  }
}

// 删除培训记录
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
    if (!checkPermission(user.role, 'training', 'delete')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id } = params

    // 检查培训记录是否存在
    const existingRecord = await prisma.trainingRecord.findUnique({
      where: { id },
      include: {
        craftsman: {
          select: {
            regionCode: true,
          },
        },
      },
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'TRAINING_NOT_FOUND', message: '培训记录不存在' },
        { status: 404 }
      )
    }

    // 权限检查：非管理员只能删除自己区域的培训记录
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (existingRecord.craftsman.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    // 删除培训记录
    await prisma.trainingRecord.delete({
      where: { id },
    })

    return NextResponse.json({
      message: '培训记录删除成功',
    })
  } catch (error) {
    console.error('Delete training record error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '删除培训记录失败' },
      { status: 500 }
    )
  }
}