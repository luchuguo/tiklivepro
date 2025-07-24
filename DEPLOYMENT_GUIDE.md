# 部署指南

## 问题描述
部署后出现404错误，但本地运行正常。这是因为React Router的客户端路由需要特殊配置。

## 解决方案

### 1. 已添加的配置文件

#### Netlify部署
- 创建了 `public/_redirects` 文件：
```
/*    /index.html   200
```

#### Vercel部署
- 创建了 `vercel.json` 文件：
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. 其他部署平台配置

#### GitHub Pages
在 `package.json` 中添加：
```json
{
  "homepage": "https://yourusername.github.io/your-repo-name",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

#### 传统静态服务器 (Apache)
创建 `.htaccess` 文件：
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Nginx
在nginx配置中添加：
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### 3. 构建和部署步骤

1. **构建项目**：
```bash
npm run build
```

2. **测试构建结果**：
```bash
npm run preview
```

3. **部署到平台**：
   - 将 `dist` 目录的内容上传到你的托管平台
   - 确保平台配置了正确的路由重写规则

### 4. 验证部署

部署后，测试以下路由是否正常工作：
- `/` - 首页
- `/influencers` - 达人列表
- `/tasks` - 任务大厅
- `/admin` - 管理后台
- `/company/123` - 公司详情页
- `/influencer/456` - 达人详情页
- `/task/789` - 任务详情页

### 5. 常见问题

#### 问题：刷新页面出现404
**原因**：服务器没有配置路由重写
**解决**：确保添加了相应的重写配置文件

#### 问题：某些路由无法访问
**原因**：可能是构建配置问题
**解决**：检查 `vite.config.ts` 和路由配置

#### 问题：静态资源加载失败
**原因**：路径配置不正确
**解决**：检查 `vite.config.ts` 中的 `base` 配置

## 环境变量配置

确保部署平台配置了必要的环境变量：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEBLUR_API_KEY`

## 联系支持

如果部署后仍有问题，请：
1. 检查浏览器控制台错误信息
2. 确认平台的路由配置
3. 验证环境变量设置 