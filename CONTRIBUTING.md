# 贡献指南

感谢您对 Clear Trans 项目的关注和贡献！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 错误报告
- ✨ 功能建议  
- 📝 文档改进
- 🔧 代码贡献
- 🌍 翻译改进

## 🚀 快速开始

### 开发环境设置

1. **Fork 仓库**
   - 点击右上角的 "Fork" 按钮

2. **克隆代码**
   ```bash
   git clone https://github.com/your-username/clear-trans.git
   cd clear-trans
   ```

3. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   # 或
   pnpm install
   ```

4. **配置环境变量**
   ```bash
   cp env.example .env.local
   # 编辑 .env.local 添加你的 API 配置
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 📋 贡献流程

### 1. 创建议题 (Issue)

在开始编码之前，请先创建一个 Issue 来讨论：

- 🐛 **Bug 报告**: 描述问题、复现步骤、期望行为
- ✨ **功能请求**: 详细描述新功能的需求和用例
- 📚 **文档改进**: 说明需要改进的文档部分

### 2. 开发流程

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

2. **开发规范**
   - 遵循现有的代码风格
   - 添加必要的注释
   - 确保类型安全（TypeScript）
   - 保持组件的单一职责

3. **提交规范**
   ```bash
   git add .
   git commit -m "feat: 添加新的翻译功能"
   # 或
   git commit -m "fix: 修复语言选择器问题"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` 错误修复
   - `docs:` 文档更新
   - `style:` 代码格式调整
   - `refactor:` 代码重构
   - `test:` 添加测试
   - `chore:` 构建过程或辅助工具的变动

### 3. 测试

在提交之前，请确保：

- [ ] 代码能够正常构建 (`npm run build`)
- [ ] 没有 ESLint 错误 (`npm run lint`)
- [ ] 功能在浏览器中正常工作
- [ ] 响应式设计在各种设备上表现良好

### 4. 提交 Pull Request

1. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **创建 PR**
   - 提供清晰的 PR 标题和描述
   - 链接相关的 Issue
   - 添加截图（如果是 UI 变更）
   - 说明测试情况

3. **PR 模板**
   ```markdown
   ## 📋 变更说明
   - [ ] 新功能
   - [ ] 错误修复
   - [ ] 文档更新
   - [ ] 其他

   ## 🔗 相关 Issue
   Closes #123

   ## 📝 变更详情
   详细描述此次变更的内容...

   ## 🧪 测试
   - [ ] 本地测试通过
   - [ ] 构建成功
   - [ ] 无 ESLint 错误

   ## 📸 截图（如有必要）
   ```

## 📝 代码规范

### TypeScript

- 使用严格的类型定义
- 避免使用 `any` 类型
- 为组件和函数添加适当的类型注解

```typescript
// ✅ 好的例子
interface TranslateRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

// ❌ 避免
function translate(data: any): any {
  // ...
}
```

### React 组件

- 使用函数组件和 Hooks
- 保持组件的单一职责
- 合理使用 `useMemo` 和 `useCallback` 优化性能

```typescript
// ✅ 好的例子
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      {children}
    </button>
  );
};
```

### CSS/样式

- 使用 Tailwind CSS 实用程序类
- 保持样式的一致性
- 确保响应式设计

```tsx
// ✅ 好的例子
<div className="flex flex-col md:flex-row gap-4 p-6">
  <div className="flex-1 min-h-0">
    {/* 内容 */}
  </div>
</div>
```

## 🎯 项目架构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # 可复用组件
│   ├── ui/               # 基础 UI 组件
│   └── features/         # 功能组件
└── services/             # 业务逻辑和 API 调用
```

## 🔍 代码审查

所有的 Pull Request 都需要经过代码审查。审查重点包括：

- **功能性**: 代码是否按预期工作
- **可读性**: 代码是否清晰易懂
- **性能**: 是否有性能问题
- **安全性**: 是否存在安全隐患
- **一致性**: 是否符合项目规范

## 🌍 国际化

如果您要添加新的语言支持或改进翻译：

1. 语言代码使用 ISO 639-1 标准
2. 确保新语言在所有相关组件中都有对应
3. 测试语言切换功能

## 📞 获取帮助

如果您在贡献过程中遇到问题：

- 💬 [GitHub Discussions](https://github.com/your-username/clear-trans/discussions) - 一般讨论
- 🐛 [GitHub Issues](https://github.com/your-username/clear-trans/issues) - 错误报告和功能请求

## 🙏 感谢

感谢您的贡献！每一个贡献都让 Clear Trans 变得更好。

---

**Happy Coding! 🎉** 