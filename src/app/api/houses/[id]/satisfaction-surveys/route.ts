import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// 满意度调查创建验证schema
const createSatisfactionSurveySchema = z.object({
  surveyType: z.enum(['NEW_BUILD_SATISFACTION', 'RENOVATION_SATISFACTION', 'EXPANSION_SATISFACTION', 'REPAIR_SATISFACTION']),
  overallScore: z.number().int().min(1).max(5),
  qualityScore: z.number().int().min(1).max(5).optional(),
  serviceScore: z.number().int().min(1).max(5).optional(),
  timeScore: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
  respondent: z.string().min(1, '受访者姓名不能为空').max(100, '受访者姓名过长'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  surveyDate: z.string().transform((str) => new Date(str)),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).default('COMPLETED'),
})

// 满意度调查更新验证schema
const updateSatisfactionSurveySchema = z.object({
  overallScore: z.number().int().min(1).max(5).optional(),
  qualityScore: z.number().int().min(1).max(5).optional(),
  serviceScore: z.number().int().min(1).max(5).optional(),
  timeScore: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
  respondent: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  surveyDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
})

// 获取农房的满意度调查列表
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
      if (!house.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权访问该区域的农房信息' }, { status: 403 })
      }
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url)
    const surveyType = searchParams.get('surveyType')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 构建查询条件
    const where: any = { houseId }

    if (surveyType) {
      where.surveyType = surveyType
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.surveyDate = {}
      if (startDate) {
        where.surveyDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.surveyDate.lte = new Date(endDate)
      }
    }

    // 查询满意度调查记录
    const satisfactionSurveys = await prisma.satisfactionSurvey.findMany({
      where,
      orderBy: [
        { surveyDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // 统计满意度情况
    const statistics = await prisma.satisfactionSurvey.groupBy({
      by: ['surveyType', 'overallScore'],
      where: { houseId },
      _count: { id: true },
    })

    // 计算平均满意度
    const averageScores = await prisma.satisfactionSurvey.aggregate({
      where: { houseId, status: 'COMPLETED' },
      _avg: {
        overallScore: true,
        qualityScore: true,
        serviceScore: true,
        timeScore: true,
      },
    })

    return NextResponse.json({
      message: '获取满意度调查记录成功',
      data: {
        house: {
          id: house.id,
          address: house.address,
        },
        surveys: satisfactionSurveys,
        statistics,
        averageScores,
      },
    })
  } catch (error) {
    console.error('Get satisfaction surveys error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取满意度调查记录失败' },
      { status: 500 }
    )
  }
}

// 创建满意度调查记录
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
      if (!house.regionCode.startsWith(user.regionCode)) {
        return NextResponse.json({ error: 'FORBIDDEN', message: '无权操作该区域的农房信息' }, { status: 403 })
      }
    }

    // 验证请求数据
    const body = await req.json()
    const validation = createSatisfactionSurveySchema.safeParse(body)

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

    // 创建满意度调查记录
    const satisfactionSurvey = await prisma.satisfactionSurvey.create({
      data: {
        ...data,
        houseId,
      },
    })

    return NextResponse.json({
      message: '创建满意度调查记录成功',
      data: satisfactionSurvey,
    }, { status: 201 })
  } catch (error) {
    console.error('Create satisfaction survey error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '创建满意度调查记录失败' },
      { status: 500 }
    )
  }
}