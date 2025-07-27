import { checkPermission, getUserPermissions } from '../src/lib/permissions'
import { UserRole } from '../generated/prisma'

console.log('=== 数据采集权限测试 ===\n')

// 测试不同角色的数据采集权限
const roles = [
  UserRole.SUPER_ADMIN,
  UserRole.CITY_ADMIN,
  UserRole.DISTRICT_ADMIN,
  UserRole.TOWN_ADMIN,
  UserRole.VILLAGE_ADMIN,
  UserRole.FARMER,
  UserRole.CRAFTSMAN,
  UserRole.INSPECTOR
]

const dataCollectionActions = [
  'read',
  'create',
  'update',
  'delete',
  'manage',
  'import',
  'export'
]

roles.forEach(role => {
  console.log(`\n角色: ${role}`)
  console.log('数据采集权限:')
  
  dataCollectionActions.forEach(action => {
    const hasPermission = checkPermission(role, 'data_collection', action)
    console.log(`  - ${action}: ${hasPermission ? '✓' : '✗'}`)
  })
  
  // 显示该角色的所有权限
  const allPermissions = getUserPermissions(role)
  const dataCollectionPermissions = allPermissions.filter(p => p.includes('data_collection'))
  if (dataCollectionPermissions.length > 0) {
    console.log('  具体权限:', dataCollectionPermissions.join(', '))
  }
})

console.log('\n=== 测试完成 ===')