# 青岛市农房建设管理和乡村建设工匠培训信息平台

青岛市农房建设管理和乡村建设工匠培训、信用考核评价信息平台是一个综合性的数字化管理系统，旨在贯彻落实国家对乡村建设工匠培训和管理的重要指示精神。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **开发语言**: TypeScript
- **样式框架**: Tailwind CSS
- **UI组件库**: Ant Design 5.x + shadcn/ui
- **包管理器**: pnpm
- **代码格式化**: Prettier
- **代码检查**: ESLint

## 开发环境设置

### 安装依赖

```bash
pnpm install
```

### 开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 修复代码检查问题
pnpm lint:fix

# 格式化代码
pnpm format

# 检查代码格式
pnpm format:check
```

## 项目结构

```
├── .kiro/                    # Kiro 配置文件
│   └── specs/               # 项目规格文档
├── src/                     # 源代码目录
│   ├── app/                 # Next.js App Router 页面
│   ├── components/          # React 组件
│   │   └── ui/             # shadcn/ui 组件
│   └── lib/                # 工具函数
├── public/                  # 静态资源
├── package.json            # 项目配置
├── tailwind.config.ts      # Tailwind CSS 配置
├── tsconfig.json           # TypeScript 配置
└── next.config.js          # Next.js 配置
```

## 功能模块

1. **农房信息管理系统** - 全面管理农房基础信息，实现数字化监管
2. **乡村建设工匠管理系统** - 建立完整的工匠管理名录和培训体系
3. **工匠信用评价系统** - 建立动态的工匠信用评价体系
4. **质量安全监管系统** - 实时监控农房建设质量和安全
5. **PC端数据采集工具** - 便捷的数据填报工具
6. **移动端小程序应用** - 多终端支持的移动应用

## 开发规范

- 使用 TypeScript 进行类型安全的开发
- 遵循 ESLint 代码检查规则
- 使用 Prettier 进行代码格式化
- 组件使用 Ant Design 和 shadcn/ui 构建
- 样式使用 Tailwind CSS 工具类

## 部署

项目基于 Next.js 构建，支持多种部署方式：

- Vercel (推荐)
- 自托管 Node.js 服务器
- Docker 容器化部署

## 许可证

本项目为青岛市政府内部使用系统。