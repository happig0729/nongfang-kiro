import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions } from '@/lib/middleware'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { PhotoType } from '../../../../../../generated/prisma'

// 照片上传数据验证schema
const uploadPhotoSchema = z.object({
  photoUrl: z.string().min(1, '照片URL不能为空'),
  photoType: z.nativeEnum(PhotoType),
  description: z.string().max(200, '描述长度不能超过200字符').optional(),
  takenAt: z.string().transform(val => new Date(val)),
})

// 获取农房照片列表API
export const GET = requirePermissions([Permission.HOUSE_VIEW])(
  async (req: NextRequest, user) => {
    try {
      // 从URL路径中提取ID
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const houseId = pathSegments[pathSegments.length - 2] // photos前面的ID
      const { searchParams } = new URL(req.url)
      const photoType = searchParams.get('type') as PhotoType | null

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
              message: '无权访问该农房照片'
            },
            { status: 403 }
          )
        }
      }

      // 构建查询条件
      const where: any = { houseId }
      if (photoType) {
        where.photoType = photoType
      }

      // 查询照片列表
      const photos = await prisma.housePhoto.findMany({
        where,
        orderBy: [
          { photoType: 'asc' },
          { takenAt: 'desc' }
        ]
      })

      return NextResponse.json(
        {
          message: '获取农房照片成功',
          data: photos
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Get house photos API error:', error)
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

// 上传农房照片API
export const POST = requirePermissions([Permission.HOUSE_EDIT])(
  async (req: NextRequest, user) => {
    try {
      // 从URL路径中提取ID
      const url = new URL(req.url)
      const pathSegments = url.pathname.split('/')
      const houseId = pathSegments[pathSegments.length - 2] // photos前面的ID
      const body = await req.json()
      
      // 验证请求数据
      const validation = uploadPhotoSchema.safeParse(body)
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

      const photoData = validation.data

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
              message: '无权上传该农房照片'
            },
            { status: 403 }
          )
        }
      }

      // 创建照片记录
      const photo = await prisma.housePhoto.create({
        data: {
          ...photoData,
          houseId,
          uploadedBy: user.id,
        }
      })

      return NextResponse.json(
        {
          message: '照片上传成功',
          data: photo
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Upload house photo API error:', error)
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