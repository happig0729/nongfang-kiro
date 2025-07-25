import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions } from '@/lib/middleware'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 用户查询参数验证schema
const userQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  role: z.string().optional(),
  regionCode: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
})

// 获取用户列表API - 需要用户管理权限
export const GET = requirePermissions([Permission.USER_MANAGE])(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 验证查询参数
      const validation = userQuerySchema.safeParse(queryParams)
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

      const { page, limit, role, regionCode, status, search } = validation.data

      // 构建查询条件
      const where: any = {}
      
      if (role) {
        where.role = role
      }
      
      if (regionCode) {
        where.regionCode = { contains: regionCode }
      }
      
      if (status) {
        where.status = status
      }
      
      if (search) {
        where.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { realName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }

      // 分页计算
      const skip = (page - 1) * limit

      // 查询用户列表
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            realName: true,
            phone: true,
            email: true,
            role: true,
            regionCode: true,
            regionName: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ])

      return NextResponse.json(
        {
          message: '获取用户列表成功',
          data: {
            users,
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
      console.error('Get users API error:', error)
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