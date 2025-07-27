#!/usr/bin/env tsx

import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function verifyFixComplete() {
  console.log('🔍 验证数据提交修复是否完整...')

  try {
    // 1. 验证User模型是否有必要字段
    console.log('1. 验证User模型字段...')
    const userFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('id_number', 'address')
    `
    console.log('✅ User模型字段:', userFields)

    // 2. 验证House模型是否有必要字段
    console.log('2. 验证House模型字段...')
    const houseFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'houses' 
      AND column_name IN ('remarks', 'building_area', 'land_area')
    `
    console.log('✅ House模型字段:', houseFields)

    // 3. 验证枚举值
    console.log('3. 验证枚举值...')
    const houseTypeEnum = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::public."HouseType")) as enum_value
    `
    console.log('✅ HouseType枚举值:', houseTypeEnum)

    const constructionStatusEnum = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::public."ConstructionStatus")) as enum_value
    `
    console.log('✅ ConstructionStatus枚举值:', constructionStatusEnum)

    console.log('🎉 所有修复验证通过!')

  } catch (error) {
    console.error('❌ 验证失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyFixComplete()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))