import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'
import { requirePermissions } from '@/lib/middleware'
import { Permission } from '@/lib/permissions'
import { UserRole } from '../../../../../generated/prisma'
import { z } from 'zod'

// 注册请求验证schema
const registerSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名长度不能超过50个字符'),
  password: z.string().min(6, '密码长度至少6个字符').max(100, '密码长度不能超过100个字符'),
  realName: z.string().min(1, '真实姓名不能为空').max(100, '真实姓名长度不能超过100个字符'),
  phone: z.string().optional(),
  email: z.string().email('邮箱格式不正确').optional(),
  role: z.nativeEnum(UserRole),
  regionCode: z.string().min(1, '区域代码不能为空').max(20, '区域代码长度不能超过20个字符'),
  regionName: z.string().min(1, '区域名称不能为空').max(100, '区域名称长度不能超过100个字符'),
})

// 用户注册API - 需要管理员权限
export const POST = requirePermissions([Permission.USER_MANAGE])(
  async (req: NextRequest) => {
    try {
      const body = await req.json()
      
      // 验证请求数据
      const validation = registerSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: '请求数据格式错误',
            details: validation.error.issues
          },
          { status: 400 }
        )
      }

      const userData = validation.data

      // 执行用户注册
      const result = await registerUser(userData)

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'REGISTRATION_FAILED',
            message: result.message || '注册失败'
          },
          { status: 400 }
        )
      }

      // 注册成功
      return NextResponse.json(
        {
          message: '用户注册成功',
          data: {
            user: result.user
          }
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Register API error:', error)
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

// 不支持其他HTTP方法
export async function GET() {
  return NextResponse.json(
    { error: 'METHOD_NOT_ALLOWED', message: '不支持的请求方法' },
    { status: 405 }
  )
}