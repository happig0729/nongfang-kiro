import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions } from '@/lib/middleware'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { InspectionType, InspectionResult, InspectionStatus } from '../../../../../../generated/prisma'

// 检查记录创建数据验证schema
const createInspectionSchema = z.object({
  inspectionType: z.nativeEnum(InspectionType),
  inspectionDate: z.string().transform(val => new Date(val)),
  result: z.nativeEnum(InspectionResult),
  score: z.number().int().min(0).max(100).optional(),
  issues: z.string().optional(),
  suggestions: z.string().optional(),
  photos: z.array(z.string()).optional(),
})

// 获取农房检查记录列表API
export const GET = requirePermissions([Permission.INSPECTION_VIEW])(
  async (req: NextRequest, user) => {
    try {
      // 从URL路径中提取ID
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const houseId = pathSegments[pathSegments.length - 2] // inspections前面的ID

      // 检查农房是否存在且用户有权限访问
      const house = await prisma.house.findUnique({
        where: { id: houseId },
        select: { regionCode: true }
      })

      if (!house) {
        return NextResponse.json(
          {
            error: 'NOT_FOUND',
            message: '农房记录不存在'
          },
          { status: 404 }
        )
      }

      // 权限检查
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
        if (!house.regionCode.startsWith(user.regionCode)) {
          return NextResponse.json(
            {
              error: 'PERMISSION_DENIED',
              message: '无权访问该农房检查记录'
            },
            { status: 403 }
          )
        }
      }

      // 查询检查记录列表
      const inspections = await prisma.inspection.findMany({
        where: { houseId },
        include: {
          inspector: {
            select: {
              id: true,
              realName: true,
            }
          }
        },
        orderBy: { inspectionDate: 'desc' }
      })

      return NextResponse.json(
        {
          message: '获取检查记录成功',
          data: inspections
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Get house inspections API error:', error)
      return NextResponse.json(
        {
          error: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        },
        { status: 500 }
      )
    }
  }
)

// 创建农房检查记录API
export const POST = requirePermissions([Permission.INSPECTION_CREATE])(
  async (req: NextRequest, user) => {
    try {
      // 从URL路径中提取ID
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const houseId = pathSegments[pathSegments.length - 2] // inspections前面的ID
      const body = await req.json()
      
      // 验证请求数据
      const validation = createInspectionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: '数据验证失败',
            details: validation.error.issues
          },
          { status: 400 }
        )
      }

      const inspectionData = validation.data

      // 检查农房是否存在且用户有权限访问
      const house = await prisma.house.findUnique({
        where: { id: houseId },
        select: { regionCode: true }
      })

      if (!house) {
        return NextResponse.json(
          {
            error: 'NOT_FOUND',
            message: '农房记录不存在'
          },
          { status: 404 }
        )
      }

      // 权限检查
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
        if (!house.regionCode.startsWith(user.regionCode)) {
          return NextResponse.json(
            {
              error: 'PERMISSION_DENIED',
              message: '无权创建该农房检查记录'
            },
            { status: 403 }
          )
        }
      }

      // 创建检查记录
      const inspection = await prisma.inspection.create({
        data: {
          ...inspectionData,
          houseId,
          inspectorId: user.id,
          photos: inspectionData.photos || [],
          status: 'COMPLETED',
        },
        include: {
          inspector: {
            select: {
              id: true,
              realName: true,
            }
          }
        }
      })

      return NextResponse.json(
        {
          message: '检查记录创建成功',
          data: inspection
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Create house inspection API error:', error)
      return NextResponse.json(
        {
          error: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        },
        { status: 500 }
      )
    }
  }
)