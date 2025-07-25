import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions } from '@/lib/middleware'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { HouseType, ConstructionStatus, PropertyType } from '../../../../../generated/prisma'

// 农房更新数据验证schema
const updateHouseSchema = z.object({
  address: z.string().min(1, '地址不能为空').max(500, '地址长度不能超过500字符').optional(),
  buildingTime: z.string().optional().transform(val => val ? new Date(val) : undefined),
  floors: z.number().int().min(1, '层数必须大于0').max(10, '层数不能超过10层').optional(),
  height: z.number().positive('高度必须为正数').max(99.99, '高度不能超过99.99米').optional(),
  houseType: z.nativeEnum(HouseType).optional(),
  constructionStatus: z.nativeEnum(ConstructionStatus).optional(),
  landArea: z.number().positive('占地面积必须为正数').optional(),
  buildingArea: z.number().positive('建筑面积必须为正数').optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  coordinates: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/, '坐标格式错误').optional(),
  approvalNumber: z.string().max(100, '审批号长度不能超过100字符').optional(),
  completionDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
})

// 获取单个农房详情API
export const GET = requirePermissions([Permission.HOUSE_VIEW])(
  async (req: NextRequest, user) => {
    try {
      // 从URL路径中提取ID
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const houseId = pathSegments[pathSegments.length - 1]

      // 查询农房详情
      const house = await prisma.house.findUnique({
        where: { id: houseId },
        include: {
          applicant: {
            select: {
              id: true,
              realName: true,
              phone: true,
              email: true,
            }
          },
          housePhotos: {
            orderBy: { takenAt: 'desc' }
          },
          inspections: {
            include: {
              inspector: {
                select: {
                  id: true,
                  realName: true,
                }
              }
            },
            orderBy: { inspectionDate: 'desc' }
          },
          constructionProjects: {
            include: {
              craftsman: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  skillLevel: true,
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
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

      // 权限检查：非管理员只能查看自己区域的农房
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
        if (!house.regionCode.startsWith(user.regionCode)) {
          return NextResponse.json(
            {
              error: 'PERMISSION_DENIED',
              message: '无权访问该农房信息'
            },
            { status: 403 }
          )
        }
      }

      return NextResponse.json(
        {
          message: '获取农房详情成功',
          data: house
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Get house detail API error:', error)
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

// 更新农房信息API
export const PUT = requirePermissions([Permission.HOUSE_EDIT])(
  async (req: NextRequest, user) => {
    try {
      // 从URL路径中提取ID
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const houseId = pathSegments[pathSegments.length - 1]
      const body = await req.json()
      
      // 验证请求数据
      const validation = updateHouseSchema.safeParse(body)
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

      const updateData = validation.data

      // 检查农房是否存在
      const existingHouse = await prisma.house.findUnique({
        where: { id: houseId }
      })

      if (!existingHouse) {
        return NextResponse.json(
          {
            error: 'NOT_FOUND',
            message: '农房记录不存在'
          },
          { status: 404 }
        )
      }

      // 权限检查：非管理员只能编辑自己区域的农房
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
        if (!existingHouse.regionCode.startsWith(user.regionCode)) {
          return NextResponse.json(
            {
              error: 'PERMISSION_DENIED',
              message: '无权编辑该农房信息'
            },
            { status: 403 }
          )
        }
      }

      // 如果更新地址，检查是否与其他农房重复
      if (updateData.address && updateData.address !== existingHouse.address) {
        const duplicateHouse = await prisma.house.findFirst({
          where: {
            address: updateData.address,
            id: { not: houseId },
            constructionStatus: {
              not: 'CANCELLED'
            }
          }
        })

        if (duplicateHouse) {
          return NextResponse.json(
            {
              error: 'DUPLICATE_ADDRESS',
              message: '该地址已存在其他农房记录'
            },
            { status: 400 }
          )
        }
      }

      // 更新农房信息
      const updatedHouse = await prisma.house.update({
        where: { id: houseId },
        data: updateData,
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
          message: '农房信息更新成功',
          data: updatedHouse
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Update house API error:', error)
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

// 删除农房记录API
export const DELETE = requirePermissions([Permission.HOUSE_DELETE])(
  async (req: NextRequest, user) => {
    try {
      // 从URL路径中提取ID
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const houseId = pathSegments[pathSegments.length - 1]

      // 检查农房是否存在
      const existingHouse = await prisma.house.findUnique({
        where: { id: houseId },
        include: {
          _count: {
            select: {
              constructionProjects: true,
              inspections: true,
            }
          }
        }
      })

      if (!existingHouse) {
        return NextResponse.json(
          {
            error: 'NOT_FOUND',
            message: '农房记录不存在'
          },
          { status: 404 }
        )
      }

      // 权限检查：非管理员只能删除自己区域的农房
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
        if (!existingHouse.regionCode.startsWith(user.regionCode)) {
          return NextResponse.json(
            {
              error: 'PERMISSION_DENIED',
              message: '无权删除该农房信息'
            },
            { status: 403 }
          )
        }
      }

      // 检查是否有关联的建设项目或检查记录
      if (existingHouse._count.constructionProjects > 0 || existingHouse._count.inspections > 0) {
        return NextResponse.json(
          {
            error: 'HAS_DEPENDENCIES',
            message: '该农房存在关联的建设项目或检查记录，无法删除'
          },
          { status: 400 }
        )
      }

      // 删除农房记录（级联删除照片）
      await prisma.house.delete({
        where: { id: houseId }
      })

      return NextResponse.json(
        {
          message: '农房记录删除成功'
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Delete house API error:', error)
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