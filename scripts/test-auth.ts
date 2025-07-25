#!/usr/bin/env tsx

import { hashPassword, verifyPassword, generateToken, verifyToken, authenticateUser, registerUser } from '../src/lib/auth'
import { hasPermission, canAccessRegion, getRoleDisplayName } from '../src/lib/permissions'
import { Permission } from '../src/lib/permissions'
import { UserRole, UserStatus } from '../generated/prisma'

async function testAuthSystem() {
  console.log('🧪 开始测试用户认证和权限管理系统...\n')

  // 测试密码加密和验证
  console.log('1. 测试密码加密和验证')
  const password = 'test123456'
  const hashedPassword = await hashPassword(password)
  console.log(`原始密码: ${password}`)
  console.log(`加密后密码: ${hashedPassword}`)
  
  const isValid = await verifyPassword(password, hashedPassword)
  console.log(`密码验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`)
  
  const isInvalid = await verifyPassword('wrongpassword', hashedPassword)
  console.log(`错误密码验证结果: ${isInvalid ? '❌ 意外通过' : '✅ 正确拒绝'}\n`)

  // 测试JWT令牌生成和验证
  console.log('2. 测试JWT令牌生成和验证')
  const payload = {
    userId: 'test-user-id',
    username: 'testuser',
    role: UserRole.CITY_ADMIN,
    regionCode: '370200'
  }
  
  const token = generateToken(payload)
  console.log(`生成的JWT令牌: ${token.substring(0, 50)}...`)
  
  const decodedPayload = verifyToken(token)
  console.log(`解码的载荷:`, decodedPayload)
  console.log(`JWT验证结果: ${decodedPayload ? '✅ 通过' : '❌ 失败'}`)
  
  const invalidToken = verifyToken('invalid.token.here')
  console.log(`无效令牌验证结果: ${invalidToken ? '❌ 意外通过' : '✅ 正确拒绝'}\n`)

  // 测试权限系统
  console.log('3. 测试权限系统')
  const testRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.CITY_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.TOWN_ADMIN,
    UserRole.VILLAGE_ADMIN,
    UserRole.CRAFTSMAN,
    UserRole.FARMER,
    UserRole.INSPECTOR
  ]

  testRoles.forEach(role => {
    console.log(`\n角色: ${getRoleDisplayName(role)}`)
    console.log(`- 用户管理权限: ${hasPermission(role, Permission.USER_MANAGE) ? '✅' : '❌'}`)
    console.log(`- 农房查看权限: ${hasPermission(role, Permission.HOUSE_VIEW) ? '✅' : '❌'}`)
    console.log(`- 工匠管理权限: ${hasPermission(role, Permission.CRAFTSMAN_CREATE) ? '✅' : '❌'}`)
    console.log(`- 系统管理权限: ${hasPermission(role, Permission.SYSTEM_ADMIN) ? '✅' : '❌'}`)
  })

  // 测试区域权限
  console.log('\n4. 测试区域权限')
  const regionTests = [
    { role: UserRole.SUPER_ADMIN, userRegion: '370200', targetRegion: '370300', expected: true },
    { role: UserRole.CITY_ADMIN, userRegion: '370200', targetRegion: '370300', expected: true },
    { role: UserRole.DISTRICT_ADMIN, userRegion: '370200', targetRegion: '370201', expected: true },
    { role: UserRole.DISTRICT_ADMIN, userRegion: '370200', targetRegion: '370300', expected: false },
    { role: UserRole.TOWN_ADMIN, userRegion: '370201', targetRegion: '370201', expected: true },
    { role: UserRole.TOWN_ADMIN, userRegion: '370201', targetRegion: '370202', expected: false },
  ]

  regionTests.forEach(test => {
    const result = canAccessRegion(test.role, test.userRegion, test.targetRegion)
    const status = result === test.expected ? '✅' : '❌'
    console.log(`${getRoleDisplayName(test.role)} (${test.userRegion}) 访问 ${test.targetRegion}: ${status}`)
  })

  console.log('\n🎉 认证系统测试完成！')
}

// 运行测试
testAuthSystem().catch(console.error)