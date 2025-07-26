import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 团队创建数据验证
const createTeamSchema = z.object({
  name: z.string().min(1, '团队名称不能为空').max(200, '团队名称长度不能超过200字符'),
  teamType: z.enum(['CONSTRUCTION_TEAM', 'COOPERATIVE', 'PARTNERSHIP']),
  leaderId: z.string().uuid().optional(),
  regionCode: z.string().min(1, '区域代码不能为空'),
  regionName: z.string().min(1, '区域名称不能为空'),
  description: z.string().max(1000, '描述长度不能超过1000字符').optional(),
})

// 团队更新数据验证
const updateTeamSchema = createTeamSchema.partial()

// 获取团队列表
export async function GET(req: NextRequest) {
  try {
    // 验证用户身份
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    // 检查权限
    if (!checkPermission(user.role, 'team', 'read')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const search = searchParams.get('search') || ''
    const teamType = searchParams.get('teamType') || ''
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
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 筛选条件
    if (teamType) {
      where.teamType = teamType
    }

    if (status) {
      where.status = status
    }

    // 查询团队列表
    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          _count: {
            select: {
              craftsmen: true,
            },
          },
          craftsmen: {
            select: {
              id: true,
              name: true,
              skillLevel: true,
              creditScore: true,
            },
            take: 5, // 只显示前5个成员
            orderBy: {
              creditScore: 'desc',
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.team.count({ where }),
    ])

    return NextResponse.json({
      message: '获取团队列表成功',
      data: {
        teams,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('Get teams error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取团队列表失败' },
      { status: 500 }
    )
  }
}

// 创建团队
export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '未授权访问' }, { status: 401 })
    }

    // 检查权限
    if (!checkPermission(user.role, 'team', 'create')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: '权限不足' }, { status: 403 })
    }

    const body = await req.json()
    const validation = createTeamSchema.safeParse(body)

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

    // 检查团队名称是否已存在（同一区域内）
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: data.name,
        regionCode: data.regionCode,
      },
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'DUPLICATE_TEAM_NAME', message: '该区域内团队名称已存在' },
        { status: 400 }
      )
    }

    // 如果指定了队长，验证队长是否存在且为工匠
    if (data.leaderId) {
      const leader = await prisma.craftsman.findUnique({
        where: { id: data.leaderId },
      })

      if (!leader) {
        return NextResponse.json(
          { error: 'LEADER_NOT_FOUND', message: '指定的队长不存在' },
          { status: 400 }
        )
      }

      if (leader.regionCode !== data.regionCode) {
        return NextResponse.json(
          { error: 'LEADER_REGION_MISMATCH', message: '队长必须与团队在同一区域' },
          { status: 400 }
        )
      }
    }

    // 创建团队
    const team = await prisma.team.create({
      data,
      include: {
        _count: {
          select: {
            craftsmen: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: '团队创建成功',
        data: team,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '创建团队失败' },
      { status: 500 }
    )
  }
}