# Vercel路由问题快速修复指南

## 问题
本地刷新页面正常，Vercel部署后刷新页面404

## 快速修复步骤

### 1. 检查当前配置
```bash
npm run check-deployment
```

### 2. 重新构建项目
```bash
npm run build
```

### 3. 重新部署到Vercel

#### 方法1：使用Git推送
```bash
git add .
git commit -m "Fix Vercel routing configuration"
git push
```

#### 方法2：使用Vercel CLI
```bash
vercel --prod --force
```

### 4. 验证修复

部署后测试以下URL：
- `https://your-domain.com/help` (刷新页面)
- `https://your-domain.com/about` (刷新页面)
- `https://your-domain.com/influencer/123` (刷新页面)

## 如果问题仍然存在

### 检查Vercel项目设置
1. 登录Vercel控制台
2. 进入项目设置
3. 确认Framework Preset为"Vite"
4. 确认Build Command为"npm run build"
5. 确认Output Directory为"dist"

### 清除缓存
```bash
vercel --prod --force
```

### 检查环境变量
确保设置了必要的环境变量：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEBLUR_API_KEY`

## 配置文件说明

### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/help",
      "destination": "/index.html"
    },
    {
      "source": "/about",
      "destination": "/index.html"
    },
    // ... 其他路由
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### public/_redirects
```
/help    /index.html   200
/about    /index.html   200
/*    /index.html   200
```

## 常见问题

### Q: 为什么本地正常，Vercel不正常？
A: 本地Vite开发服务器内置了SPA路由处理，Vercel需要手动配置重写规则。

### Q: 配置了vercel.json还是404？
A: 检查JSON格式是否正确，确保重新部署，清除缓存。

### Q: 部分路由正常，部分404？
A: 确保所有路由都在重写规则中，或者使用通配符规则。

## 联系支持

如果问题持续存在：
1. 检查Vercel状态：https://vercel-status.com/
2. 查看构建日志
3. 联系Vercel支持 