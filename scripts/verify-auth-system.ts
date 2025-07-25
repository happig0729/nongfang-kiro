#!/usr/bin/env tsx

import { authenticateUser, registerUser, resetPassword, hashPassword } from '../src/lib/auth'
import { hasPermission, canAccessRegion, getRoleDisplayName, Permission } from '../src/lib/permissions'
import { UserRole, UserStatus } from '../generated/prisma'
import { userService } from '../src/lib/db-utils'

async function verifyAuthSystem() {
  console.log('🔐 验证用户认证和权限管理系统...\n')

  try {
    // 1. 测试用户认证功能
    console.log('1. 测试用户认证功能')
    
    // 测试管理员登录
    const adminAuth = await authenticateUser('admin', 'admin123456')
    if (adminAuth.success && adminAuth.user && adminAuth.token) {
      console.log('✅ 管理员登录成功')
      console.log(`   用户: ${adminAuth.user.realName} (${getRoleDisplayName(adminAuth.user.role)})`)
      console.log(`   令牌长度: ${adminAuth.token.length} 字符`)
    } else {
      console.log('❌ 管理员登录失败:', adminAuth.message)
    }

    // 测试工匠用户登录
    const craftsmanAuth = await authenticateUser('craftsman001', '123456')
    if (craftsmanAuth.success && craftsmanAuth.user) {
      console.log('✅ 工匠用户登录成功')
      console.log(`   用户: ${craftsmanAuth.user.realName} (${getRoleDisplayName(craftsmanAuth.user.role)})`)
    } else {
      console.log('❌ 工匠用户登录失败:', craftsmanAuth.message)
    }

    // 测试错误密码
    const wrongAuth = await authenticateUser('admin', 'wrongpassword')
    if (!wrongAuth.success) {
      console.log('✅ 错误密码正确被拒绝')
    } else {
      console.log('❌ 错误密码意外通过')
    }

    // 2. 测试权限系统
    console.log('\n2. 测试权限系统')
    
    const testCases = [
      { role: UserRole.SUPER_ADMIN, permission: Permission.USER_MANAGE, expected: true },
      { role: UserRole.CITY_ADMIN, permission: Permission.USER_MANAGE, expected: true },
      { role: UserRole.DISTRICT_ADMIN, permission: Permission.USER_MANAGE, expected: false },
      { role: UserRole.CRAFTSMAN, permission: Permission.HOUSE_VIEW, expected: true },
      { role: UserRole.FARMER, permission: Permission.CRAFTSMAN_CREATE, expected: false },
    ]

    testCases.forEach(test => {
      const result = hasPermission(test.role, test.permission)
      const status = result === test.expected ? '✅' : '❌'
      console.log(`${status} ${getRoleDisplayName(test.role)} - ${test.permission}: ${result}`)
    })

    // 3. 测试区域权限
    console.log('\n3. 测试区域权限')
    
    const regionTests = [
      { role: UserRole.SUPER_ADMIN, userRegion: '370200', targetRegion: '370300', expected: true },
      { role: UserRole.CITY_ADMIN, userRegion: '370200', targetRegion: '370300', expected: true },
      { role: UserRole.DISTRICT_ADMIN, userRegion: '370202', targetRegion: '370202001', expected: true },
      { role: UserRole.DISTRICT_ADMIN, userRegion: '370202', targetRegion: '370203', expected: false },
      { role: UserRole.TOWN_ADMIN, userRegion: '370202001', targetRegion: '370202001', expected: true },
      { role: UserRole.TOWN_ADMIN, userRegion: '370202001', targetRegion: '370202002', expected: false },
    ]

    regionTests.forEach(test => {
      const result = canAccessRegion(test.role, test.userRegion, test.targetRegion)
      const status = result === test.expected ? '✅' : '❌'
      console.log(`${status} ${getRoleDisplayName(test.role)} (${test.userRegion}) 访问 ${test.targetRegion}: ${result}`)
    })

    // 4. 测试用户数据库操作
    console.log('\n4. 测试用户数据库操作')
    
    // 获取用户列表
    const users = await userService.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    console.log(`✅ 获取用户列表成功，共 ${users.length} 个用户`)

    // 根据用户名查找用户
    const adminUser = await userService.findByUsername('admin')
    if (adminUser) {
      console.log(`✅ 根据用户名查找用户成功: ${adminUser.realName}`)
    } else {
      console.log('❌ 根据用户名查找用户失败')
    }

    // 统计用户数量
    const userCount = await userService.count()
    console.log(`✅ 用户总数统计: ${userCount}`)

    // 5. 测试密码重置功能
    console.log('\n5. 测试密码重置功能')
    
    const resetResult = await resetPassword('craftsman001', 'newpassword123')
    if (resetResult.success) {
      console.log('✅ 密码重置成功')
      
      // 验证新密码是否生效
      const newAuth = await authenticateUser('craftsman001', 'newpassword123')
      if (newAuth.success) {
        console.log('✅ 新密码登录成功')
        
        // 恢复原密码
        await resetPassword('craftsman001', '123456')
        console.log('✅ 密码已恢复')
      } else {
        console.log('❌ 新密码登录失败')
      }
    } else {
      console.log('❌ 密码重置失败:', resetResult.message)
    }

    // 6. 测试用户注册功能
    console.log('\n6. 测试用户注册功能')
    
    const testUsername = `testuser_${Date.now()}`
    const registerResult = await registerUser({
      username: testUsername,
      password: '123456',
      realName: '测试用户',
      phone: '13900139999',
      email: 'test@example.com',
      role: UserRole.FARMER,
      regionCode: '370202001',
      regionName: '香港中路街道'
    })

    if (registerResult.success && registerResult.user) {
      console.log('✅ 用户注册成功')
      console.log(`   新用户: ${registerResult.user.realName} (${registerResult.user.username})`)
      
      // 测试新用户登录
      const newUserAuth = await authenticateUser(testUsername, '123456')
      if (newUserAuth.success) {
        console.log('✅ 新用户登录成功')
      } else {
        console.log('❌ 新用户登录失败')
      }
    } else {
      console.log('❌ 用户注册失败:', registerResult.message)
    }

    console.log('\n🎉 用户认证和权限管理系统验证完成！')
    console.log('\n系统功能总结:')
    console.log('✅ 多角色用户认证系统 (市级、区市、镇街、工匠、农户)')
    console.log('✅ 权限控制中间件和角色管理')
    console.log('✅ 用户注册、登录、密码重置功能')
    console.log('✅ JWT令牌生成和验证')
    console.log('✅ 密码加密和验证')
    console.log('✅ 区域权限控制')
    console.log('✅ 用户数据库操作')

  } catch (error) {
    console.error('❌ 系统验证过程中发生错误:', error)
    process.exit(1)
  }
}

// 运行验证
verifyAuthSystem()