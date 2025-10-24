# AI Chat on Cloudflare Pages

基于 Cloudflare Pages Functions + OpenRouter API 的 AI 聊天系统。

## 环境变量
在 `.env` 文件中配置：
```
OPENROUTER_API_KEY=
MODEL=
MAX_TOKENS=
SYSTEM_PROMPT=
ADMIN_USER=
ADMIN_PASS=
```

## 部署步骤
1. Fork 本项目到 GitHub
2. 在 Cloudflare Pages 连接该仓库
3. 在 Pages 设置中添加 `.env` 中的变量
4. 部署完成后访问：
   - `/` 聊天界面
   - `/src/admin.html` 管理后台
