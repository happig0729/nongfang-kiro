import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { UserRole, UserStatus } from '../../generated/prisma'

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// 用户认证接口
export interface AuthUser {
  id: string
  username: string
  realName: string
  role: UserRole
  regionCode: string
  regionName: string
  status: UserStatus
}

// JWT载荷接口
export interface JWTPayload {
  userId: string
  username: string
  role: UserRole
  regionCode: string
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// 生成JWT令牌
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

// 验证JWT令牌
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

// 从请求中验证用户身份
export async function verifyTokenFromRequest(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀
    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        regionCode: true,
        regionName: true,
        status: true,
      }
    })

    if (!user || user.status !== UserStatus.ACTIVE) {
      return null
    }

    return user
  } catch (error) {
    console.error('Verify token from request error:', error)
    return null
  }
}

// 用户登录
export async function authenticateUser(username: string, password: string): Promise<{
  success: boolean
  user?: AuthUser
  token?: string
  message?: string
}> {
  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        realName: true,
        role: true,
        regionCode: true,
        regionName: true,
        status: true,
      }
    })

    if (!user) {
      return { success: false, message: '用户名或密码错误' }
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      return { success: false, message: '账户已被禁用，请联系管理员' }
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return { success: false, message: '用户名或密码错误' }
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      regionCode: user.regionCode
    })

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      regionCode: user.regionCode,
      regionName: user.regionName,
      status: user.status
    }

    return { success: true, user: authUser, token }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, message: '登录失败，请稍后重试' }
  }
}

// 根据令牌获取用户信息
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        regionCode: true,
        regionName: true,
        status: true,
      }
    })

    if (!user || user.status !== UserStatus.ACTIVE) {
      return null
    }

    return user
  } catch (error) {
    console.error('Get user from token error:', error)
    return null
  }
}

// 用户注册
export async function registerUser(userData: {
  username: string
  password: string
  realName: string
  phone?: string
  email?: string
  role: UserRole
  regionCode: string
  regionName: string
}): Promise<{
  success: boolean
  user?: AuthUser
  message?: string
}> {
  try {
    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username }
    })

    if (existingUser) {
      return { success: false, message: '用户名已存在' }
    }

    // 加密密码
    const hashedPassword = await hashPassword(userData.password)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        status: UserStatus.ACTIVE
      },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        regionCode: true,
        regionName: true,
        status: true,
      }
    })

    return { success: true, user }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, message: '注册失败，请稍后重试' }
  }
}

// 重置密码
export async function resetPassword(username: string, newPassword: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return { success: false, message: '用户不存在' }
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword)

    // 更新密码
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return { success: true, message: '密码重置成功' }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, message: '密码重置失败，请稍后重试' }
  }
}