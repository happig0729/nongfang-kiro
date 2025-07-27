# Technology Stack

## Core Framework & Language
- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Package Manager**: pnpm

## Database & Backend
- **Database**: PostgreSQL 15+ with UUID primary keys
- **ORM**: Prisma with custom output directory (generated/prisma)
- **Authentication**: Custom JWT-based auth system
- **File Storage**: Local file system with planned OSS integration
- **API Architecture**: Next.js API Routes with RESTful design

## UI & Styling
- **Primary UI Library**: Ant Design 5.x (antd) with Chinese locale (zh_CN)
- **Secondary UI Components**: shadcn/ui components
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Ant Design Icons (@ant-design/icons) and Lucide React
- **Fonts**: Inter (Google Fonts)

## Date & Time Libraries
- **Date Handling**: dayjs (lightweight, immutable, Moment.js compatible)
- **Installation**: `pnpm add dayjs` (required for Ant Design DatePicker components)
- **Usage**: Preferred over native Date for form components and date manipulation

## Map Integration
- **Map Service**: 高德地图 (Amap) API for China mainland
- **Coordinate System**: GCJ-02 (火星坐标系)
- **API Key**: Configured for development and production environments
- **TypeScript Support**: Custom window.AMap type declarations needed

## Development Tools
- **Linting**: ESLint with Next.js core web vitals config
- **Formatting**: Prettier with specific rules (no semicolons, single quotes, 2-space tabs)
- **Type Checking**: TypeScript compiler with strict settings

## Build System & Commands

### Development
```bash
pnpm dev          # Start development server
pnpm type-check   # Run TypeScript type checking
```

### Database Operations
```bash
npx prisma generate           # Generate Prisma client
npx prisma db push           # Push schema changes to database
npx prisma db seed           # Seed database with initial data
npx prisma migrate dev       # Create and apply new migration
npx prisma studio           # Open Prisma Studio (database GUI)
```

### Code Quality
```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues automatically
pnpm format       # Format code with Prettier
pnpm format:check # Check code formatting
```

### Production
```bash
pnpm build        # Build for production
pnpm start        # Start production server
npx prisma migrate deploy    # Apply migrations in production
```

## Configuration Files
- **TypeScript**: Path aliases configured (`@/*` → `./src/*`)
- **Tailwind**: Custom design system with CSS variables and dark mode support
- **Next.js**: Image domains configured for localhost
- **shadcn/ui**: Configured with default style, RSC, and TypeScript

## Architecture Patterns
- App Router structure (Next.js 14)
- Server and Client Components separation
- CSS-in-JS avoided in favor of utility classes
- Component composition with Radix UI primitives
- Centralized utility functions in `@/lib/utils`

## Development Best Practices

### API Route Development
- Use Next.js App Router API routes (`/api/*/route.ts`)
- Implement proper error handling with HTTP status codes
- Use Zod for request/response validation
- Apply middleware for authentication and permissions
- Extract dynamic route parameters from URL path segments

### Component Development
- Use TypeScript interfaces for all props and data structures
- Implement proper error boundaries for critical components
- Use React.memo for performance optimization when needed
- Follow Ant Design component patterns for consistency
- Separate business logic from presentation components

### State Management
- Use React useState for local component state
- Use localStorage for client-side persistence (auth tokens, preferences)
- Implement proper loading states for async operations
- Handle error states gracefully with user-friendly messages

### File Upload Handling
- Validate file types and sizes on both client and server
- Use FormData for file uploads to `/api/upload`
- Store files in organized directory structure under `/public/uploads/`
- Return relative URLs from upload API for database storage

### Database Operations
- Use Prisma ORM for type-safe database operations
- Implement proper indexing for frequently queried fields
- Use UUID primary keys for all entities
- Apply database-level constraints for data integrity

### Error Handling Strategy
- Use try-catch blocks for all async operations
- Log detailed errors on server side for debugging
- Return user-friendly error messages in Chinese
- Implement proper HTTP status codes (400, 401, 403, 404, 500)

### Performance Considerations
- Implement pagination for large data sets
- Use React.memo for expensive component renders
- Optimize images and implement lazy loading
- Use proper caching strategies for static assets
- Minimize bundle size by importing only needed modules

### Security Measures
- Validate all user inputs on both client and server
- Use JWT tokens for authentication with proper expiration
- Implement role-based access control (RBAC)
- Sanitize file uploads and validate file types
- Use HTTPS in production environments

## Common Development Patterns

### API Response Format
```typescript
// Success response
{
  message: '操作成功',
  data: { ... }
}

// Error response
{
  error: 'ERROR_CODE',
  message: '用户友好的错误信息',
  details?: any // Development only
}
```

### Form Data Processing
```typescript
// Handle optional numeric fields
const processFormData = (values: any) => ({
  ...values,
  score: values.score ? parseInt(values.score, 10) : undefined,
  optionalField: values.optionalField || undefined,
})
```

### Component Error Handling
```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const handleOperation = async () => {
  setLoading(true)
  setError(null)
  try {
    // Async operation
    message.success('操作成功')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '操作失败'
    setError(errorMessage)
    message.error(errorMessage)
  } finally {
    setLoading(false)
  }
}
```

### Type-Safe API Calls
```typescript
interface ApiResponse<T> {
  message: string
  data: T
}

const fetchData = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  
  const result: ApiResponse<T> = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || '请求失败')
  }
  
  return result.data
}
```
##
 Craftsman Management Implementation

### API Authentication Pattern
```typescript
// Use verifyTokenFromRequest for all API routes
import { verifyTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await verifyTokenFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  // Continue with authenticated logic
}
```

### Permission Checking
```typescript
// Use checkPermission helper for role-based access control
import { checkPermission } from '@/lib/permissions'

if (!checkPermission(user.role, 'craftsman', 'read')) {
  return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
}
```

### Data Validation Patterns
```typescript
// Craftsman creation validation
const createCraftsmanSchema = z.object({
  name: z.string().min(1).max(100),
  idNumber: z.string().regex(/^\d{17}[\dX]$/),
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  specialties: z.array(z.string()).min(1),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
})
```

### Component State Management
```typescript
// Craftsman management component pattern
const [craftsmen, setCraftsmen] = useState<Craftsman[]>([])
const [loading, setLoading] = useState(false)
const [pagination, setPagination] = useState({
  current: 1,
  pageSize: 20,
  total: 0,
})
const [filters, setFilters] = useState({
  search: '',
  skillLevel: '',
  status: '',
})
```

### Skill Level Display Utilities
```typescript
// Skill level color and progress mapping
const getSkillLevelInfo = (level: string) => {
  const info = {
    BEGINNER: { name: '初级', color: 'default', percent: 25 },
    INTERMEDIATE: { name: '中级', color: 'blue', percent: 50 },
    ADVANCED: { name: '高级', color: 'green', percent: 75 },
    EXPERT: { name: '专家级', color: 'gold', percent: 100 },
  }
  return info[level] || { name: level, color: 'default', percent: 0 }
}
```

### Credit Score Color Coding
```typescript
// Credit score display with color coding
const getCreditInfo = (score: number) => {
  if (score >= 90) return { level: '优秀', color: '#52c41a' }
  if (score >= 80) return { level: '良好', color: '#1890ff' }
  if (score >= 70) return { level: '一般', color: '#faad14' }
  return { level: '较差', color: '#ff4d4f' }
}
```

### Custom Specialty Input Pattern
```typescript
// Ant Design Select with custom input for specialties
<Select
  mode="multiple"
  dropdownRender={(menu) => (
    <>
      {menu}
      <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
        <Input.Group compact>
          <Input
            style={{ width: 'calc(100% - 32px)' }}
            placeholder="输入自定义技能"
            value={customSpecialty}
            onChange={(e) => setCustomSpecialty(e.target.value)}
            onPressEnter={handleAddCustomSpecialty}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCustomSpecialty}
          />
        </Input.Group>
      </div>
    </>
  )}
>
  {SPECIALTY_OPTIONS.map((specialty) => (
    <Option key={specialty} value={specialty}>
      {specialty}
    </Option>
  ))}
</Select>
```

### Region-Based Data Filtering
```typescript
// API-level region filtering based on user role
const where: any = {}

// Filter by user's region for non-admin roles
if (user.role !== 'SUPER_ADMIN' && user.role !== 'CITY_ADMIN') {
  where.regionCode = user.regionCode
} else if (regionCode) {
  where.regionCode = regionCode
}
```

### Prisma Query Optimization
```typescript
// Optimized craftsman query with related data
const craftsmen = await prisma.craftsman.findMany({
  where,
  include: {
    team: {
      select: {
        id: true,
        name: true,
        teamType: true,
      },
    },
    _count: {
      select: {
        trainingRecords: true,
        constructionProjects: true,
      },
    },
  },
  orderBy: [
    { creditScore: 'desc' },
    { createdAt: 'desc' },
  ],
  skip: (page - 1) * pageSize,
  take: pageSize,
})
```
## Tra
ining Management Implementation

### Training Record API Patterns
```typescript
// Training record creation with validation
const createTrainingSchema = z.object({
  trainingType: z.string().min(1).max(100),
  trainingContent: z.string().min(1),
  durationHours: z.number().min(1).max(100),
  trainingDate: z.string().transform((str) => new Date(str)),
  instructor: z.string().min(1).max(100),
  completionStatus: z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']),
})
```

### Training Statistics Calculation
```typescript
// Calculate yearly training statistics
const yearlyStats = await prisma.trainingRecord.aggregate({
  where: {
    craftsmanId,
    trainingDate: {
      gte: new Date(`${currentYear}-01-01`),
      lte: new Date(`${currentYear}-12-31`),
    },
    completionStatus: 'COMPLETED',
  },
  _sum: { durationHours: true },
})

// Calculate offline training hours
const offlineStats = await prisma.trainingRecord.aggregate({
  where: {
    craftsmanId,
    completionStatus: 'COMPLETED',
    trainingType: { contains: '线下', mode: 'insensitive' },
  },
  _sum: { durationHours: true },
})
```

### Training Progress Visualization
```typescript
// Training progress component pattern
const TrainingProgress = ({ totalHours, requiredHours }) => {
  const progress = Math.min((totalHours / requiredHours) * 100, 100)
  
  return (
    <div>
      <Statistic
        title={`年度总学时`}
        value={totalHours}
        suffix={`/ ${requiredHours}h`}
      />
      <Progress
        percent={progress}
        strokeColor={progress >= 100 ? '#52c41a' : '#1890ff'}
        showInfo={false}
      />
    </div>
  )
}
```

### Training Permission Mapping
```typescript
// Training permission mappings in checkPermission function
const mappings: Record<string, Permission> = {
  'training_read': Permission.TRAINING_VIEW,
  'training_create': Permission.TRAINING_CREATE,
  'training_update': Permission.TRAINING_EDIT,
  'training_delete': Permission.TRAINING_DELETE,
}
```

### Training Material Upload
```typescript
// Training material upload with file validation
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  // File type validation
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/avi'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'INVALID_FILE_TYPE', message: '不支持的文件类型' },
      { status: 400 }
    )
  }
  
  // File size validation (50MB limit)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'FILE_TOO_LARGE', message: '文件大小不能超过50MB' },
      { status: 400 }
    )
  }
}
```

### Training Status Management
```typescript
// Training completion status with color coding
const getStatusColor = (status: string) => {
  const colors = {
    IN_PROGRESS: 'processing',
    COMPLETED: 'success',
    FAILED: 'error',
    CANCELLED: 'default',
  }
  return colors[status] || 'default'
}

// Training score grading system
const getScoreInfo = (score?: number) => {
  if (!score) return { level: '未评分', color: '#d9d9d9' }
  if (score >= 90) return { level: '优秀', color: '#52c41a' }
  if (score >= 80) return { level: '良好', color: '#1890ff' }
  if (score >= 70) return { level: '合格', color: '#faad14' }
  return { level: '不合格', color: '#ff4d4f' }
}
```

### Training Data Filtering
```typescript
// Training record filtering with multiple criteria
const buildTrainingQuery = (filters: TrainingFilters) => {
  const where: any = { craftsmanId }
  
  // Filter by year
  if (filters.year) {
    const startDate = new Date(`${filters.year}-01-01`)
    const endDate = new Date(`${filters.year}-12-31`)
    where.trainingDate = { gte: startDate, lte: endDate }
  }
  
  // Filter by training type
  if (filters.trainingType) {
    where.trainingType = { contains: filters.trainingType, mode: 'insensitive' }
  }
  
  // Filter by completion status
  if (filters.completionStatus) {
    where.completionStatus = filters.completionStatus
  }
  
  return where
}
```

### Training Management Component Integration
```typescript
// Integration with craftsman management
const CraftsmanManagement = () => {
  const [isTrainingModalVisible, setIsTrainingModalVisible] = useState(false)
  const [trainingCraftsman, setTrainingCraftsman] = useState(null)
  
  // Training management button in actions column
  <Button
    type="text"
    icon={<BookOutlined />}
    onClick={() => {
      setTrainingCraftsman(record)
      setIsTrainingModalVisible(true)
    }}
  />
  
  // Training management modal
  <Modal
    title="培训管理"
    open={isTrainingModalVisible}
    width={1200}
  >
    <TrainingManagement
      craftsmanId={trainingCraftsman.id}
      craftsmanName={trainingCraftsman.name}
      onClose={() => setIsTrainingModalVisible(false)}
    />
  </Modal>
}
```## Quality
 and Safety Supervision Implementation

### Six On-Site Management System
```typescript
// Six on-site record creation with validation
const createSixOnSiteSchema = z.object({
  onSiteType: z.enum(['SURVEY', 'DESIGN', 'CONSTRUCTION', 'SUPERVISION', 'BUILDING', 'QUALITY']),
  scheduledDate: z.string().transform((str) => new Date(str)),
  responsibleUnit: z.string().min(1).max(200),
  contactPerson: z.string().min(1).max(100),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/),
  // ... other fields
})

// Six on-site statistics calculation
const getStatistics = () => {
  const totalTypes = ON_SITE_TYPES.length
  const completedTypes = new Set(
    records.filter(r => r.status === 'COMPLETED').map(r => r.onSiteType)
  ).size
  const completionRate = totalTypes > 0 ? (completedTypes / totalTypes) * 100 : 0
  
  return { totalTypes, completedTypes, completionRate }
}
```

### Quality Inspection Management System
```typescript
// Quality inspection creation with comprehensive validation
const createInspectionSchema = z.object({
  inspectionType: z.enum(['SURVEY', 'DESIGN', 'CONSTRUCTION', 'SUPERVISION', 'BUILDING', 'QUALITY', 'SAFETY', 'PROGRESS']),
  inspectionDate: z.string().transform((str) => new Date(str)),
  result: z.enum(['PASS', 'FAIL', 'CONDITIONAL']),
  score: z.number().int().min(0).max(100).optional(),
  issues: z.string().optional(),
  suggestions: z.string().optional(),
  photos: z.array(z.string()).default([]),
  followUpDate: z.string().transform((str) => new Date(str)).optional(),
})

// Inspection statistics and pass rate calculation
const calculateInspectionStats = (inspections: Inspection[]) => {
  const total = inspections.length
  const passed = inspections.filter(i => i.result === 'PASS').length
  const failed = inspections.filter(i => i.result === 'FAIL').length
  const passRate = total > 0 ? (passed / total) * 100 : 0
  
  return { totalInspections: total, passedInspections: passed, failedInspections: failed, passRate }
}
```

### Satisfaction Survey Management System
```typescript
// Satisfaction survey with multi-dimensional scoring
const createSatisfactionSurveySchema = z.object({
  surveyType: z.enum(['NEW_BUILD_SATISFACTION', 'RENOVATION_SATISFACTION', 'EXPANSION_SATISFACTION', 'REPAIR_SATISFACTION']),
  overallScore: z.number().int().min(1).max(5),
  qualityScore: z.number().int().min(1).max(5).optional(),
  serviceScore: z.number().int().min(1).max(5).optional(),
  timeScore: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
  respondent: z.string().min(1).max(100),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  surveyDate: z.string().transform((str) => new Date(str)),
})

// Satisfaction level configuration with visual indicators
const SATISFACTION_LEVELS = {
  5: { label: '非常满意', color: '#52c41a', icon: <SmileOutlined /> },
  4: { label: '满意', color: '#1890ff', icon: <SmileOutlined /> },
  3: { label: '一般', color: '#faad14', icon: <MehOutlined /> },
  2: { label: '不满意', color: '#ff7a45', icon: <FrownOutlined /> },
  1: { label: '非常不满意', color: '#ff4d4f', icon: <FrownOutlined /> },
}
```

### Quality Supervision Main Component Architecture
```typescript
// Unified quality supervision management with tabbed interface
const QualitySupervisionManagement = ({ currentUser }) => {
  return (
    <Tabs items={[
      {
        key: 'six-on-site',
        label: '六到场管理',
        children: <SixOnSiteOverview currentUser={currentUser} />
      },
      {
        key: 'quality-inspection',
        label: '质量安全检查',
        children: <QualityInspectionManagement currentUser={currentUser} />
      },
      {
        key: 'satisfaction-survey',
        label: '满意度调查',
        children: <SatisfactionSurveyManagement currentUser={currentUser} />
      }
    ]} />
  )
}
```

### API Integration Patterns
```typescript
// Houses API extended with quality supervision data
const houseQuerySchema = z.object({
  // ... existing fields
  includeSixOnSite: z.string().optional().transform(val => val === 'true'),
})

// Include condition for quality supervision data
const includeCondition: any = {
  applicant: { select: { id: true, realName: true, phone: true } },
  _count: {
    select: {
      housePhotos: true,
      inspections: true,
      sixOnSiteRecords: true,
    }
  }
}

if (includeSixOnSite) {
  includeCondition.sixOnSiteRecords = {
    orderBy: { scheduledDate: 'desc' }
  }
}
```

### Permission System Extensions
```typescript
// Quality supervision permissions added to role-based access control
export enum Permission {
  // ... existing permissions
  SIX_ON_SITE_VIEW = 'six_on_site:view',
  SIX_ON_SITE_CREATE = 'six_on_site:create',
  SIX_ON_SITE_EDIT = 'six_on_site:edit',
  SIX_ON_SITE_DELETE = 'six_on_site:delete',
  SIX_ON_SITE_MANAGE = 'six_on_site:manage',
}

// Permission mappings for API routes
const mappings: Record<string, Permission> = {
  // ... existing mappings
  'six_on_site_read': Permission.SIX_ON_SITE_VIEW,
  'six_on_site_create': Permission.SIX_ON_SITE_CREATE,
  'six_on_site_update': Permission.SIX_ON_SITE_EDIT,
  'six_on_site_delete': Permission.SIX_ON_SITE_DELETE,
  'six_on_site_manage': Permission.SIX_ON_SITE_MANAGE,
}
```

### Database Schema Extensions
```sql
-- Six on-site records table
CREATE TABLE six_on_site_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
    on_site_type VARCHAR(20) NOT NULL,
    scheduled_date DATE NOT NULL,
    actual_date DATE,
    responsible_unit VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    arrival_time TIMESTAMP,
    departure_time TIMESTAMP,
    work_content TEXT,
    findings TEXT,
    suggestions TEXT,
    photos TEXT[],
    documents TEXT[],
    remarks TEXT,
    recorded_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_six_on_site_house_id ON six_on_site_records(house_id);
CREATE INDEX idx_six_on_site_type ON six_on_site_records(on_site_type);
CREATE INDEX idx_six_on_site_scheduled_date ON six_on_site_records(scheduled_date);
CREATE INDEX idx_six_on_site_status ON six_on_site_records(status);
```

### Component Integration Best Practices
```typescript
// Modal-based management for detailed operations
const handleOpenManagement = (house: HouseWithSixOnSite) => {
  setSelectedHouse(house)
  setIsManagementModalVisible(true)
}

// Modal with full-width layout for complex management interfaces
<Modal
  title={`六到场管理 - ${selectedHouse?.address}`}
  open={isManagementModalVisible}
  footer={null}
  width={1400}
  style={{ top: 20 }}
>
  <SixOnSiteManagement
    houseId={selectedHouse.id}
    houseAddress={selectedHouse.address}
    onClose={() => {
      setIsManagementModalVisible(false)
      setSelectedHouse(null)
      fetchHousesWithSixOnSite() // Refresh data
    }}
  />
</Modal>
```

## PC Data Collection Tools Implementation

### Village Portal Configuration
```typescript
// Village-specific data entry portal
const VillageDataEntry = ({ villageCode, templates }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  
  const steps = [
    { title: '农房基础信息', component: HouseBasicForm },
    { title: '建设过程信息', component: HouseConstructionForm },
    { title: '工匠信息', component: CraftsmanInfoForm },
    { title: '数据审核', component: DataReview },
  ].filter(step => templates.includes(step.key) || step.key === 'review')

  const handleNext = async (stepData) => {
    const newFormData = { ...formData, ...stepData }
    setFormData(newFormData)
    await saveDraft(newFormData)
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  return (
    <Card title={`村庄数据填报 - ${villageCode}`}>
      <Steps current={currentStep}>
        {steps.map(step => (
          <Step key={step.key} title={step.title} />
        ))}
      </Steps>
      <CurrentStepComponent onNext={handleNext} data={formData} />
    </Card>
  )
}
```

### Batch Import System
```typescript
// Excel batch import with validation
const BatchImport = () => {
  const handleFileUpload = async (file) => {
    const data = await readExcelFile(file)
    const validationResult = validateImportData(data)
    
    if (validationResult.errors.length > 0) {
      setImportResult({
        total: data.length,
        success: 0,
        failed: data.length,
        errors: validationResult.errors
      })
      return
    }

    const response = await fetch('/api/data-collection/batch-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ data })
    })

    const result = await response.json()
    setImportResult(result.data)
  }

  const validateImportData = (data) => {
    const errors = []
    data.forEach((row, index) => {
      if (!row['农房地址']) {
        errors.push({
          row: index + 2,
          field: '农房地址',
          message: '农房地址不能为空'
        })
      }
      // Additional validation rules...
    })
    return { errors }
  }
}
```

### Template Management System
```typescript
// Dynamic form template configuration
const TemplateManager = () => {
  const [templates, setTemplates] = useState([])
  
  const createTemplate = async (templateData) => {
    const response = await fetch('/api/data-collection/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(templateData)
    })
    
    if (response.ok) {
      message.success('模板创建成功')
      fetchTemplates()
    }
  }

  const templateFields = [
    { name: 'address', label: '农房地址', type: 'text', required: true },
    { name: 'floors', label: '房屋层数', type: 'number', validation: { min: 1, max: 10 } },
    { name: 'houseType', label: '房屋类型', type: 'select', options: ['农村住宅', '商业用房'] },
  ]

  return (
    <Card title="数据模板管理">
      <TemplateForm fields={templateFields} onSubmit={createTemplate} />
    </Card>
  )
}
```

## Mobile Mini-Program Implementation

### WeChat Mini-Program Architecture
```javascript
// app.js - Mini-program entry point
App({
  globalData: {
    apiUrl: 'https://your-api-domain.com',
    userInfo: null,
  },

  onLaunch() {
    this.checkLoginStatus()
    this.initSyncManager()
    this.watchNetworkStatus()
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.validateToken(token)
    }
  },

  watchNetworkStatus() {
    wx.onNetworkStatusChange((res) => {
      if (res.isConnected) {
        const syncManager = require('./utils/sync').default
        syncManager.checkNetworkAndSync()
      }
    })
  }
})
```

### Craftsman Mobile Interface
```javascript
// pages/craftsman/index.js - Craftsman dashboard
Page({
  data: {
    userInfo: {},
    projects: [],
    todayTasks: [],
  },

  onLoad() {
    this.loadUserInfo()
    this.loadProjects()
  },

  // Report construction progress
  reportProgress() {
    wx.navigateTo({
      url: '/pages/craftsman/report-progress/index'
    })
  },

  // Upload construction photos
  async uploadPhotos() {
    try {
      const uploadManager = require('../../utils/upload').default
      const photos = await uploadManager.uploadImage({ count: 9 })
      
      await this.submitProgressReport({
        photos: photos,
        timestamp: Date.now()
      })
      
      wx.showToast({ title: '上传成功', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  }
})
```

### Farmer Application Interface
```javascript
// pages/farmer/apply/index.js - House application
Page({
  data: {
    formData: {
      applicantName: '',
      address: '',
      houseType: '',
      floors: 1,
    },
    currentStep: 0,
  },

  nextStep() {
    if (this.validateCurrentStep()) {
      this.setData({
        currentStep: this.data.currentStep + 1
      })
    }
  },

  async submitApplication() {
    wx.showLoading({ title: '提交中...' })
    
    try {
      const response = await wx.request({
        url: `${app.globalData.apiUrl}/api/applications`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        data: this.data.formData
      })

      wx.hideLoading()
      wx.showToast({ title: '申请提交成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
    }
  }
})
```

### Offline Data Sync
```javascript
// utils/sync.js - Data synchronization manager
class SyncManager {
  constructor() {
    this.syncQueue = []
    this.syncing = false
  }

  addToSyncQueue(action, data) {
    const syncItem = {
      id: Date.now() + Math.random(),
      action: action,
      data: data,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.syncQueue.push(syncItem)
    this.checkNetworkAndSync()
  }

  async startSync() {
    if (this.syncing || this.syncQueue.length === 0) return

    this.syncing = true
    const queue = [...this.syncQueue]

    for (let item of queue) {
      try {
        await this.syncItem(item)
        this.removeFromQueue(item.id)
      } catch (error) {
        item.retryCount++
        if (item.retryCount >= 3) {
          this.removeFromQueue(item.id)
        }
      }
    }

    this.syncing = false
  }

  async syncItem(item) {
    switch (item.action) {
      case 'CREATE_HOUSE':
        return api.post('/api/houses', item.data)
      case 'UPDATE_PROGRESS':
        return api.put(`/api/houses/${item.data.houseId}/progress`, item.data)
      case 'UPLOAD_PHOTOS':
        return api.post(`/api/houses/${item.data.houseId}/photos`, item.data)
    }
  }
}

export default new SyncManager()
```