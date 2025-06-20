# 📁 项目结构说明

Clear Trans 采用模块化的项目结构，便于开发、维护和扩展。

## 🏗️ 目录结构

```
clear-trans/
├── 📱 src/                          # 源代码目录
│   ├── 🧩 components/               # React 组件
│   │   ├── ui/                     # 基础 UI 组件
│   │   │   ├── Button.tsx          # 按钮组件
│   │   │   ├── Toast.tsx           # 消息提示组件
│   │   │   ├── CustomSelect.tsx    # 自定义选择器
│   │   │   ├── Sidebar.tsx         # 侧边栏组件
│   │   │   └── index.ts            # 统一导出
│   │   ├── features/               # 功能组件
│   │   │   ├── InputArea.tsx       # 输入区域
│   │   │   ├── OutputArea.tsx      # 输出区域
│   │   │   ├── LanguageSelector.tsx # 语言选择器
│   │   │   ├── ConfigSidebar.tsx   # 配置侧边栏
│   │   │   └── index.ts            # 统一导出
│   │   ├── layout/                 # 布局组件
│   │   │   ├── Header.tsx          # 页面头部
│   │   │   ├── Footer.tsx          # 页面尾部
│   │   │   ├── FloatingButtons.tsx # 悬浮按钮
│   │   │   └── index.ts            # 统一导出
│   │   └── index.ts                # 组件根级导出
│   │
│   ├── 🎣 hooks/                    # 自定义 Hooks
│   │   ├── useTranslation.ts       # 翻译功能 Hook
│   │   ├── useLanguage.ts          # 语言选择 Hook
│   │   └── index.ts                # 统一导出
│   │
│   ├── 🔧 services/                 # 业务服务层
│   │   ├── translation/            # 翻译服务
│   │   │   ├── translateService.ts # 翻译核心服务
│   │   │   └── index.ts            # 统一导出
│   │   ├── storage/                # 存储服务
│   │   │   ├── secureStorage.ts    # 安全存储服务
│   │   │   └── index.ts            # 统一导出
│   │   └── api/                    # API 服务（未来扩展）
│   │
│   ├── 📝 types/                    # TypeScript 类型定义
│   │   ├── translation.ts          # 翻译相关类型
│   │   ├── language.ts             # 语言相关类型
│   │   ├── config.ts               # 配置相关类型
│   │   └── index.ts                # 统一导出
│   │
│   ├── 🛠️ utils/                    # 工具函数
│   │   ├── helpers/                # 辅助函数
│   │   │   └── textUtils.ts        # 文本处理工具
│   │   ├── validators/             # 验证器
│   │   │   └── index.ts            # 验证函数
│   │   ├── formatters/             # 格式化器（未来扩展）
│   │   └── index.ts                # 统一导出
│   │
│   ├── 📊 constants/                # 常量配置
│   │   ├── languages.ts            # 语言列表配置
│   │   ├── storage.ts              # 存储相关常量
│   │   ├── api.ts                  # API 相关常量
│   │   └── index.ts                # 统一导出
│   │
│   ├── ⚙️ config/                   # 配置管理
│   │   ├── env.ts                  # 环境变量配置
│   │   ├── api.ts                  # API 配置（未来扩展）
│   │   └── default.ts              # 默认配置（未来扩展）
│   │
│   ├── 📱 app/                      # Next.js App Router
│   │   ├── api/                    # API 路由
│   │   │   └── translate/          # 翻译 API
│   │   │       └── route.ts        # 翻译接口实现
│   │   ├── globals.css             # 全局样式
│   │   ├── layout.tsx              # 根布局
│   │   └── page.tsx                # 主页面
│   │
│   └── index.ts                    # 根级统一导出
│
├── 📦 public/                       # 静态资源
│   ├── favicon.svg                 # 网站图标
│   ├── fonts/                      # 字体文件
│   └── *.svg                       # 其他图标
│
├── 📚 docs/                         # 项目文档
│   └── PROJECT_STRUCTURE.md       # 项目结构说明
│
├── 🔧 配置文件
│   ├── package.json                # 项目依赖和脚本
│   ├── tsconfig.json               # TypeScript 配置
│   ├── tailwind.config.js          # Tailwind CSS 配置
│   ├── next.config.ts              # Next.js 配置
│   ├── eslint.config.mjs           # ESLint 配置
│   └── postcss.config.mjs          # PostCSS 配置
│
├── 📄 环境和部署
│   ├── env.example                 # 环境变量示例
│   ├── .env.local                  # 本地环境变量
│   ├── deploy.sh                   # 部署脚本
│   └── deploy.conf                 # 部署配置
│
└── 📖 项目文档
    ├── README.md                   # 项目说明
    ├── CONTRIBUTING.md             # 贡献指南
    ├── DEPLOYMENT.md               # 部署指南
    └── LICENSE                     # 开源协议
```

## 🎯 设计原则

### 1. **分层架构**
- **表现层（Components）**: UI 组件和布局
- **业务层（Services）**: 业务逻辑和数据处理
- **数据层（Storage）**: 数据存储和管理
- **工具层（Utils）**: 通用工具和辅助函数

### 2. **模块化组织**
- **按功能分组**: 相关功能放在同一目录
- **统一导出**: 每个目录都有 index.ts 统一导出
- **清晰边界**: 各模块职责明确，依赖关系清晰

### 3. **类型安全**
- **完整的类型定义**: 所有接口和类型都有明确定义
- **类型统一管理**: 类型定义集中在 types 目录
- **导入优化**: 使用路径别名简化导入

### 4. **可扩展性**
- **预留扩展空间**: 为未来功能预留目录结构
- **插件化设计**: 支持功能模块的独立开发
- **配置驱动**: 通过配置文件控制功能开关

## 🔗 导入路径别名

配置了以下路径别名，简化导入语句：

```typescript
// 别名配置
"@/*": ["./src/*"]
"@/components/*": ["./src/components/*"]
"@/hooks/*": ["./src/hooks/*"]
"@/services/*": ["./src/services/*"]
"@/types/*": ["./src/types/*"]
"@/constants/*": ["./src/constants/*"]
"@/utils/*": ["./src/utils/*"]
"@/config/*": ["./src/config/*"]

// 使用示例
import { Button } from '@/components/ui';
import { useTranslation } from '@/hooks';
import { translateText } from '@/services/translation';
import { TranslationConfig } from '@/types';
```

## 📈 扩展指南

### 添加新功能组件
1. 在 `src/components/features/` 创建组件文件
2. 在 `src/components/features/index.ts` 中导出
3. 如需要类型定义，在 `src/types/` 添加

### 添加新服务
1. 在 `src/services/` 创建服务目录
2. 实现服务逻辑并创建 `index.ts` 导出
3. 在 `src/services/index.ts` 中统一导出

### 添加新工具函数
1. 在 `src/utils/helpers/` 添加工具函数
2. 在 `src/utils/index.ts` 中导出
3. 编写单元测试（未来）

### 添加新常量
1. 在 `src/constants/` 创建相应文件
2. 在 `src/constants/index.ts` 中导出
3. 保持常量的语义化命名

## 🚀 开发最佳实践

1. **组件设计**: 单一职责，可复用，Props 类型明确
2. **Hooks 使用**: 逻辑复用，状态管理，副作用处理
3. **服务分离**: 业务逻辑与 UI 分离，便于测试
4. **类型优先**: 先定义类型，再实现功能
5. **统一导出**: 使用 index.ts 文件统一导出模块
6. **路径别名**: 使用 @ 别名简化导入路径

这个结构为 Clear Trans 提供了清晰、可维护、可扩展的代码组织方式，非常适合开源项目的协作开发。 