#!/usr/bin/env tsx

// API测试脚本 - 测试认证和权限管理API
const BASE_URL = 'http://localhost:3000'

interface ApiResponse {
  message?: string
  data?: any
  error?: string
}

async function makeRequest(
  endpoint: string, 
  method: string = 'GET', 
  body?: any, 
  token?: string
): Promise<{ status: number; data: ApiResponse }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await response.json()
  return { status: response.status, data }
}

async function testAuthAPIs() {
  console.log('🧪 开始测试认证API端点...\n')

  let adminToken: string = ''
  let userToken: string = ''

  try {
    // 1. 测试登录API
    console.log('1. 测试用户登录')
    
    // 测试管理员登录
    const adminLogin = await makeRequest('/api/auth/login', 'POST', {
      username: 'admin',
      password: 'admin123456'
    })
    
    if (adminLogin.status === 200) {
      adminToken = adminLogin.data.data.token
      console.log('✅ 管理员登录成功')
      console.log(`用户信息: ${adminLogin.data.data.user.realName} (${adminLogin.data.data.user.role})`)
    } else {
      console.log('❌ 管理员登录失败:', adminLogin.data.message)
    }

    // 测试普通用户登录
    const userLogin = await makeRequest('/api/auth/login', 'POST', {
      username: 'craftsman001',
      password: '123456'
    })
    
    if (userLogin.status === 200) {
      userToken = userLogin.data.data.token
      console.log('✅ 工匠用户登录成功')
      console.log(`用户信息: ${userLogin.data.data.user.realName} (${userLogin.data.data.user.role})`)
    } else {
      console.log('❌ 工匠用户登录失败:', userLogin.data.message)
    }

    // 测试错误登录
    const wrongLogin = await makeRequest('/api/auth/login', 'POST', {
      username: 'admin',
      password: 'wrongpassword'
    })
    
    if (wrongLogin.status === 401) {
      console.log('✅ 错误密码正确被拒绝')
    } else {
      console.log('❌ 错误密码意外通过')
    }

    // 2. 测试获取当前用户信息API
    console.log('\n2. 测试获取当前用户信息')
    
    if (adminToken) {
      const meResponse = await makeRequest('/api/auth/me', 'GET', null, adminToken)
      if (meResponse.status === 200) {
        console.log('✅ 获取管理员用户信息成功')
        console.log(`用户: ${meResponse.data.data.user.realName}`)
      } else {
        console.log('❌ 获取用户信息失败:', meResponse.data.message)
      }
    }

    // 测试无token访问
    const noTokenMe = await makeRequest('/api/auth/me', 'GET')
    if (noTokenMe.status === 401) {
      console.log('✅ 无token访问正确被拒绝')
    } else {
      console.log('❌ 无token访问意外通过')
    }

    // 3. 测试用户注册API（需要管理员权限）
    console.log('\n3. 测试用户注册')
    
    if (adminToken) {
      const registerResponse = await makeRequest('/api/auth/register', 'POST', {
        username: 'testuser001',
        password: '123456',
        realName: '测试用户',
        phone: '13900139001',
        email: 'test@example.com',
        role: 'FARMER',
        regionCode: '370202001',
        regionName: '香港中路街道'
      }, adminToken)
      
      if (registerResponse.status === 201) {
        console.log('✅ 管理员注册用户成功')
        console.log(`新用户: ${registerResponse.data.data.user.realName}`)
      } else {
        console.log('❌ 用户注册失败:', registerResponse.data.message)
      }
    }

    // 测试普通用户注册（应该被拒绝）
    if (userToken) {
      const unauthorizedRegister = await makeRequest('/api/auth/register', 'POST', {
        username: 'testuser002',
        password: '123456',
        realName: '测试用户2',
        role: 'FARMER',
        regionCode: '370202001',
        regionName: '香港中路街道'
      }, userToken)
      
      if (unauthorizedRegister.status === 403) {
        console.log('✅ 普通用户注册正确被拒绝')
      } else {
        console.log('❌ 普通用户注册意外通过')
      }
    }

    // 4. 测试密码重置API（需要管理员权限）
    console.log('\n4. 测试密码重置')
    
    if (adminToken) {
      const resetResponse = await makeRequest('/api/auth/reset-password', 'POST', {
        username: 'testuser001',
        newPassword: 'newpassword123'
      }, adminToken)
      
      if (resetResponse.status === 200) {
        console.log('✅ 管理员重置密码成功')
      } else {
        console.log('❌ 密码重置失败:', resetResponse.data.message)
      }
    }

    // 5. 测试用户列表API（需要管理员权限）
    console.log('\n5. 测试用户列表')
    
    if (adminToken) {
      const usersResponse = await makeRequest('/api/users?page=1&limit=5', 'GET', null, adminToken)
      
      if (usersResponse.status === 200) {
        console.log('✅ 获取用户列表成功')
        console.log(`用户数量: ${usersResponse.data.data.users.length}`)
        console.log(`总数: ${usersResponse.data.data.pagination.total}`)
      } else {
        console.log('❌ 获取用户列表失败:', usersResponse.data.message)
      }
    }

    // 测试普通用户访问用户列表（应该被拒绝）
    if (userToken) {
      const unauthorizedUsers = await makeRequest('/api/users', 'GET', null, userToken)
      
      if (unauthorizedUsers.status === 403) {
        console.log('✅ 普通用户访问用户列表正确被拒绝')
      } else {
        console.log('❌ 普通用户访问用户列表意外通过')
      }
    }

    console.log('\n🎉 API测试完成！')

  } catch (error) {
    console.error('❌ API测试过程中发生错误:', error)
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'GET'
    })
    return response.status === 405 // 应该返回方法不允许
  } catch (error) {
    return false
  }
}

async function main() {
  console.log('检查开发服务器是否运行...')
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ 开发服务器未运行，请先运行 pnpm dev')
    process.exit(1)
  }
  
  console.log('✅ 开发服务器正在运行\n')
  await testAuthAPIs()
}

main().catch(console.error)