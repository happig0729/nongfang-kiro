import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 工匠更新数据验证
const updateCraftsmanSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(100, '姓名长度不能超过100字符').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  specialties: z.array(z.string()).min(1, '至少选择一项专业技能').optional(),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  certificationLevel: z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5']).optional(),
  teamId: z.string().uuid().optional(),
  address: z.string().max(500, '地址长度不能超过500字符').optional(),
  emergencyContact: z.string().max(100, '紧急联系人姓名长度不能超过100字符').optional(),
  emergencyPhone: z.string().regex(/^1[3-9]\d{9}$/, '紧急联系人手机号格式不正确').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'RETIRED']).optional(),
})

// 获取单个工匠详情
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
    if (!checkPermission(user.role, 'craftsman', 'read')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id } = params

    // 查询工匠详情
    const craftsman = await prisma.craftsman.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            teamType: true,
            description: true,
          },
        },
        trainingRecords: {
          orderBy: { trainingDate: 'desc' },
          take: 10, // 最近10条培训记录
        },
        creditEvaluations: {
          orderBy: { evaluationDate: 'desc' },
          take: 10, // 最近10条信用评价记录
          include: {
            evaluator: {
              select: {
                realName: true,
              },
            },
          },
        },
        constructionProjects: {
          orderBy: { createdAt: 'desc' },
          take: 10, // 最近10个项目
          include: {
            house: {
              select: {
                address: true,
                houseType: true,
              },
            },
          },
        },
        _count: {
          select: {
            trainingRecords: true,
            creditEvaluations: true,
            constructionProjects: true,
          },
        },
      },
    })

    if (!craftsman) {
      return NextResponse.json(
        { error: 'CRAFTSMAN_NOT_FOUND', message: '工匠不存在' },
        { status: 404 }
      )
    }

    // 权限检查：非管理员只能查看自己区域的工匠
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (craftsman.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    return NextResponse.json({
      message: '获取工匠详情成功',
      data: craftsman,
    })
  } catch (error) {
    console.error('Get craftsman error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取工匠详情失败' },
      { status: 500 }
    )
  }
}

// 更新工匠信息
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
    if (!checkPermission(user.role, 'craftsman', 'update')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()
    const validation = updateCraftsmanSchema.safeParse(body)

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
    const existingCraftsman = await prisma.craftsman.findUnique({
      where: { id },
    })

    if (!existingCraftsman) {
      return NextResponse.json(
        { error: 'CRAFTSMAN_NOT_FOUND', message: '工匠不存在' },
        { status: 404 }
      )
    }

    // 权限检查：非管理员只能修改自己区域的工匠
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (existingCraftsman.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    // 如果指定了团队，验证团队是否存在
    if (data.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: data.teamId },
      })

      if (!team) {
        return NextResponse.json(
          { error: 'TEAM_NOT_FOUND', message: '指定的团队不存在' },
          { status: 400 }
        )
      }
    }

    // 更新工匠信息
    const updatedCraftsman = await prisma.craftsman.update({
      where: { id },
      data,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            teamType: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: '工匠信息更新成功',
      data: updatedCraftsman,
    })
  } catch (error) {
    console.error('Update craftsman error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '更新工匠信息失败' },
      { status: 500 }
    )
  }
}

// 删除工匠
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
    if (!checkPermission(user.role, 'craftsman', 'delete')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { id } = params

    // 检查工匠是否存在
    const existingCraftsman = await prisma.craftsman.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            constructionProjects: true,
          },
        },
      },
    })

    if (!existingCraftsman) {
      return NextResponse.json(
        { error: 'CRAFTSMAN_NOT_FOUND', message: '工匠不存在' },
        { status: 404 }
      )
    }

    // 权限检查：非管理员只能删除自己区域的工匠
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      if (existingCraftsman.regionCode !== user.regionCode) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
      }
    }

    // 检查是否有关联的建设项目
    if (existingCraftsman._count.constructionProjects > 0) {
      return NextResponse.json(
        { error: 'HAS_PROJECTS', message: '该工匠有关联的建设项目，无法删除' },
        { status: 400 }
      )
    }

    // 删除工匠（级联删除培训记录和信用评价）
    await prisma.craftsman.delete({
      where: { id },
    })

    return NextResponse.json({
      message: '工匠删除成功',
    })
  } catch (error) {
    console.error('Delete craftsman error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '删除工匠失败' },
      { status: 500 }
    )
  }
}