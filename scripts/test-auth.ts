import { prisma } from '../src/lib/prisma'

async function testAuth() {
  console.log('=== 认证系统测试 ===\n')
  
  try {
    // 检查数据库中的用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        regionCode: true,
        status: true,
      },
      take: 10
    })
    
    console.log('数据库中的用户:')
    users.forEach(user => {
      console.log(`  - ${user.realName} (${user.username}) - 角色: ${user.role} - 区域: ${user.regionCode} - 状态: ${user.status}`)
    })
    
    // 检查是否有管理员用户
    const adminUsers = users.filter(user => 
      ['SUPER_ADMIN', 'CITY_ADMIN', 'DISTRICT_ADMIN'].includes(user.role)
    )
    
    console.log(`\n管理员用户数量: ${adminUsers.length}`)
    
    if (adminUsers.length === 0) {
      console.log('⚠️  没有找到管理员用户，这可能是权限问题的原因')
      console.log('建议创建一个管理员用户进行测试')
    }
    
  } catch (error) {
    console.error('数据库查询失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()