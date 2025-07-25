import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth'
import { requirePermissions } from '@/lib/middleware'
import { Permission } from '@/lib/permissions'
import { z } from 'zod'

// 密码重置请求验证schema
const resetPasswordSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名长度不能超过50个字符'),
  newPassword: z.string().min(6, '新密码长度至少6个字符').max(100, '新密码长度不能超过100个字符'),
})

// 密码重置API - 需要管理员权限
export const POST = requirePermissions([Permission.USER_MANAGE])(
  async (req: NextRequest) => {
    try {
      const body = await req.json()
      
      // 验证请求数据
      const validation = resetPasswordSchema.safeParse(body)
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

      const { username, newPassword } = validation.data

      // 执行密码重置
      const result = await resetPassword(username, newPassword)

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'RESET_FAILED',
            message: result.message || '密码重置失败'
          },
          { status: 400 }
        )
      }

      // 重置成功
      return NextResponse.json(
        {
          message: result.message || '密码重置成功'
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Reset password API error:', error)
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