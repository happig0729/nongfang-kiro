import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

async function testLogin() {
  console.log('=== 登录功能测试 ===\n')
  
  try {
    // 查找一个管理员用户
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['SUPER_ADMIN', 'CITY_ADMIN', 'DISTRICT_ADMIN'] },
        status: 'ACTIVE'
      }
    })
    
    if (!adminUser) {
      console.log('❌ 没有找到活跃的管理员用户')
      return
    }
    
    console.log(`找到管理员用户: ${adminUser.realName} (${adminUser.username})`)
    console.log(`角色: ${adminUser.role}`)
    console.log(`区域: ${adminUser.regionCode}`)
    
    // 检查密码哈希
    if (!adminUser.password) {
      console.log('❌ 用户没有设置密码')
      return
    }
    
    // 测试密码验证（假设密码是 'admin123'）
    const testPassword = 'admin123'
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password)
    
    console.log(`\n密码验证 (${testPassword}): ${isPasswordValid ? '✓' : '✗'}`)
    
    if (isPasswordValid) {
      // 生成JWT token
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
      
      console.log('\n生成的JWT Token:')
      console.log(token)
      
      console.log('\n✅ 登录测试成功！')
      console.log('可以使用以下信息登录:')
      console.log(`用户名: ${adminUser.username}`)
      console.log(`密码: ${testPassword}`)
    } else {
      console.log('\n❌ 密码验证失败')
      console.log('可能需要重置用户密码')
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()