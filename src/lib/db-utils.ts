import { prisma } from './prisma'
import { hashPassword } from './auth'
import { UserRole, UserStatus } from '../../generated/prisma'

// 用户数据库操作工具类
export class UserService {
  // 根据ID获取用户
  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
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
      }
    })
  }

  // 根据用户名获取用户
  async findByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { username },
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
      }
    })
  }

  // 创建用户
  async create(userData: any) {
    return await prisma.user.create({
      data: userData,
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
        createdAt: true,
        updatedAt: true,
      }
    })
  }

  // 更新用户
  async update(id: string, userData: any) {
    return await prisma.user.update({
      where: { id },
      data: userData,
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
        createdAt: true,
        updatedAt: true,
      }
    })
  }

  // 删除用户
  async delete(id: string) {
    return await prisma.user.delete({
      where: { id }
    })
  }

  // 获取用户列表
  async findMany(options: {
    where?: any
    skip?: number
    take?: number
    orderBy?: any
  }) {
    return await prisma.user.findMany({
      ...options,
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
      }
    })
  }

  // 统计用户数量
  async count(where?: any) {
    return await prisma.user.count({ where })
  }
}

// 创建默认管理员用户
export async function createDefaultAdmin() {
  try {
    // 检查是否已存在管理员用户
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN }
    })

    if (existingAdmin) {
      console.log('管理员用户已存在，跳过创建')
      return existingAdmin
    }

    // 创建默认管理员
    const hashedPassword = await hashPassword('admin123456')
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        realName: '系统管理员',
        phone: '13800138000',
        email: 'admin@qingdao.gov.cn',
        role: UserRole.SUPER_ADMIN,
        regionCode: '370200',
        regionName: '青岛市',
        status: UserStatus.ACTIVE
      }
    })

    console.log('默认管理员用户创建成功:', admin.username)
    return admin
  } catch (error) {
    console.error('创建默认管理员失败:', error)
    throw error
  }
}

// 创建示例用户数据
export async function createSampleUsers() {
  try {
    const sampleUsers = [
      {
        username: 'shinan_admin',
        password: await hashPassword('123456'),
        realName: '市南区管理员',
        phone: '13800138001',
        email: 'shinan@qingdao.gov.cn',
        role: UserRole.DISTRICT_ADMIN,
        regionCode: '370202',
        regionName: '市南区',
        status: UserStatus.ACTIVE
      },
      {
        username: 'shibei_admin',
        password: await hashPassword('123456'),
        realName: '市北区管理员',
        phone: '13800138002',
        email: 'shibei@qingdao.gov.cn',
        role: UserRole.DISTRICT_ADMIN,
        regionCode: '370203',
        regionName: '市北区',
        status: UserStatus.ACTIVE
      },
      {
        username: 'xianggang_admin',
        password: await hashPassword('123456'),
        realName: '香港中路街道管理员',
        phone: '13800138101',
        email: 'xianggang@qingdao.gov.cn',
        role: UserRole.TOWN_ADMIN,
        regionCode: '370202001',
        regionName: '香港中路街道',
        status: UserStatus.ACTIVE
      },
      {
        username: 'craftsman001',
        password: await hashPassword('123456'),
        realName: '张工匠',
        phone: '13700137001',
        email: 'zhang@craftsman.com',
        role: UserRole.CRAFTSMAN,
        regionCode: '370202001',
        regionName: '香港中路街道',
        status: UserStatus.ACTIVE
      },
      {
        username: 'farmer001',
        password: await hashPassword('123456'),
        realName: '李农户',
        phone: '13600136001',
        email: 'li@farmer.com',
        role: UserRole.FARMER,
        regionCode: '370202001',
        regionName: '香港中路街道',
        status: UserStatus.ACTIVE
      },
      {
        username: 'inspector001',
        password: await hashPassword('123456'),
        realName: '王检查员',
        phone: '13500135001',
        email: 'wang@inspector.com',
        role: UserRole.INSPECTOR,
        regionCode: '370202',
        regionName: '市南区',
        status: UserStatus.ACTIVE
      }
    ]

    for (const userData of sampleUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username }
      })

      if (!existingUser) {
        await prisma.user.create({ data: userData })
        console.log(`示例用户创建成功: ${userData.username}`)
      } else {
        console.log(`用户已存在，跳过创建: ${userData.username}`)
      }
    }

    console.log('示例用户数据创建完成')
  } catch (error) {
    console.error('创建示例用户失败:', error)
    throw error
  }
}

// 导出用户服务实例
export const userService = new UserService()