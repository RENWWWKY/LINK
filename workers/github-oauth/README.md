# LINK GitHub OAuth Worker

这个 Worker 负责 GitHub OAuth code exchange，避免把 `GITHUB_CLIENT_SECRET` 放进前端。

## 配置

1. 在 GitHub 创建 OAuth App。
2. 把 callback URL 设置为：

```text
https://<worker-domain>/github/callback
```

3. 设置 Worker secrets：

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put OAUTH_STATE_SECRET
```

4. 修改 `wrangler.toml`：

```toml
APP_ORIGIN = "https://<your-link-pwa-domain>"
DEFAULT_REPO_NAME = "link-private-backups"
```

`APP_ORIGIN` 可以用逗号分隔多个来源，例如同时允许本地和线上：

```toml
APP_ORIGIN = "http://localhost:5173,https://example.com"
```

## 部署

```bash
npx wrangler deploy
```

部署完成后，把 Worker 地址写入前端环境变量：

```bash
VITE_GITHUB_OAUTH_WORKER_URL=https://link-github-oauth.<your-subdomain>.workers.dev
```