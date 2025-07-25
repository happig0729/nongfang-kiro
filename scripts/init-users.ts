#!/usr/bin/env tsx

import { createDefaultAdmin, createSampleUsers } from '../src/lib/db-utils'

async function initializeUsers() {
  console.log('🚀 开始初始化用户数据...\n')

  try {
    // 创建默认管理员
    console.log('1. 创建默认管理员用户')
    await createDefaultAdmin()
    
    // 创建示例用户
    console.log('\n2. 创建示例用户数据')
    await createSampleUsers()
    
    console.log('\n✅ 用户数据初始化完成！')
    console.log('\n默认管理员账户:')
    console.log('用户名: admin')
    console.log('密码: admin123456')
    console.log('\n示例用户账户密码均为: 123456')
    
  } catch (error) {
    console.error('❌ 用户数据初始化失败:', error)
    process.exit(1)
  }
}

// 运行初始化
initializeUsers()