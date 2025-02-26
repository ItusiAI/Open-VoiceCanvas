# VoiceCanvas

VoiceCanvas 是一个先进的多语言语音合成平台，使用最新的 AI 技术提供高质量的文字转语音服务。

## 🌟 主要特点

### 多语言支持
- 支持超过 25 种语言，包括：
  - 中文、英文、日文、韩文
  - 欧洲语言：法语、德语、意大利语、西班牙语等
  - 亚洲语言：印地语、印尼语、阿拉伯语等
  - 其他地区语言：希伯来语、威尔士语等

### 语音功能
- 高质量语音合成
- 男声/女声选择
- 语速调节
- 逐字朗读模式
- 实时音频预览
- 音频可视化

### 文件处理
- 支持文本文件上传
- 音频文件下载
- 支持长文本处理

### 用户系统
- 用户注册和登录
- 第三方登录（Google、GitHub）
- 多语言界面
- 深色/浅色主题切换

### 订阅系统
- 免费试用计划
- 按年/按月订阅
- 按量付费选项
- 字符配额管理

## 🛠️ 技术栈

- **前端框架**: Next.js 14
- **UI 组件**: Tailwind CSS, shadcn/ui
- **认证**: NextAuth.js
- **数据库**: PostgreSQL (Neon)
- **ORM**: Prisma
- **语音服务**: 
  - AWS Polly
  - MiniMax
- **部署**: Vercel

## 📦 安装

1. 克隆仓库
```bash
git clone https://github.com/ItusiAI/Open-VoiceCanvas.git
cd Open-VoiceCanvas
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
# 创建 .env 文件并添加以下配置

# AWS Polly
NEXT_PUBLIC_AWS_REGION="us-east-1"
NEXT_PUBLIC_AWS_ACCESS_KEY_ID="your_aws_access_key_id"
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"

# MiniMax
MINIMAX_API_KEY="your_minimax_api_key"
MINIMAX_GROUP_ID="your_minimax_group_id"

# Database
DATABASE_URL="your_neon_db_url"

# Stripe
STRIPE_SECRET_KEY="your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"

# OAuth 提供商配置
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"
GOOGLE_ID="your_google_client_id"
GOOGLE_SECRET="your_google_client_secret"
```

4. 运行数据库迁移
```bash
npx prisma migrate dev
```

5. 启动开发服务器
```bash
npm run dev
```

## 🔑 环境变量

| 变量名 | 描述 | 必需 |
|--------|------|------|
| NEXT_PUBLIC_AWS_REGION | AWS 区域 (默认 us-east-1) | 是 |
| NEXT_PUBLIC_AWS_ACCESS_KEY_ID | AWS 访问密钥 ID | 是 |
| NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY | AWS 访问密钥 | 是 |
| MINIMAX_API_KEY | MiniMax API 密钥 | 是 |
| MINIMAX_GROUP_ID | MiniMax 组 ID | 是 |
| DATABASE_URL | Neon PostgreSQL 数据库连接 URL | 是 |
| STRIPE_SECRET_KEY | Stripe 密钥 | 是 |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe 公钥 | 是 |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook 密钥 | 是 |
| NEXTAUTH_URL | NextAuth URL (开发环境为 http://localhost:3000) | 是 |
| NEXTAUTH_SECRET | NextAuth 密钥 | 是 |
| GITHUB_ID | GitHub OAuth 客户端 ID | 否 |
| GITHUB_SECRET | GitHub OAuth 客户端密钥 | 否 |
| GOOGLE_ID | Google OAuth 客户端 ID | 否 |
| GOOGLE_SECRET | Google OAuth 客户端密钥 | 否 |

## 📝 数据库模型

### 用户 (users)
- 基本信息：邮箱、密码、名称、头像
- 认证信息：提供商、提供商 ID
- 使用统计：总字符使用量、最后使用时间
- 偏好设置：语言、时区

### 订阅 (Subscription)
- 计划类型
- 开始和结束日期
- 状态

### 字符配额 (CharacterQuota)
- 永久配额
- 临时配额
- 已使用字符数
- 配额过期时间

## 🌐 支持的语言

| 语言 | 代码 |
|------|------|
| 中文 | zh |
| 英文 | en |
| 日文 | ja |
| 韩文 | ko |
| 粤语 | yue |
| 西班牙语 | es |
| 法语 | fr |
| 德语 | de |
| 意大利语 | it |
| 葡萄牙语 | pt |
| 俄语 | ru |
| 荷兰语 | nl |
| 瑞典语 | sv |
| 挪威语 | no |
| 丹麦语 | da |
| 芬兰语 | fi |
| 希腊语 | el |
| 波兰语 | pl |
| 罗马尼亚语 | ro |
| 匈牙利语 | hu |
| 土耳其语 | tr |
| 威尔士语 | cy |
| 阿拉伯语 | ar |
| 希伯来语 | he |
| 印地语 | hi |
| 印尼语 | id |

## 📄 许可证

版权所有 © 2025 VoiceCanvas 