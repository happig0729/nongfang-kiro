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