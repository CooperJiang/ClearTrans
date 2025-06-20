# 📋 项目结构迁移指南

本指南帮助你了解项目结构优化后的变化，以及如何更新现有代码。

## 🔄 主要变化

### 1. 目录结构重组

| 旧路径 | 新路径 | 说明 |
|--------|--------|------|
| `src/components/Button.tsx` | `src/components/ui/Button.tsx` | 基础UI组件统一归类 |
| `src/components/InputArea.tsx` | `src/components/features/InputArea.tsx` | 功能组件独立分组 |
| `src/components/Header.tsx` | `src/components/layout/Header.tsx` | 布局组件分离 |
| `src/services/translateService.ts` | `src/services/translation/translateService.ts` | 服务按功能分组 |
| `src/utils/storage.ts` | `src/services/storage/secureStorage.ts` | 存储服务重新分类 |

### 2. 新增目录和文件

```
新增：
├── src/types/                      # 类型定义目录
├── src/hooks/                      # 自定义Hooks
├── src/config/                     # 配置管理
├── src/constants/api.ts            # API常量
├── src/constants/storage.ts        # 存储常量
├── src/utils/helpers/              # 工具函数
├── src/utils/validators/           # 验证器
└── docs/                          # 项目文档
```

### 3. 统一导出结构

所有目录都添加了 `index.ts` 文件，提供统一的导出接口：

```typescript
// 组件导出示例
export * from './ui';
export * from './features';
export * from './layout';

// 服务导出示例
export * from './translation';
export * from './storage';
```

## 📝 导入路径更新

### 旧的导入方式
```typescript
// 组件导入
import Button from '../components/Button';
import InputArea from '../components/InputArea';
import { SecureStorage } from '../utils/storage';
import { translateText } from '../services/translateService';

// 相对路径复杂
import { getLanguageName } from '../../constants/languages';
```

### 新的导入方式
```typescript
// 使用路径别名和统一导出
import { Button } from '@/components/ui';
import { InputArea } from '@/components/features';
import { SecureStorage } from '@/services/storage';
import { translateText } from '@/services/translation';

// 从统一入口导入
import { getAdvancedLanguageName } from '@/constants';
```

## 🔧 需要手动更新的文件

由于项目结构重组，以下文件需要手动更新导入路径：

### 1. 主页面文件
**文件**: `src/app/page.tsx`

```typescript
// 更新前
import Header from '../components/Header';
import InputArea from '../components/InputArea';
import { useLanguage } from '../components/LanguageSelector';

// 更新后
import { Header } from '@/components/layout';
import { InputArea, useLanguage } from '@/components/features';
```

### 2. 功能组件文件
需要更新以下组件的导入路径：
- `src/components/features/InputArea.tsx`
- `src/components/features/ConfigSidebar.tsx`
- `src/components/features/LanguageSelector.tsx`

```typescript
// 更新导入
import { Button } from '@/components/ui';
import { translateText } from '@/services/translation';
import { STORAGE_KEYS } from '@/constants';
```

### 3. API路由文件
**文件**: `src/app/api/translate/route.ts`

已自动更新为使用新的配置系统：
```typescript
import { getEnvConfig } from '@/config/env';
```

## 🎯 新功能和改进

### 1. 环境配置统一管理
```typescript
// 新的配置方式
import { getEnvConfig } from '@/config/env';

const config = getEnvConfig();
console.log(config.openai.apiKey);
console.log(config.app.port);
```

### 2. 增强的类型定义
```typescript
// 完整的类型支持
import type { 
  TranslationConfig, 
  TranslationHistory,
  Language,
  UserPreferences 
} from '@/types';
```

### 3. 丰富的工具函数
```typescript
// 文本处理工具
import { 
  truncateText,
  splitTextIntoChunks,
  detectTextLanguage 
} from '@/utils';

// 验证器
import { 
  validateApiKey,
  validateUrl,
  validateTranslationConfig 
} from '@/utils';
```

### 4. 自定义Hooks
```typescript
// 翻译功能Hook
import { useTranslation } from '@/hooks';

const { isTranslating, translate, history } = useTranslation();

// 语言选择Hook
import { useLanguage } from '@/hooks';

const { sourceLanguage, targetLanguage, swapLanguages } = useLanguage();
```

## ✅ 迁移检查清单

完成以下步骤确保迁移成功：

- [ ] 更新所有组件文件的导入路径
- [ ] 验证 TypeScript 编译无错误
- [ ] 确认所有页面正常加载
- [ ] 测试翻译功能是否正常
- [ ] 检查语言选择功能
- [ ] 验证配置保存和加载
- [ ] 测试API接口响应

## 🚀 构建和运行

更新完成后，重新安装依赖并启动项目：

```bash
# 清理 node_modules 和 .next（可选）
rm -rf node_modules .next

# 重新安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📞 获取帮助

如果在迁移过程中遇到问题：

1. **查看错误信息**: TypeScript 会提供详细的错误位置
2. **检查导入路径**: 确保使用了正确的新路径
3. **参考项目结构文档**: 查看 `docs/PROJECT_STRUCTURE.md`
4. **查看示例文件**: 参考已更新的文件作为示例

## 🎉 迁移后的优势

完成迁移后，你将享受到：

- ✅ **更清晰的代码组织**: 分层架构，职责明确
- ✅ **更好的开发体验**: 路径别名，统一导出
- ✅ **更强的类型安全**: 完整的类型定义
- ✅ **更容易的维护**: 模块化设计，便于扩展
- ✅ **更好的协作**: 标准化的项目结构

新的项目结构为后续开发和开源协作提供了坚实的基础！