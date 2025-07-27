import { prisma } from '../src/lib/prisma'

async function seedVillages() {
  console.log('=== 创建测试村庄数据 ===\n')
  
  try {
    // 获取管理员用户
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    })
    
    if (!adminUser) {
      console.log('❌ 没有找到管理员用户')
      return
    }
    
    // 创建测试村庄数据
    const testVillages = [
      {
        villageName: '城阳区流亭街道东流亭村',
        villageCode: '370214001001',
        regionCode: '370214',
        portalUrl: '/data-collection/village/370214001001',
        isActive: true,
        dataTemplates: ['house_basic', 'house_construction'],
        permissions: [],
        createdBy: adminUser.id
      },
      {
        villageName: '城阳区流亭街道西流亭村',
        villageCode: '370214001002',
        regionCode: '370214',
        portalUrl: '/data-collection/village/370214001002',
        isActive: true,
        dataTemplates: ['house_basic', 'craftsman_info'],
        permissions: [],
        createdBy: adminUser.id
      },
      {
        villageName: '市南区八大关街道太平角村',
        villageCode: '370202001001',
        regionCode: '370202',
        portalUrl: '/data-collection/village/370202001001',
        isActive: true,
        dataTemplates: ['house_basic', 'house_construction', 'inspection_record'],
        permissions: [],
        createdBy: adminUser.id
      },
      {
        villageName: '崂山区沙子口街道沙子口村',
        villageCode: '370212001001',
        regionCode: '370212',
        portalUrl: '/data-collection/village/370212001001',
        isActive: false,
        dataTemplates: ['house_basic'],
        permissions: [],
        createdBy: adminUser.id
      }
    ]
    
    // 批量创建村庄
    for (const villageData of testVillages) {
      try {
        const village = await prisma.villagePortal.create({
          data: villageData
        })
        
        console.log(`✅ 创建村庄: ${village.villageName} (${village.villageCode})`)
      } catch (error) {
        console.log(`❌ 创建村庄失败: ${villageData.villageName} - ${error.message}`)
      }
    }
    
    console.log('\n=== 村庄数据创建完成 ===')
    
    // 验证创建结果
    const totalVillages = await prisma.villagePortal.count()
    console.log(`数据库中共有 ${totalVillages} 个村庄`)
    
  } catch (error) {
    console.error('创建测试数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedVillages()