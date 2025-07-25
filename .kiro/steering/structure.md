# Project Structure

## Directory Organization

```
├── .kiro/                    # Kiro AI assistant configuration
│   ├── steering/            # AI steering rules and guidelines
│   └── specs/               # Project specifications
├── src/                     # Source code (all application code goes here)
│   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── globals.css      # Global styles and Tailwind imports
│   │   ├── layout.tsx       # Root layout with providers
│   │   └── page.tsx         # Home page component
│   ├── components/          # React components
│   │   └── ui/              # shadcn/ui components (auto-generated)
│   └── lib/                 # Utility functions and shared logic
│       └── utils.ts         # Common utilities (cn function, etc.)
├── public/                  # Static assets (images, icons, etc.)
└── [config files]          # Root-level configuration files
```

## File Naming Conventions

- **Components**: PascalCase for component files (`Button.tsx`, `UserProfile.tsx`)
- **Pages**: lowercase for App Router (`page.tsx`, `layout.tsx`, `loading.tsx`)
- **Utilities**: camelCase for utility files (`utils.ts`, `apiHelpers.ts`)
- **Styles**: kebab-case for CSS files (`globals.css`, `component-styles.css`)

## Import Patterns

- Use path aliases: `@/components/ui/button` instead of relative paths
- Group imports: external libraries first, then internal modules
- Prefer named imports over default imports when possible

## Component Organization

- **UI Components**: Place in `src/components/ui/` (managed by shadcn/ui)
- **Feature Components**: Create feature-specific folders in `src/components/`
- **Page Components**: Keep page-specific components close to their routes
- **Shared Components**: Place common components in `src/components/`

## Styling Guidelines

- Use Tailwind utility classes for styling
- Leverage the `cn()` utility function for conditional classes
- Follow the established design token system in `tailwind.config.ts`
- Prefer Ant Design components for complex UI patterns
- Use shadcn/ui for custom styled components

## Code Organization Rules

- Keep components focused and single-responsibility
- Extract complex logic into custom hooks or utility functions
- Use TypeScript interfaces for prop definitions
- Maintain consistent file structure within feature directories
- Group related functionality together