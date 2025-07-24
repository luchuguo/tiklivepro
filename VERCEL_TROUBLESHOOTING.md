# Vercel部署故障排除指南

## 问题描述
Vercel部署后，所有路由（包括静态路由如`/help`）都出现404错误。

## 可能的原因和解决方案

### 1. vercel.json配置问题

#### 检查配置文件
确保项目根目录存在`vercel.json`文件：
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

#### 验证步骤
1. 确认`vercel.json`在项目根目录（不是`dist`目录）
2. 确认JSON格式正确（没有语法错误）
3. 重新部署项目

### 2. Vercel项目设置问题

#### 检查项目设置
登录Vercel控制台，检查以下设置：

1. **Framework Preset**: 应该设置为`Vite`
2. **Build Command**: 应该是`npm run build`
3. **Output Directory**: 应该是`dist`
4. **Install Command**: 应该是`npm install`

#### 修改项目设置
如果设置不正确：
1. 进入项目设置
2. 点击"General"标签
3. 修改Framework Preset为"Vite"
4. 保存设置
5. 重新部署

### 3. 构建问题

#### 检查构建日志
1. 在Vercel控制台查看构建日志
2. 确认构建成功，没有错误
3. 确认`dist`目录包含`index.html`

#### 重新构建
```bash
# 本地测试构建
npm run build

# 检查dist目录内容
ls dist/
```

### 4. 缓存问题

#### 清除缓存
```bash
# 使用Vercel CLI清除缓存
vercel --prod --force

# 或者在Vercel控制台
# 进入项目设置 -> Functions -> 清除缓存
```

### 5. 环境变量问题

#### 检查环境变量
确保在Vercel中设置了必要的环境变量：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEBLUR_API_KEY`

#### 设置环境变量
1. 进入Vercel项目设置
2. 点击"Environment Variables"
3. 添加必要的环境变量
4. 重新部署

### 6. 域名配置问题

#### 检查域名设置
1. 确认域名配置正确
2. 检查DNS设置
3. 确认SSL证书有效

### 7. 替代配置方案

#### 方案1：使用routes配置
```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### 方案2：使用redirects配置
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "/index.html",
      "permanent": false
    }
  ]
}
```

#### 方案3：使用functions配置
```json
{
  "functions": {
    "app/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 8. 调试步骤

#### 步骤1：验证基本功能
1. 访问根路径：`https://your-domain.com/`
2. 如果根路径正常，说明基本部署成功

#### 步骤2：测试静态路由
1. 访问：`https://your-domain.com/help`
2. 如果404，说明路由配置有问题

#### 步骤3：检查网络请求
1. 打开浏览器开发者工具
2. 查看Network标签
3. 访问问题页面
4. 检查请求状态码和响应

#### 步骤4：查看控制台错误
1. 查看Console标签
2. 确认是否有JavaScript错误
3. 检查是否有网络错误

### 9. 联系Vercel支持

如果以上方法都无效：
1. 检查Vercel状态页面：https://vercel-status.com/
2. 查看Vercel文档：https://vercel.com/docs
3. 联系Vercel支持：https://vercel.com/support

### 10. 临时解决方案

如果问题持续存在，可以考虑：
1. 使用其他部署平台（Netlify、GitHub Pages等）
2. 使用自定义服务器配置
3. 使用CDN服务

## 预防措施

1. **本地测试**：部署前在本地测试构建
2. **环境变量**：确保所有环境变量都正确设置
3. **配置文件**：确保配置文件格式正确
4. **监控部署**：关注部署日志和错误信息

## 常见错误代码

- `404 NOT_FOUND`: 路由配置问题
- `500 Internal Server Error`: 服务器配置问题
- `502 Bad Gateway`: 构建或环境变量问题
- `503 Service Unavailable`: Vercel服务问题 