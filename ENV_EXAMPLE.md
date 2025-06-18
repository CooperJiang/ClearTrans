# 环境变量配置示例

请将以下内容复制到 `.env.local` 文件中：

```bash
# ============================================
# OpenAI API 配置
# ============================================

# 必需：您的 OpenAI API 密钥
# 获取地址: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here

# 可选：自定义 API 基础 URL (如果使用代理或其他兼容服务)
# 默认: https://api.openai.com
# OPENAI_BASE_URL=https://api.openai.com

# 可选：默认使用的 AI 模型
# 可选值: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
# 默认: gpt-4o-mini (推荐，性价比最高)
# OPENAI_MODEL=gpt-4o-mini

# 可选：最大 Token 数量
# 范围: 1000-8192
# 默认: 4096
# OPENAI_MAX_TOKENS=4096

# 可选：AI 温度参数
# 范围: 0.0-2.0 (越低越精确，越高越有创意)
# 默认: 0.3 (适合翻译任务)
# OPENAI_TEMPERATURE=0.3

# ============================================
# 部署配置 (可选)
# ============================================

# Next.js 端口 (开发和生产环境)
# 默认: 3000，项目配置为: 8888
# PORT=8888

# ============================================
# 高级配置 (通常不需要修改)
# ============================================

# 如果部署到 Vercel 等平台，可能需要的公开环境变量
# (注意：这些变量会暴露到客户端，仅在特殊情况下使用)
# NEXT_PUBLIC_OPENAI_API_KEY=sk-your-fallback-key
# NEXT_PUBLIC_OPENAI_BASE_URL=https://your-proxy-url.com
```

## 配置说明

### 基本配置 (推荐)

对于大多数用户，只需要配置 `OPENAI_API_KEY` 即可：

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 高级配置

如果您需要使用代理或自定义设置：

```bash
OPENAI_API_KEY=sk-your-api-key
OPENAI_BASE_URL=https://your-proxy-domain.com
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=8192
```

### 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录或注册账户
3. 前往 [API Keys](https://platform.openai.com/api-keys) 页面
4. 点击 "Create new secret key"
5. 复制生成的密钥到 `.env.local` 文件

### 注意事项

- ⚠️ **安全**: 永远不要将 `.env.local` 文件提交到版本控制系统
- ✅ **备份**: 建议备份您的API密钥到安全的地方
- 💰 **费用**: 注意监控OpenAI账户的使用量和费用
- 🔄 **轮换**: 定期轮换API密钥以提高安全性 