#!/usr/bin/env tsx

import { userService } from '../src/lib/db-utils'
import { prisma } from '../src/lib/prisma'

async function testDatabase() {
  console.log('🔍 测试数据库连接...')
  
  try {
    // 测试基本连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 测试表是否存在
    console.log('\n📊 检查数据库表结构...')
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    ` as Array<{ table_name: string }>

    if (tables.length === 0) {
      console.log('⚠️  数据库表不存在，请运行迁移脚本')
      console.log('   pnpm db:migrate 或 pnpm db:push')
    } else {
      console.log('✅ 发现以下数据表:')
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`)
      })
    }

    // 测试基本查询
    console.log('\n🔍 测试基本查询功能...')
    
    try {
      const userCount = await prisma.user.count()
      const houseCount = await prisma.house.count()
      const craftsmanCount = await prisma.craftsman.count()
      
      console.log('✅ 查询统计:')
      console.log(`   - 用户数量: ${userCount}`)
      console.log(`   - 农房数量: ${houseCount}`)
      console.log(`   - 工匠数量: ${craftsmanCount}`)
      
      if (userCount === 0) {
        console.log('\n💡 提示: 数据库为空，可以运行种子脚本初始化数据:')
        console.log('   pnpm db:seed')
      }
    } catch (error) {
      console.log('⚠️  查询测试跳过（表可能不存在）')
    }

    // 测试枚举类型
    console.log('\n🏷️  测试枚举类型...')
    try {
      const enumQuery = await prisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'UserRole'
        );
      ` as Array<{ enumlabel: string }>
      
      if (enumQuery.length > 0) {
        console.log('✅ UserRole 枚举类型:')
        enumQuery.forEach(item => {
          console.log(`   - ${item.enumlabel}`)
        })
      }
    } catch (error) {
      console.log('⚠️  枚举类型测试跳过')
    }

  } catch (error) {
    console.error('❌ 数据库测试失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n🎉 数据库配置测试完成！')
}

// 运行测试
testDatabase().catch(console.error)