#!/usr/bin/env tsx

/**
 * 测试文件上传功能
 */

import { existsSync } from 'fs'
import path from 'path'

async function testUploadDirectory() {
  console.log('🔍 检查上传目录...')
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'houses')
  
  if (existsSync(uploadDir)) {
    console.log('✅ 上传目录存在:', uploadDir)
  } else {
    console.log('❌ 上传目录不存在:', uploadDir)
  }
  
  // 检查权限
  try {
    const testFile = path.join(uploadDir, 'test.txt')
    const fs = await import('fs/promises')
    await fs.writeFile(testFile, 'test')
    await fs.unlink(testFile)
    console.log('✅ 目录可写')
  } catch (error) {
    console.log('❌ 目录不可写:', error)
  }
}

testUploadDirectory().catch(console.error)