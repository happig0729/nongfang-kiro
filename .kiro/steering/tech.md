# Technology Stack

## Core Framework & Language
- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Package Manager**: pnpm

## UI & Styling
- **Primary UI Library**: Ant Design 5.x (antd) with Chinese locale (zh_CN)
- **Secondary UI Components**: shadcn/ui components
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Ant Design Icons (@ant-design/icons) and Lucide React
- **Fonts**: Inter (Google Fonts)

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