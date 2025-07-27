import { NextRequest } from 'next/server'
import { GET } from '../src/app/api/data-collection/villages/route'
import { prisma } from '../src/lib/prisma'
import jwt from 'jsonwebtoken'

async function testVillagesAPI() {
  console.log('=== 测试村庄列表API ===\n')
  
  try {
    // 获取管理员用户
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    })
    
    if (!adminUser) {
      console.log('❌ 没有找到超级管理员用户')
      return
    }
    
    console.log(`使用用户: ${adminUser.realName} (${adminUser.username})`)
    console.log(`角色: ${adminUser.role}`)
    console.log(`区域: ${adminUser.regionCode}`)
    
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
    
    console.log('\n生成的Token:', token.substring(0, 50) + '...')
    
    // 创建模拟请求
    const mockRequest = new NextRequest('http://localhost:3000/api/data-collection/villages', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('\n发送API请求...')
    
    // 调用API
    const response = await GET(mockRequest)
    const responseData = await response.json()
    
    console.log(`\n响应状态: ${response.status}`)
    console.log('响应数据:', JSON.stringify(responseData, null, 2))
    
    if (response.status === 200) {
      console.log('\n✅ API调用成功！')
      console.log(`找到 ${responseData.data?.length || 0} 个村庄`)
    } else {
      console.log('\n❌ API调用失败')
      console.log('错误信息:', responseData.message || responseData.error)
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testVillagesAPI()