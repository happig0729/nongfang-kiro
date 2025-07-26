import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 工匠创建数据验证
const createCraftsmanSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(100, '姓名长度不能超过100字符'),
  idNumber: z.string().regex(/^\d{17}[\dX]$/, '身份证号格式不正确'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  specialties: z.array(z.string()).min(1, '至少选择一项专业技能'),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
  certificationLevel: z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5']).optional(),
  teamId: z.string().uuid().optional(),
  regionCode: z.string().min(1, '区域代码不能为空'),
  regionName: z.string().min(1, '区域名称不能为空'),
  address: z.string().max(500, '地址长度不能超过500字符').optional(),
  emergencyContact: z.string().max(100, '紧急联系人姓名长度不能超过100字符').optional(),
  emergencyPhone: z.string().regex(/^1[3-9]\d{9}$/, '紧急联系人手机号格式不正确').optional(),
})

// 工匠更新数据验证
const updateCraftsmanSchema = createCraftsmanSchema.partial()

// 获取工匠列表
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const search = searchParams.get('search') || ''
    const skillLevel = searchParams.get('skillLevel') || ''
    const status = searchParams.get('status') || ''
    const regionCode = searchParams.get('regionCode') || ''

    // 构建查询条件
    const where: any = {}

    // 根据用户角色过滤数据
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      where.regionCode = user.regionCode
    } else if (regionCode) {
      where.regionCode = regionCode
    }

    // 搜索条件
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { idNumber: { contains: search } },
      ]
    }

    // 筛选条件
    if (skillLevel) {
      where.skillLevel = skillLevel
    }

    if (status) {
      where.status = status
    }

    // 查询工匠列表
    const [craftsmen, total] = await Promise.all([
      prisma.craftsman.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              teamType: true,
            },
          },
          _count: {
            select: {
              trainingRecords: true,
              constructionProjects: true,
            },
          },
        },
        orderBy: [
          { creditScore: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.craftsman.count({ where }),
    ])

    return NextResponse.json({
      message: '获取工匠列表成功',
      data: {
        craftsmen,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('Get craftsmen error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取工匠列表失败' },
      { status: 500 }
    )
  }
}

// 创建工匠
export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    // 检查权限
    if (!checkPermission(user.role, 'craftsman', 'create')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const body = await req.json()
    const validation = createCraftsmanSchema.safeParse(body)

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

    // 检查身份证号是否已存在
    const existingCraftsman = await prisma.craftsman.findUnique({
      where: { idNumber: data.idNumber },
    })

    if (existingCraftsman) {
      return NextResponse.json(
        { error: 'DUPLICATE_ID_NUMBER', message: '身份证号已存在' },
        { status: 400 }
      )
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

    // 创建工匠
    const craftsman = await prisma.craftsman.create({
      data: {
        ...data,
        joinDate: new Date(),
      },
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

    return NextResponse.json(
      {
        message: '工匠创建成功',
        data: craftsman,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create craftsman error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '创建工匠失败' },
      { status: 500 }
    )
  }
}