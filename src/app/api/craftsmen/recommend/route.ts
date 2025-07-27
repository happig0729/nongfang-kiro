import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 工匠推荐查询参数验证
const recommendQuerySchema = z.object({
  regionCode: z.string().optional(),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  specialties: z.array(z.string()).optional(),
  minCreditScore: z.number().min(0).max(100).optional(),
  projectType: z.enum(['NEW_CONSTRUCTION', 'RENOVATION', 'REPAIR', 'EXPANSION']).optional(),
  sortBy: z.enum(['creditScore', 'skillLevel', 'experience', 'rating']).default('creditScore'),
  limit: z.number().min(1).max(50).default(20),
})

// 获取推荐工匠列表
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
    
    // 解析查询参数
    const queryParams = {
      regionCode: searchParams.get('regionCode') || undefined,
      skillLevel: searchParams.get('skillLevel') || undefined,
      specialties: searchParams.get('specialties')?.split(',').filter(Boolean) || undefined,
      minCreditScore: searchParams.get('minCreditScore') ? parseInt(searchParams.get('minCreditScore')!) : undefined,
      projectType: searchParams.get('projectType') || undefined,
      sortBy: searchParams.get('sortBy') || 'creditScore',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    }

    const validation = recommendQuerySchema.safeParse(queryParams)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: '查询参数验证失败',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const params = validation.data

    // 构建查询条件
    const where: any = {
      status: 'ACTIVE', // 只推荐活跃的工匠
    }

    // 区域筛选
    if (params.regionCode) {
      where.regionCode = params.regionCode
    } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
      // 非管理员只能查看自己区域的工匠
      where.regionCode = user.regionCode
    }

    // 技能等级筛选
    if (params.skillLevel) {
      where.skillLevel = params.skillLevel
    }

    // 专业技能筛选
    if (params.specialties && params.specialties.length > 0) {
      where.specialties = {
        hasSome: params.specialties,
      }
    }

    // 最低信用分筛选
    if (params.minCreditScore) {
      where.creditScore = {
        gte: params.minCreditScore,
      }
    }

    // 构建排序条件
    let orderBy: any = []

    switch (params.sortBy) {
      case 'creditScore':
        orderBy = [
          { creditScore: 'desc' },
          { skillLevel: 'desc' },
          { createdAt: 'desc' },
        ]
        break
      case 'skillLevel':
        // 技能等级排序：EXPERT > ADVANCED > INTERMEDIATE > BEGINNER
        orderBy = [
          { 
            skillLevel: {
              sort: 'desc',
              nulls: 'last',
            }
          },
          { creditScore: 'desc' },
          { createdAt: 'desc' },
        ]
        break
      case 'experience':
        orderBy = [
          { joinDate: 'asc' }, // 入职时间早的经验更丰富
          { creditScore: 'desc' },
        ]
        break
      case 'rating':
        orderBy = [
          { creditScore: 'desc' },
          { skillLevel: 'desc' },
        ]
        break
      default:
        orderBy = [{ creditScore: 'desc' }]
    }

    // 查询推荐工匠
    const recommendedCraftsmen = await prisma.craftsman.findMany({
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
            creditEvaluations: true,
          },
        },
        // 获取最近的信用评价
        creditEvaluations: {
          where: { status: 'ACTIVE' },
          orderBy: { evaluationDate: 'desc' },
          take: 3,
          select: {
            evaluationType: true,
            pointsChange: true,
            evaluationDate: true,
          },
        },
        // 获取最近完成的项目
        constructionProjects: {
          where: { projectStatus: 'COMPLETED' },
          orderBy: { endDate: 'desc' },
          take: 3,
          select: {
            projectName: true,
            projectType: true,
            endDate: true,
          },
        },
      },
      orderBy,
      take: params.limit,
    })

    // 计算推荐分数和排名
    const craftmenWithScores = recommendedCraftsmen.map((craftsman, index) => {
      // 计算综合推荐分数
      let recommendScore = 0

      // 信用分权重 (40%)
      recommendScore += (craftsman.creditScore / 100) * 40

      // 技能等级权重 (30%)
      const skillLevelScores = {
        EXPERT: 30,
        ADVANCED: 22.5,
        INTERMEDIATE: 15,
        BEGINNER: 7.5,
      }
      recommendScore += skillLevelScores[craftsman.skillLevel as keyof typeof skillLevelScores] || 0

      // 项目经验权重 (20%)
      const projectCount = craftsman._count.constructionProjects
      recommendScore += Math.min(projectCount * 2, 20)

      // 培训记录权重 (10%)
      const trainingCount = craftsman._count.trainingRecords
      recommendScore += Math.min(trainingCount * 1, 10)

      return {
        ...craftsman,
        recommendScore: Math.round(recommendScore * 10) / 10,
        ranking: index + 1,
        // 添加推荐理由
        recommendReasons: generateRecommendReasons(craftsman),
      }
    })

    // 获取统计信息
    const totalCount = await prisma.craftsman.count({ where })
    const averageCreditScore = await prisma.craftsman.aggregate({
      where,
      _avg: { creditScore: true },
    })

    return NextResponse.json({
      message: '获取推荐工匠成功',
      data: {
        craftsmen: craftmenWithScores,
        statistics: {
          totalCount,
          averageCreditScore: Math.round((averageCreditScore._avg.creditScore || 0) * 10) / 10,
          recommendedCount: craftmenWithScores.length,
        },
        filters: params,
      },
    })
  } catch (error) {
    console.error('Get recommended craftsmen error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取推荐工匠失败' },
      { status: 500 }
    )
  }
}

// 生成推荐理由
function generateRecommendReasons(craftsman: any): string[] {
  const reasons: string[] = []

  // 信用分推荐理由
  if (craftsman.creditScore >= 95) {
    reasons.push('信用分优秀，口碑极佳')
  } else if (craftsman.creditScore >= 90) {
    reasons.push('信用分优秀，值得信赖')
  } else if (craftsman.creditScore >= 80) {
    reasons.push('信用分良好，表现稳定')
  }

  // 技能等级推荐理由
  if (craftsman.skillLevel === 'EXPERT') {
    reasons.push('专家级技能，经验丰富')
  } else if (craftsman.skillLevel === 'ADVANCED') {
    reasons.push('高级技能，技术过硬')
  }

  // 项目经验推荐理由
  const projectCount = craftsman._count.constructionProjects
  if (projectCount >= 20) {
    reasons.push('项目经验丰富，完成20+个项目')
  } else if (projectCount >= 10) {
    reasons.push('项目经验充足，完成10+个项目')
  } else if (projectCount >= 5) {
    reasons.push('有一定项目经验')
  }

  // 培训记录推荐理由
  const trainingCount = craftsman._count.trainingRecords
  if (trainingCount >= 10) {
    reasons.push('积极参与培训，持续学习提升')
  } else if (trainingCount >= 5) {
    reasons.push('注重技能提升，参与多次培训')
  }

  // 团队推荐理由
  if (craftsman.team) {
    reasons.push(`隶属${craftsman.team.name}，团队作业`)
  }

  // 最近表现推荐理由
  const recentPositiveEvaluations = craftsman.creditEvaluations.filter(
    (evaluation: any) => evaluation.pointsChange > 0
  ).length
  if (recentPositiveEvaluations >= 2) {
    reasons.push('近期表现优秀，获得多次好评')
  }

  return reasons.slice(0, 3) // 最多返回3个推荐理由
}