# Vercel部署指南

## 问题描述
在Vercel部署后，动态路由页面（如 `/influencer/:id`、`/company/:id`、`/task/:id`）出现404错误。

## 解决方案

### 1. 配置文件

#### vercel.json
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

### 2. 部署步骤

1. **确保vercel.json在项目根目录**
2. **重新部署**：
   ```bash
   # 如果使用Vercel CLI
   vercel --prod
   
   # 或者通过Git推送触发自动部署
   git add .
   git commit -m "Fix routing for dynamic pages"
   git push
   ```

### 3. 验证部署

部署后，测试以下URL是否正常工作：
- `https://your-domain.com/influencer/f5524e34-1b9c-4f12-ad10-d841f3ae5cd9`
- `https://your-domain.com/company/any-company-id`
- `https://your-domain.com/task/any-task-id`

### 4. 故障排除

#### 如果仍然出现404错误：

1. **检查Vercel项目设置**：
   - 登录Vercel控制台
   - 进入项目设置
   - 确认"Framework Preset"设置为"Vite"
   - 确认"Build Command"为`npm run build`
   - 确认"Output Directory"为`dist`

2. **检查环境变量**：
   确保在Vercel中设置了必要的环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_DEBLUR_API_KEY`

3. **清除缓存重新部署**：
   ```bash
   vercel --prod --force
   ```

4. **检查构建日志**：
   - 在Vercel控制台查看构建日志
   - 确认没有构建错误

### 5. 替代配置

如果上述配置不工作，尝试以下替代配置：

#### 方案1：使用routes配置
```json
{
  "routes": [
    {
      "src": "/influencer/(.*)",
      "dest": "/index.html"
    },
    {
      "src": "/company/(.*)",
      "dest": "/index.html"
    },
    {
      "src": "/task/(.*)",
      "dest": "/index.html"
    },
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
      "source": "/influencer/:id*",
      "destination": "/index.html",
      "permanent": false
    },
    {
      "source": "/company/:id*",
      "destination": "/index.html",
      "permanent": false
    },
    {
      "source": "/task/:id*",
      "destination": "/index.html",
      "permanent": false
    }
  ]
}
```

### 6. 调试技巧

1. **检查网络请求**：
   - 打开浏览器开发者工具
   - 查看Network标签
   - 确认请求是否返回正确的HTML

2. **检查控制台错误**：
   - 查看Console标签
   - 确认是否有JavaScript错误

3. **测试静态路由**：
   - 先测试 `/`、`/influencers`、`/tasks` 等静态路由
   - 确认基本路由工作正常

### 7. 联系支持

如果问题仍然存在：
1. 检查Vercel状态页面
2. 查看Vercel社区论坛
3. 联系Vercel支持团队

## 注意事项

- 确保每次修改vercel.json后重新部署
- 动态路由的ID参数应该是有效的UUID格式
- 确保Supabase配置正确，因为页面错误可能是数据获取失败导致的 