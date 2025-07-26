import { UserRole } from '../../generated/prisma'

// 权限定义
export enum Permission {
  // 系统管理权限
  SYSTEM_ADMIN = 'system:admin',
  USER_MANAGE = 'user:manage',

  // 农房管理权限
  HOUSE_VIEW = 'house:view',
  HOUSE_CREATE = 'house:create',
  HOUSE_EDIT = 'house:edit',
  HOUSE_DELETE = 'house:delete',
  HOUSE_APPROVE = 'house:approve',

  // 工匠管理权限
  CRAFTSMAN_VIEW = 'craftsman:view',
  CRAFTSMAN_CREATE = 'craftsman:create',
  CRAFTSMAN_EDIT = 'craftsman:edit',
  CRAFTSMAN_DELETE = 'craftsman:delete',
  CRAFTSMAN_APPROVE = 'craftsman:approve',

  // 培训管理权限
  TRAINING_VIEW = 'training:view',
  TRAINING_CREATE = 'training:create',
  TRAINING_EDIT = 'training:edit',
  TRAINING_DELETE = 'training:delete',

  // 信用评价权限
  CREDIT_VIEW = 'credit:view',
  CREDIT_EVALUATE = 'credit:evaluate',
  CREDIT_MANAGE = 'credit:manage',

  // 质量监管权限
  INSPECTION_VIEW = 'inspection:view',
  INSPECTION_CREATE = 'inspection:create',
  INSPECTION_EDIT = 'inspection:edit',
  INSPECTION_CONDUCT = 'inspection:conduct',

  // 六到场管理权限
  SIX_ON_SITE_VIEW = 'six_on_site:view',
  SIX_ON_SITE_CREATE = 'six_on_site:create',
  SIX_ON_SITE_EDIT = 'six_on_site:edit',
  SIX_ON_SITE_DELETE = 'six_on_site:delete',
  SIX_ON_SITE_MANAGE = 'six_on_site:manage',

  // 数据统计权限
  STATISTICS_VIEW = 'statistics:view',
  STATISTICS_EXPORT = 'statistics:export',

  // 个人信息权限
  PROFILE_VIEW = 'profile:view',
  PROFILE_EDIT = 'profile:edit',
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // 超级管理员 - 拥有所有权限
  [UserRole.SUPER_ADMIN]: Object.values(Permission),

  // 市级管理员 - 拥有大部分管理权限
  [UserRole.CITY_ADMIN]: [
    Permission.USER_MANAGE,
    Permission.HOUSE_VIEW,
    Permission.HOUSE_CREATE,
    Permission.HOUSE_EDIT,
    Permission.HOUSE_APPROVE,
    Permission.CRAFTSMAN_VIEW,
    Permission.CRAFTSMAN_CREATE,
    Permission.CRAFTSMAN_EDIT,
    Permission.CRAFTSMAN_APPROVE,
    Permission.TRAINING_VIEW,
    Permission.TRAINING_CREATE,
    Permission.TRAINING_EDIT,
    Permission.CREDIT_VIEW,
    Permission.CREDIT_EVALUATE,
    Permission.CREDIT_MANAGE,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_EDIT,
    Permission.INSPECTION_CONDUCT,
    Permission.SIX_ON_SITE_VIEW,
    Permission.SIX_ON_SITE_CREATE,
    Permission.SIX_ON_SITE_EDIT,
    Permission.SIX_ON_SITE_DELETE,
    Permission.SIX_ON_SITE_MANAGE,
    Permission.STATISTICS_VIEW,
    Permission.STATISTICS_EXPORT,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],

  // 区市管理员 - 区域管理权限
  [UserRole.DISTRICT_ADMIN]: [
    Permission.HOUSE_VIEW,
    Permission.HOUSE_CREATE,
    Permission.HOUSE_EDIT,
    Permission.HOUSE_APPROVE,
    Permission.CRAFTSMAN_VIEW,
    Permission.CRAFTSMAN_CREATE,
    Permission.CRAFTSMAN_EDIT,
    Permission.TRAINING_VIEW,
    Permission.TRAINING_CREATE,
    Permission.TRAINING_EDIT,
    Permission.CREDIT_VIEW,
    Permission.CREDIT_EVALUATE,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_EDIT,
    Permission.INSPECTION_CONDUCT,
    Permission.SIX_ON_SITE_VIEW,
    Permission.SIX_ON_SITE_CREATE,
    Permission.SIX_ON_SITE_EDIT,
    Permission.SIX_ON_SITE_DELETE,
    Permission.SIX_ON_SITE_MANAGE,
    Permission.STATISTICS_VIEW,
    Permission.STATISTICS_EXPORT,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],

  // 镇街管理员 - 基础管理权限
  [UserRole.TOWN_ADMIN]: [
    Permission.HOUSE_VIEW,
    Permission.HOUSE_CREATE,
    Permission.HOUSE_EDIT,
    Permission.CRAFTSMAN_VIEW,
    Permission.CRAFTSMAN_CREATE,
    Permission.CRAFTSMAN_EDIT,
    Permission.TRAINING_VIEW,
    Permission.TRAINING_CREATE,
    Permission.CREDIT_VIEW,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_CONDUCT,
    Permission.SIX_ON_SITE_VIEW,
    Permission.SIX_ON_SITE_CREATE,
    Permission.SIX_ON_SITE_EDIT,
    Permission.STATISTICS_VIEW,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],

  // 村级管理员 - 村级数据管理
  [UserRole.VILLAGE_ADMIN]: [
    Permission.HOUSE_VIEW,
    Permission.HOUSE_CREATE,
    Permission.HOUSE_EDIT,
    Permission.CRAFTSMAN_VIEW,
    Permission.TRAINING_VIEW,
    Permission.CREDIT_VIEW,
    Permission.INSPECTION_VIEW,
    Permission.SIX_ON_SITE_VIEW,
    Permission.STATISTICS_VIEW,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],

  // 工匠 - 个人信息和相关业务
  [UserRole.CRAFTSMAN]: [
    Permission.HOUSE_VIEW,
    Permission.TRAINING_VIEW,
    Permission.CREDIT_VIEW,
    Permission.INSPECTION_VIEW,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],

  // 农户 - 基础查看权限
  [UserRole.FARMER]: [
    Permission.HOUSE_VIEW,
    Permission.CRAFTSMAN_VIEW,
    Permission.TRAINING_VIEW,
    Permission.CREDIT_VIEW,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],

  // 检查员 - 检查相关权限
  [UserRole.INSPECTOR]: [
    Permission.HOUSE_VIEW,
    Permission.CRAFTSMAN_VIEW,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_EDIT,
    Permission.INSPECTION_CONDUCT,
    Permission.STATISTICS_VIEW,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],
}

// 检查用户是否拥有特定权限
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return rolePermissions.includes(permission)
}

// 检查用户是否拥有多个权限中的任意一个
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// 检查用户是否拥有所有指定权限
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// 获取用户的所有权限
export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || []
}

// 检查用户是否可以访问特定区域的数据
export function canAccessRegion(userRole: UserRole, userRegionCode: string, targetRegionCode: string): boolean {
  // 超级管理员和市级管理员可以访问所有区域
  if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.CITY_ADMIN) {
    return true
  }

  // 区市管理员可以访问本区市及下属镇街的数据
  if (userRole === UserRole.DISTRICT_ADMIN) {
    return targetRegionCode.startsWith(userRegionCode)
  }

  // 镇街管理员只能访问本镇街的数据
  if (userRole === UserRole.TOWN_ADMIN) {
    return targetRegionCode === userRegionCode
  }

  // 村级管理员、工匠、农户、检查员只能访问自己区域的数据
  return userRegionCode === targetRegionCode
}

// 角色层级定义（数字越大权限越高）
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.FARMER]: 1,
  [UserRole.CRAFTSMAN]: 2,
  [UserRole.INSPECTOR]: 3,
  [UserRole.VILLAGE_ADMIN]: 4,
  [UserRole.TOWN_ADMIN]: 5,
  [UserRole.DISTRICT_ADMIN]: 6,
  [UserRole.CITY_ADMIN]: 7,
  [UserRole.SUPER_ADMIN]: 8,
}

// 检查用户是否可以管理目标用户
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole]
}

// 获取角色的中文名称
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: '超级管理员',
    [UserRole.CITY_ADMIN]: '市级管理员',
    [UserRole.DISTRICT_ADMIN]: '区市管理员',
    [UserRole.TOWN_ADMIN]: '镇街管理员',
    [UserRole.VILLAGE_ADMIN]: '村级管理员',
    [UserRole.CRAFTSMAN]: '工匠',
    [UserRole.FARMER]: '农户',
    [UserRole.INSPECTOR]: '检查员',
  }

  return roleNames[role] || '未知角色'
}

// 简化的权限检查函数，用于API路由
export function checkPermission(userRole: UserRole, resource: string, action: string): boolean {
  // 构建权限字符串
  const permissionKey = `${resource.toUpperCase()}_${action.toUpperCase()}` as keyof typeof Permission
  const permission = Permission[permissionKey]

  if (!permission) {
    // 如果权限不存在，检查一些常见的映射
    const mappings: Record<string, Permission> = {
      'craftsman_read': Permission.CRAFTSMAN_VIEW,
      'craftsman_create': Permission.CRAFTSMAN_CREATE,
      'craftsman_update': Permission.CRAFTSMAN_EDIT,
      'craftsman_delete': Permission.CRAFTSMAN_DELETE,
      'team_read': Permission.CRAFTSMAN_VIEW, // 团队管理属于工匠管理的一部分
      'team_create': Permission.CRAFTSMAN_CREATE,
      'team_update': Permission.CRAFTSMAN_EDIT,
      'team_delete': Permission.CRAFTSMAN_DELETE,
      'training_read': Permission.TRAINING_VIEW,
      'training_create': Permission.TRAINING_CREATE,
      'training_update': Permission.TRAINING_EDIT,
      'training_delete': Permission.TRAINING_DELETE,
      'house_read': Permission.HOUSE_VIEW,
      'house_create': Permission.HOUSE_CREATE,
      'house_update': Permission.HOUSE_EDIT,
      'house_delete': Permission.HOUSE_DELETE,
      'credit_view': Permission.CREDIT_VIEW,
      'credit_evaluate': Permission.CREDIT_EVALUATE,
      'six_on_site_read': Permission.SIX_ON_SITE_VIEW,
      'six_on_site_create': Permission.SIX_ON_SITE_CREATE,
      'six_on_site_update': Permission.SIX_ON_SITE_EDIT,
      'six_on_site_delete': Permission.SIX_ON_SITE_DELETE,
      'six_on_site_manage': Permission.SIX_ON_SITE_MANAGE,
    }

    const mappedPermission = mappings[`${resource}_${action}`]
    if (mappedPermission) {
      return hasPermission(userRole, mappedPermission)
    }

    return false
  }

  return hasPermission(userRole, permission)
}