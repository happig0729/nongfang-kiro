import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function resetAdminPassword() {
  console.log('=== 重置管理员密码 ===\n')
  
  try {
    // 查找所有管理员用户
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'CITY_ADMIN', 'DISTRICT_ADMIN'] },
        status: 'ACTIVE'
      }
    })
    
    if (adminUsers.length === 0) {
      console.log('❌ 没有找到活跃的管理员用户')
      return
    }
    
    console.log(`找到 ${adminUsers.length} 个管理员用户`)
    
    // 生成新密码哈希
    const newPassword = 'admin123'
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
    
    // 更新所有管理员用户的密码
    for (const adminUser of adminUsers) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword }
      })
      
      console.log(`✅ ${adminUser.realName} (${adminUser.username}) - 角色: ${adminUser.role} - 区域: ${adminUser.regionCode}`)
    }
    
    console.log(`\n✅ 所有管理员密码重置成功！`)
    console.log(`新密码: ${newPassword}`)
    
    console.log('\n现在可以使用这些凭据登录系统了。')
    
  } catch (error) {
    console.error('密码重置失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()