import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions } from '@/lib/middleware'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { HouseType, ConstructionStatus, PropertyType } from '../../../../generated/prisma'

// 农房查询参数验证schema
const houseQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  regionCode: z.string().optional(),
  houseType: z.nativeEnum(HouseType).optional(),
  constructionStatus: z.nativeEnum(ConstructionStatus).optional(),
  search: z.string().optional(),
})

// 农房创建数据验证schema
const createHouseSchema = z.object({
  address: z.string().min(1, '地址不能为空').max(500, '地址长度不能超过500字符'),
  buildingTime: z.string().optional().transform(val => val ? new Date(val) : undefined),
  floors: z.number().int().min(1, '层数必须大于0').max(10, '层数不能超过10层').optional(),
  height: z.number().positive('高度必须为正数').max(99.99, '高度不能超过99.99米').optional(),
  houseType: z.nativeEnum(HouseType),
  landArea: z.number().positive('占地面积必须为正数').optional(),
  buildingArea: z.number().positive('建筑面积必须为正数').optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  coordinates: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/, '坐标格式错误').optional(),
  approvalNumber: z.string().max(100, '审批号长度不能超过100字符').optional(),
})

// 获取农房列表API
export const GET = requirePermissions([Permission.HOUSE_VIEW])(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 验证查询参数
      const validation = houseQuerySchema.safeParse(queryParams)
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: '查询参数格式错误',
            details: validation.error.issues
          },
          { status: 400 }
        )
      }

      const { page, limit, regionCode, houseType, constructionStatus, search } = validation.data

      // 构建查询条件
      const where: any = {}
      
      // 根据用户权限过滤区域数据
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
        where.regionCode = { startsWith: user.regionCode }
      }
      
      if (regionCode) {
        where.regionCode = { contains: regionCode }
      }
      
      if (houseType) {
        where.houseType = houseType
      }
      
      if (constructionStatus) {
        where.constructionStatus = constructionStatus
      }
      
      if (search) {
        where.OR = [
          { address: { contains: search, mode: 'insensitive' } },
          { approvalNumber: { contains: search, mode: 'insensitive' } },
          { applicant: { realName: { contains: search, mode: 'insensitive' } } }
        ]
      }

      // 分页计算
      const skip = (page - 1) * limit

      // 查询农房列表
      const [houses, total] = await Promise.all([
        prisma.house.findMany({
          where,
          include: {
            applicant: {
              select: {
                id: true,
                realName: true,
                phone: true,
              }
            },
            _count: {
              select: {
                housePhotos: true,
                inspections: true,
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.house.count({ where })
      ])

      return NextResponse.json(
        {
          message: '获取农房列表成功',
          data: {
            houses,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          }
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Get houses API error:', error)
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

// 创建农房记录API
export const POST = requirePermissions([Permission.HOUSE_CREATE])(
  async (req: NextRequest, user) => {
    try {
      const body = await req.json()
      
      // 验证请求数据
      const validation = createHouseSchema.safeParse(body)
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

      const houseData = validation.data

      // 检查地址是否已存在
      const existingHouse = await prisma.house.findFirst({
        where: {
          address: houseData.address,
          constructionStatus: {
            not: 'CANCELLED'
          }
        }
      })

      if (existingHouse) {
        return NextResponse.json(
          {
            error: 'DUPLICATE_ADDRESS',
            message: '该地址已存在农房记录'
          },
          { status: 400 }
        )
      }

      // 创建农房记录
      const house = await prisma.house.create({
        data: {
          ...houseData,
          applicantId: user.id,
          regionCode: user.regionCode,
          regionName: user.regionName,
          constructionStatus: 'PLANNED'
        },
        include: {
          applicant: {
            select: {
              id: true,
              realName: true,
              phone: true,
            }
          }
        }
      })

      return NextResponse.json(
        {
          message: '农房记录创建成功',
          data: house
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Create house API error:', error)
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