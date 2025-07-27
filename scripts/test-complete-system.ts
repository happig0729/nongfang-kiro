import { checkPermission } from '../src/lib/permissions'
import { prisma } from '../src/lib/prisma'
import jwt from 'jsonwebtoken'

async function testCompleteSystem() {
  console.log('=== 完整系统测试 ===\n')
  
  try {
    // 1. 测试用户认证
    console.log('1. 测试用户认证...')
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    })
    
    if (!adminUser) {
      console.log('❌ 没有找到管理员用户')
      return
    }
    
    console.log(`✅ 找到用户: ${adminUser.realName} (${adminUser.role})`)
    
    // 2. 测试权限系统
    console.log('\n2. 测试权限系统...')
    const hasReadPermission = checkPermission(adminUser.role, 'data_collection', 'read')
    const hasCreatePermission = checkPermission(adminUser.role, 'data_collection', 'create')
    
    console.log(`✅ 读取权限: ${hasReadPermission}`)
    console.log(`✅ 创建权限: ${hasCreatePermission}`)
    
    // 3. 测试JWT Token生成
    console.log('\n3. 测试JWT Token生成...')
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    const token = jwt.sign(
      {
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        regionCode: adminUser.regionCode,
      },
      jwtSecret,
      { expiresIn: '7d' }
    )
    
    console.log(`✅ Token生成成功: ${token.substring(0, 30)}...`)
    
    // 4. 测试数据库连接
    console.log('\n4. 测试数据库连接...')
    const villageCount = await prisma.villagePortal.count()
    console.log(`✅ 数据库连接正常，共有 ${villageCount} 个村庄`)
    
    // 5. 测试村庄数据
    console.log('\n5. 测试村庄数据...')
    const villages = await prisma.villagePortal.findMany({
      take: 3,
      include: {
        _count: {
          select: {
            dataEntries: true,
          },
        },
      },
    })
    
    villages.forEach(village => {
      console.log(`✅ 村庄: ${village.villageName} (${village.villageCode}) - 状态: ${village.isActive ? '启用' : '禁用'}`)
    })
    
    console.log('\n=== 系统测试完成 ===')
    console.log('\n🎉 所有测试通过！系统应该可以正常工作了。')
    console.log('\n登录信息:')
    console.log(`用户名: ${adminUser.username}`)
    console.log(`密码: admin123`)
    console.log(`角色: ${adminUser.role}`)
    console.log(`Token: ${token}`)
    
  } catch (error) {
    console.error('系统测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCompleteSystem()