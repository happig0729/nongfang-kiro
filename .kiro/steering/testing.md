# 测试指南

## 测试策略概述

青岛市农房建设管理平台采用分层测试策略，确保系统的可靠性、性能和安全性。测试金字塔包括单元测试、集成测试、端到端测试和性能测试。

### 测试金字塔
```
    /\     E2E Tests (10%)
   /  \    
  /____\   Integration Tests (20%)
 /      \  
/________\  Unit Tests (70%)
```

## 测试环境配置

### 1. 测试依赖安装

```bash
# 安装测试相关依赖
pnpm add -D jest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event msw
pnpm add -D playwright @playwright/test
pnpm add -D supertest @types/supertest
pnpm add -D prisma-test-environment-postgresql
```

### 2. Jest 配置

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom'
import { server } from './src/__mocks__/server'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

// Setup MSW
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 3. 测试数据库配置

```javascript
// prisma/test-environment.js
const { execSync } = require('child_process')
const { v4: uuidv4 } = require('uuid')

class PrismaTestEnvironment {
  constructor(config) {
    this.schema = `test_${uuidv4()}`
    this.connectionString = `${process.env.TEST_DATABASE_URL}?schema=${this.schema}`
  }

  async setup() {
    process.env.DATABASE_URL = this.connectionString
    execSync('npx prisma migrate deploy')
    execSync('npx prisma db seed')
  }

  async teardown() {
    execSync(`npx prisma migrate reset --force --skip-seed`)
  }
}

module.exports = PrismaTestEnvironment
```

## 单元测试

### 1. 组件测试

#### 农房管理组件测试
```typescript
// src/components/houses/__tests__/HouseList.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HouseList } from '../HouseList'
import { mockHouses } from '@/__mocks__/data'

describe('HouseList', () => {
  const mockProps = {
    houses: mockHouses,
    loading: false,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onView: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders house list correctly', () => {
    render(<HouseList {...mockProps} />)
    
    expect(screen.getByText('农房列表')).toBeInTheDocument()
    expect(screen.getByText(mockHouses[0].address)).toBeInTheDocument()
    expect(screen.getByText(`${mockHouses[0].floors}层`)).toBeInTheDocument()
  })

  it('handles search functionality', async () => {
    const user = userEvent.setup()
    render(<HouseList {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText('搜索地址、申请人')
    await user.type(searchInput, '测试地址')
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('测试地址')
    })
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<HouseList {...mockProps} />)
    
    const editButton = screen.getByRole('button', { name: /编辑/ })
    await user.click(editButton)
    
    expect(mockProps.onEdit).toHaveBeenCalledWith(mockHouses[0])
  })

  it('shows loading state', () => {
    render(<HouseList {...mockProps} loading={true} />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows empty state when no houses', () => {
    render(<HouseList {...mockProps} houses={[]} />)
    
    expect(screen.getByText('暂无农房数据')).toBeInTheDocument()
  })
})
```

#### 工匠管理组件测试
```typescript
// src/components/craftsmen/__tests__/CraftsmanForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CraftsmanForm } from '../CraftsmanForm'

describe('CraftsmanForm', () => {
  const mockProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    loading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form fields correctly', () => {
    render(<CraftsmanForm {...mockProps} />)
    
    expect(screen.getByLabelText('姓名')).toBeInTheDocument()
    expect(screen.getByLabelText('身份证号')).toBeInTheDocument()
    expect(screen.getByLabelText('手机号')).toBeInTheDocument()
    expect(screen.getByLabelText('专业技能')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<CraftsmanForm {...mockProps} />)
    
    const submitButton = screen.getByRole('button', { name: '提交' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('请输入姓名')).toBeInTheDocument()
      expect(screen.getByText('请输入身份证号')).toBeInTheDocument()
    })
  })

  it('validates ID number format', async () => {
    const user = userEvent.setup()
    render(<CraftsmanForm {...mockProps} />)
    
    const idInput = screen.getByLabelText('身份证号')
    await user.type(idInput, '123456')
    
    const submitButton = screen.getByRole('button', { name: '提交' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('身份证号格式不正确')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<CraftsmanForm {...mockProps} />)
    
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.type(screen.getByLabelText('身份证号'), '110101199001011234')
    await user.type(screen.getByLabelText('手机号'), '13800138000')
    
    const submitButton = screen.getByRole('button', { name: '提交' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        name: '张三',
        idNumber: '110101199001011234',
        phone: '13800138000',
        specialties: [],
        skillLevel: 'BEGINNER',
      })
    })
  })
})
```

### 2. API 路由测试

#### 农房 API 测试
```typescript
// src/app/api/houses/__tests__/route.test.ts
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMockUser } from '@/__mocks__/auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    house: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyTokenFromRequest: jest.fn(),
}))

describe('/api/houses', () => {
  const mockUser = createMockUser({ role: 'DISTRICT_ADMIN' })

  beforeEach(() => {
    jest.clearAllMocks()
    require('@/lib/auth').verifyTokenFromRequest.mockResolvedValue(mockUser)
  })

  describe('GET /api/houses', () => {
    it('returns houses list with pagination', async () => {
      const mockHouses = [
        { id: '1', address: '测试地址1', floors: 2 },
        { id: '2', address: '测试地址2', floors: 3 },
      ]

      prisma.house.findMany.mockResolvedValue(mockHouses)
      prisma.house.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/houses?page=1&pageSize=20')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.houses).toEqual(mockHouses)
      expect(data.data.pagination.total).toBe(2)
    })

    it('filters houses by region for non-admin users', async () => {
      const nonAdminUser = createMockUser({ role: 'TOWN_ADMIN', regionCode: '370200' })
      require('@/lib/auth').verifyTokenFromRequest.mockResolvedValue(nonAdminUser)

      const request = new NextRequest('http://localhost:3000/api/houses')
      await GET(request)

      expect(prisma.house.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            regionCode: '370200'
          })
        })
      )
    })

    it('returns 401 for unauthenticated requests', async () => {
      require('@/lib/auth').verifyTokenFromRequest.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/houses')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/houses', () => {
    it('creates new house successfully', async () => {
      const houseData = {
        address: '新建农房地址',
        floors: 2,
        height: 6.5,
        applicantId: 'user-1',
      }

      const createdHouse = { id: 'house-1', ...houseData }
      prisma.house.create.mockResolvedValue(createdHouse)

      const request = new NextRequest('http://localhost:3000/api/houses', {
        method: 'POST',
        body: JSON.stringify(houseData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data).toEqual(createdHouse)
    })

    it('validates required fields', async () => {
      const invalidData = { floors: 2 } // missing address

      const request = new NextRequest('http://localhost:3000/api/houses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })
  })
})
```

#### 工匠 API 测试
```typescript
// src/app/api/craftsmen/__tests__/route.test.ts
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMockUser } from '@/__mocks__/auth'

describe('/api/craftsmen', () => {
  const mockUser = createMockUser({ role: 'DISTRICT_ADMIN' })

  beforeEach(() => {
    jest.clearAllMocks()
    require('@/lib/auth').verifyTokenFromRequest.mockResolvedValue(mockUser)
  })

  describe('GET /api/craftsmen', () => {
    it('returns craftsmen list with search', async () => {
      const mockCraftsmen = [
        { id: '1', name: '张三', phone: '13800138000' },
        { id: '2', name: '李四', phone: '13800138001' },
      ]

      prisma.craftsman.findMany.mockResolvedValue(mockCraftsmen)
      prisma.craftsman.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/craftsmen?search=张三')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prisma.craftsman.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: '张三', mode: 'insensitive' } }
            ])
          })
        })
      )
    })
  })

  describe('POST /api/craftsmen', () => {
    it('creates craftsman with unique ID number', async () => {
      const craftsmanData = {
        name: '王五',
        idNumber: '110101199001011234',
        phone: '13800138002',
        specialties: ['砌筑工'],
        skillLevel: 'INTERMEDIATE',
      }

      prisma.craftsman.findUnique.mockResolvedValue(null) // No existing craftsman
      prisma.craftsman.create.mockResolvedValue({ id: 'craftsman-1', ...craftsmanData })

      const request = new NextRequest('http://localhost:3000/api/craftsmen', {
        method: 'POST',
        body: JSON.stringify(craftsmanData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.name).toBe('王五')
    })

    it('rejects duplicate ID number', async () => {
      const craftsmanData = {
        name: '王五',
        idNumber: '110101199001011234',
        phone: '13800138002',
        specialties: ['砌筑工'],
        skillLevel: 'INTERMEDIATE',
      }

      prisma.craftsman.findUnique.mockResolvedValue({ id: 'existing-1' }) // Existing craftsman

      const request = new NextRequest('http://localhost:3000/api/craftsmen', {
        method: 'POST',
        body: JSON.stringify(craftsmanData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('DUPLICATE_ID_NUMBER')
    })
  })
})
```

### 3. 工具函数测试

```typescript
// src/lib/__tests__/permissions.test.ts
import { checkPermission, getUserPermissions } from '../permissions'
import { UserRole, Permission } from '../types'

describe('permissions', () => {
  describe('checkPermission', () => {
    it('allows SUPER_ADMIN all permissions', () => {
      expect(checkPermission('SUPER_ADMIN', 'house', 'create')).toBe(true)
      expect(checkPermission('SUPER_ADMIN', 'craftsman', 'delete')).toBe(true)
      expect(checkPermission('SUPER_ADMIN', 'training', 'manage')).toBe(true)
    })

    it('restricts FARMER permissions correctly', () => {
      expect(checkPermission('FARMER', 'house', 'read')).toBe(true)
      expect(checkPermission('FARMER', 'house', 'create')).toBe(false)
      expect(checkPermission('FARMER', 'craftsman', 'read')).toBe(true)
      expect(checkPermission('FARMER', 'craftsman', 'create')).toBe(false)
    })

    it('allows DISTRICT_ADMIN appropriate permissions', () => {
      expect(checkPermission('DISTRICT_ADMIN', 'house', 'create')).toBe(true)
      expect(checkPermission('DISTRICT_ADMIN', 'craftsman', 'manage')).toBe(true)
      expect(checkPermission('DISTRICT_ADMIN', 'training', 'create')).toBe(true)
    })
  })

  describe('getUserPermissions', () => {
    it('returns correct permissions for each role', () => {
      const superAdminPerms = getUserPermissions('SUPER_ADMIN')
      expect(superAdminPerms).toContain(Permission.HOUSE_CREATE)
      expect(superAdminPerms).toContain(Permission.CRAFTSMAN_DELETE)

      const farmerPerms = getUserPermissions('FARMER')
      expect(farmerPerms).toContain(Permission.HOUSE_VIEW)
      expect(farmerPerms).not.toContain(Permission.HOUSE_CREATE)
    })
  })
})
```

## 集成测试

### 1. 数据库集成测试

```typescript
// src/__tests__/integration/house-service.test.ts
import { PrismaClient } from '@prisma/client'
import { HouseService } from '@/services/HouseService'
import { createTestUser, createTestHouse } from '@/__mocks__/factories'

const prisma = new PrismaClient()
const houseService = new HouseService(prisma)

describe('HouseService Integration', () => {
  beforeEach(async () => {
    await prisma.house.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('creates house with related data', async () => {
    const user = await createTestUser(prisma)
    const houseData = {
      address: '集成测试地址',
      floors: 2,
      applicantId: user.id,
    }

    const house = await houseService.create(houseData)

    expect(house.id).toBeDefined()
    expect(house.address).toBe('集成测试地址')
    expect(house.applicantId).toBe(user.id)

    // Verify in database
    const dbHouse = await prisma.house.findUnique({
      where: { id: house.id },
      include: { applicant: true },
    })

    expect(dbHouse).toBeTruthy()
    expect(dbHouse.applicant.id).toBe(user.id)
  })

  it('handles concurrent house creation', async () => {
    const user = await createTestUser(prisma)
    
    const promises = Array.from({ length: 5 }, (_, i) =>
      houseService.create({
        address: `并发测试地址${i}`,
        floors: 2,
        applicantId: user.id,
      })
    )

    const houses = await Promise.all(promises)
    
    expect(houses).toHaveLength(5)
    expect(new Set(houses.map(h => h.id))).toHaveLength(5) // All unique IDs
  })

  it('enforces database constraints', async () => {
    const user = await createTestUser(prisma)
    
    // Try to create house with invalid applicant
    await expect(
      houseService.create({
        address: '约束测试地址',
        floors: 2,
        applicantId: 'non-existent-user',
      })
    ).rejects.toThrow()
  })
})
```

### 2. API 集成测试

```typescript
// src/__tests__/integration/api.test.ts
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { createTestUser, generateAuthToken } from '@/__mocks__/factories'

const prisma = new PrismaClient()
const app = next({ dev: false })
const handle = app.getRequestHandler()

describe('API Integration Tests', () => {
  let server: any
  let authToken: string
  let testUser: any

  beforeAll(async () => {
    await app.prepare()
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true)
      handle(req, res, parsedUrl)
    })

    testUser = await createTestUser(prisma, { role: 'DISTRICT_ADMIN' })
    authToken = generateAuthToken(testUser)
  })

  afterAll(async () => {
    await prisma.$disconnect()
    server.close()
  })

  describe('Houses API Flow', () => {
    it('completes full CRUD flow', async () => {
      // Create house
      const createResponse = await request(server)
        .post('/api/houses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address: '集成测试农房',
          floors: 2,
          height: 6.0,
          applicantId: testUser.id,
        })

      expect(createResponse.status).toBe(201)
      const houseId = createResponse.body.data.id

      // Read house
      const getResponse = await request(server)
        .get(`/api/houses/${houseId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(getResponse.status).toBe(200)
      expect(getResponse.body.data.address).toBe('集成测试农房')

      // Update house
      const updateResponse = await request(server)
        .put(`/api/houses/${houseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address: '更新后的农房地址',
          floors: 3,
        })

      expect(updateResponse.status).toBe(200)
      expect(updateResponse.body.data.address).toBe('更新后的农房地址')

      // Delete house
      const deleteResponse = await request(server)
        .delete(`/api/houses/${houseId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(deleteResponse.status).toBe(200)

      // Verify deletion
      const getDeletedResponse = await request(server)
        .get(`/api/houses/${houseId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(getDeletedResponse.status).toBe(404)
    })
  })

  describe('Authentication Flow', () => {
    it('handles login and protected routes', async () => {
      // Login
      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'test-password',
        })

      expect(loginResponse.status).toBe(200)
      expect(loginResponse.body.data.token).toBeDefined()

      const token = loginResponse.body.data.token

      // Access protected route
      const protectedResponse = await request(server)
        .get('/api/houses')
        .set('Authorization', `Bearer ${token}`)

      expect(protectedResponse.status).toBe(200)

      // Access without token
      const unauthorizedResponse = await request(server)
        .get('/api/houses')

      expect(unauthorizedResponse.status).toBe(401)
    })
  })
})
```

## 端到端测试

### 1. Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 2. E2E 测试用例

#### 农房管理流程测试
```typescript
// e2e/house-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('House Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[data-testid=username]', 'admin@test.com')
    await page.fill('[data-testid=password]', 'password')
    await page.click('[data-testid=login-button]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('complete house creation flow', async ({ page }) => {
    // Navigate to house management
    await page.click('[data-testid=nav-houses]')
    await expect(page).toHaveURL('/houses')

    // Open create form
    await page.click('[data-testid=create-house-button]')
    await expect(page.locator('[data-testid=house-form]')).toBeVisible()

    // Fill form
    await page.fill('[data-testid=address-input]', 'E2E测试农房地址')
    await page.selectOption('[data-testid=floors-select]', '2')
    await page.fill('[data-testid=height-input]', '6.5')
    
    // Submit form
    await page.click('[data-testid=submit-button]')
    
    // Verify success
    await expect(page.locator('.ant-message-success')).toBeVisible()
    await expect(page.locator('text=E2E测试农房地址')).toBeVisible()
  })

  test('house search and filter', async ({ page }) => {
    await page.goto('/houses')
    
    // Search by address
    await page.fill('[data-testid=search-input]', '测试地址')
    await page.press('[data-testid=search-input]', 'Enter')
    
    // Wait for results
    await page.waitForSelector('[data-testid=house-list]')
    
    // Verify search results
    const houseItems = page.locator('[data-testid=house-item]')
    await expect(houseItems.first()).toContainText('测试地址')
    
    // Filter by status
    await page.selectOption('[data-testid=status-filter]', 'UNDER_CONSTRUCTION')
    await page.waitForSelector('[data-testid=house-list]')
    
    // Verify filtered results
    const statusBadges = page.locator('[data-testid=status-badge]')
    await expect(statusBadges.first()).toContainText('建设中')
  })

  test('house detail view and edit', async ({ page }) => {
    await page.goto('/houses')
    
    // Click on first house
    await page.click('[data-testid=house-item]:first-child [data-testid=view-button]')
    
    // Verify detail page
    await expect(page.locator('[data-testid=house-detail]')).toBeVisible()
    await expect(page.locator('[data-testid=house-address]')).toBeVisible()
    
    // Edit house
    await page.click('[data-testid=edit-button]')
    await page.fill('[data-testid=address-input]', '更新后的地址')
    await page.click('[data-testid=submit-button]')
    
    // Verify update
    await expect(page.locator('.ant-message-success')).toBeVisible()
    await expect(page.locator('[data-testid=house-address]')).toContainText('更新后的地址')
  })
})
```

#### 工匠管理流程测试
```typescript
// e2e/craftsman-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Craftsman Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid=username]', 'admin@test.com')
    await page.fill('[data-testid=password]', 'password')
    await page.click('[data-testid=login-button]')
    await page.goto('/craftsmen')
  })

  test('create craftsman with training records', async ({ page }) => {
    // Create craftsman
    await page.click('[data-testid=create-craftsman-button]')
    
    await page.fill('[data-testid=name-input]', '张三')
    await page.fill('[data-testid=id-number-input]', '110101199001011234')
    await page.fill('[data-testid=phone-input]', '13800138000')
    
    // Select specialties
    await page.click('[data-testid=specialties-select]')
    await page.click('text=砌筑工')
    await page.click('text=混凝土工')
    await page.press('Escape') // Close dropdown
    
    await page.click('[data-testid=submit-button]')
    await expect(page.locator('.ant-message-success')).toBeVisible()
    
    // Open training management
    await page.click('[data-testid=craftsman-item]:has-text("张三") [data-testid=training-button]')
    await expect(page.locator('[data-testid=training-modal]')).toBeVisible()
    
    // Add training record
    await page.click('[data-testid=add-training-button]')
    await page.fill('[data-testid=training-type-input]', '安全培训')
    await page.fill('[data-testid=training-content-input]', '建筑安全操作规程')
    await page.fill('[data-testid=duration-input]', '8')
    await page.fill('[data-testid=training-date-input]', '2024-01-15')
    
    await page.click('[data-testid=submit-training-button]')
    await expect(page.locator('.ant-message-success')).toBeVisible()
    
    // Verify training record
    await expect(page.locator('text=安全培训')).toBeVisible()
    await expect(page.locator('text=8小时')).toBeVisible()
  })

  test('credit evaluation workflow', async ({ page }) => {
    // Find craftsman and open credit management
    await page.click('[data-testid=craftsman-item]:first-child [data-testid=credit-button]')
    await expect(page.locator('[data-testid=credit-modal]')).toBeVisible()
    
    // Add credit evaluation
    await page.click('[data-testid=add-evaluation-button]')
    await page.selectOption('[data-testid=evaluation-type-select]', 'QUALITY_BONUS')
    await page.fill('[data-testid=points-input]', '10')
    await page.fill('[data-testid=reason-input]', '工程质量优秀')
    
    await page.click('[data-testid=submit-evaluation-button]')
    await expect(page.locator('.ant-message-success')).toBeVisible()
    
    // Verify credit score update
    await page.click('[data-testid=close-modal-button]')
    await expect(page.locator('[data-testid=credit-score]:has-text("110")')).toBeVisible()
  })
})
```

## 性能测试

### 1. 负载测试

```typescript
// performance/load-test.ts
import { check } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
}

const BASE_URL = 'http://localhost:3000'

export function setup() {
  // Login and get auth token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    username: 'test@example.com',
    password: 'password',
  })
  
  const token = loginResponse.json('data.token')
  return { token }
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  }

  // Test houses API
  const housesResponse = http.get(`${BASE_URL}/api/houses`, { headers })
  check(housesResponse, {
    'houses list status is 200': (r) => r.status === 200,
    'houses list response time < 2s': (r) => r.timings.duration < 2000,
  })

  // Test craftsmen API
  const craftsmenResponse = http.get(`${BASE_URL}/api/craftsmen`, { headers })
  check(craftsmenResponse, {
    'craftsmen list status is 200': (r) => r.status === 200,
    'craftsmen list response time < 2s': (r) => r.timings.duration < 2000,
  })

  // Test house creation
  const createHouseResponse = http.post(
    `${BASE_URL}/api/houses`,
    JSON.stringify({
      address: `性能测试地址 ${Math.random()}`,
      floors: 2,
      applicantId: 'test-user-id',
    }),
    { headers }
  )
  
  check(createHouseResponse, {
    'house creation status is 201': (r) => r.status === 201,
    'house creation response time < 3s': (r) => r.timings.duration < 3000,
  })
}
```

### 2. 数据库性能测试

```typescript
// performance/db-performance.test.ts
import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

describe('Database Performance Tests', () => {
  beforeAll(async () => {
    // Create test data
    await createTestData()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('houses query performance', async () => {
    const start = performance.now()
    
    const houses = await prisma.house.findMany({
      include: {
        applicant: true,
        _count: {
          select: {
            housePhotos: true,
            inspections: true,
          },
        },
      },
      take: 100,
    })
    
    const end = performance.now()
    const duration = end - start
    
    expect(houses).toHaveLength(100)
    expect(duration).toBeLessThan(1000) // Should complete within 1 second
  })

  it('craftsmen search performance', async () => {
    const start = performance.now()
    
    const craftsmen = await prisma.craftsman.findMany({
      where: {
        OR: [
          { name: { contains: '张', mode: 'insensitive' } },
          { phone: { contains: '138' } },
        ],
      },
      include: {
        team: true,
        _count: {
          select: {
            trainingRecords: true,
          },
        },
      },
      take: 50,
    })
    
    const end = performance.now()
    const duration = end - start
    
    expect(duration).toBeLessThan(500) // Should complete within 500ms
  })

  it('complex aggregation performance', async () => {
    const start = performance.now()
    
    const stats = await prisma.$transaction([
      prisma.house.count(),
      prisma.craftsman.count(),
      prisma.trainingRecord.aggregate({
        _sum: { durationHours: true },
        _avg: { durationHours: true },
      }),
      prisma.inspection.groupBy({
        by: ['result'],
        _count: { id: true },
      }),
    ])
    
    const end = performance.now()
    const duration = end - start
    
    expect(stats).toHaveLength(4)
    expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
  })
})

async function createTestData() {
  // Create test users, houses, craftsmen, etc.
  // This would be a large dataset for performance testing
}
```

## 测试数据管理

### 1. 测试工厂

```typescript
// src/__mocks__/factories.ts
import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker/locale/zh_CN'

export async function createTestUser(prisma: PrismaClient, overrides = {}) {
  return await prisma.user.create({
    data: {
      username: faker.internet.email(),
      realName: faker.person.fullName(),
      phone: faker.phone.number('138########'),
      role: 'DISTRICT_ADMIN',
      regionCode: '370200',
      ...overrides,
    },
  })
}

export async function createTestHouse(prisma: PrismaClient, overrides = {}) {
  const user = await createTestUser(prisma)
  
  return await prisma.house.create({
    data: {
      address: faker.location.streetAddress(),
      floors: faker.number.int({ min: 1, max: 3 }),
      height: faker.number.float({ min: 3, max: 10, precision: 0.1 }),
      houseType: 'RURAL_HOUSE',
      constructionStatus: 'PLANNING',
      applicantId: user.id,
      regionCode: '370200',
      ...overrides,
    },
  })
}

export async function createTestCraftsman(prisma: PrismaClient, overrides = {}) {
  return await prisma.craftsman.create({
    data: {
      name: faker.person.fullName(),
      idNumber: generateIdNumber(),
      phone: faker.phone.number('138########'),
      specialties: ['砌筑工', '混凝土工'],
      skillLevel: 'INTERMEDIATE',
      creditScore: faker.number.int({ min: 70, max: 100 }),
      regionCode: '370200',
      ...overrides,
    },
  })
}

function generateIdNumber(): string {
  const prefix = '370202'
  const birthDate = '19900101'
  const sequence = faker.string.numeric(3)
  const checkDigit = faker.helpers.arrayElement(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X'])
  return `${prefix}${birthDate}${sequence}${checkDigit}`
}

export function generateAuthToken(user: any): string {
  // Mock JWT token generation
  return `mock-token-${user.id}`
}
```

### 2. 测试数据清理

```typescript
// src/__mocks__/cleanup.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanupTestData() {
  await prisma.$transaction([
    prisma.satisfactionSurvey.deleteMany(),
    prisma.inspection.deleteMany(),
    prisma.sixOnSiteRecord.deleteMany(),
    prisma.creditEvaluation.deleteMany(),
    prisma.trainingRecord.deleteMany(),
    prisma.housePhoto.deleteMany(),
    prisma.house.deleteMany(),
    prisma.craftsman.deleteMany(),
    prisma.team.deleteMany(),
    prisma.user.deleteMany(),
  ])
}

export async function seedTestData() {
  // Create minimal test data for development
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin@test.com',
      realName: '系统管理员',
      phone: '13800138000',
      role: 'SUPER_ADMIN',
      regionCode: '370200',
    },
  })

  const testHouse = await prisma.house.create({
    data: {
      address: '青岛市城阳区测试村1号',
      floors: 2,
      height: 6.5,
      houseType: 'RURAL_HOUSE',
      constructionStatus: 'PLANNING',
      applicantId: adminUser.id,
      regionCode: '370200',
    },
  })

  const testCraftsman = await prisma.craftsman.create({
    data: {
      name: '张师傅',
      idNumber: '370202199001011234',
      phone: '13800138001',
      specialties: ['砌筑工', '混凝土工'],
      skillLevel: 'ADVANCED',
      creditScore: 95,
      regionCode: '370200',
    },
  })

  return { adminUser, testHouse, testCraftsman }
}
```

## 测试脚本

### package.json 测试脚本

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "k6 run performance/load-test.ts",
    "test:db": "jest --testPathPattern=db-performance",
    "test:all": "pnpm test && pnpm test:integration && pnpm test:e2e",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### CI/CD 测试流水线

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test:ci
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run integration tests
        run: pnpm test:integration
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

这个测试指南提供了完整的测试策略和实现方案，确保青岛市农房建设管理平台的质量和可靠性。通过分层测试、自动化测试和持续集成，可以有效地发现和预防问题，提高系统的稳定性。