# Vercel环境变量配置指南

## 问题分析

你的API路由现在可以正常访问，但返回的是HTML页面而不是JSON数据。这说明：

✅ **路由问题已解决**：API请求不再被前端路由拦截
❌ **环境变量问题**：API函数无法正确连接到Supabase

## 根本原因

Vercel API函数中使用的环境变量名称不正确：

### 当前问题
- API函数使用：`process.env.VITE_SUPABASE_URL`
- 但Vercel中设置的是：`VITE_SUPABASE_URL`

### 环境变量作用域
- `VITE_*` 变量：只在客户端（浏览器）可用
- `SUPABASE_*` 变量：在服务器端（API函数）可用

## 解决方案

### 1. 在Vercel中设置正确的环境变量

登录 [Vercel Dashboard](https://vercel.com/dashboard)，进入你的项目设置：

#### 必需的环境变量
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key
```

#### 可选的环境变量（保持兼容性）
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
```

### 2. 环境变量设置步骤

1. **进入Vercel项目设置**：
   - 选择你的项目
   - 点击 "Settings" 标签
   - 选择 "Environment Variables"

2. **添加服务器端环境变量**：
   ```
   Name: SUPABASE_URL
   Value: https://your-project.supabase.co
   Environment: Production, Preview, Development
   ```

   ```
   Name: SUPABASE_ANON_KEY
   Value: your_actual_anon_key
   Environment: Production, Preview, Development
   ```

3. **保持客户端环境变量**（如果前端需要）：
   ```
   Name: VITE_SUPABASE_URL
   Value: https://your-project.supabase.co
   Environment: Production, Preview, Development
   ```

### 3. 环境变量优先级

我已经修复了API函数，现在会按以下优先级查找环境变量：

```javascript
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
```

## 部署和测试步骤

### 步骤1：在Vercel中设置环境变量
按照上面的步骤在Vercel Dashboard中设置环境变量。

### 步骤2：重新部署项目
```bash
git add .
git commit -m "修复API函数环境变量配置，添加错误处理"
git push origin main
```

### 步骤3：等待部署完成
- 检查Vercel Dashboard中的部署状态
- 确认环境变量已正确设置

### 步骤4：测试API端点
使用API路由测试器重新测试：
1. 点击"测试所有API路由"
2. 检查响应类型是否变为"JSON"
3. 验证数据是否正确返回

## 预期结果

修复完成后：

### ✅ 正常情况
- **响应类型**：JSON（而不是error）
- **状态码**：200
- **数据内容**：正确的任务详情数据
- **缓存头**：正确的缓存策略

### ❌ 如果仍有问题
- **环境变量错误**：检查Vercel中的环境变量设置
- **Supabase连接失败**：检查Supabase项目状态
- **权限问题**：检查RLS策略设置

## 故障排除

### 如果API仍然返回HTML页面

1. **检查环境变量**：
   - 确认 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 已设置
   - 确认环境变量值正确

2. **检查Vercel函数日志**：
   - 在Vercel Dashboard中查看函数执行日志
   - 查找环境变量相关的错误信息

3. **验证Supabase连接**：
   - 确认Supabase项目状态正常
   - 检查API密钥是否有效

### 如果API返回500错误

1. **查看函数日志**：
   - 检查具体的错误信息
   - 确认环境变量是否正确加载

2. **测试环境变量**：
   - 在API函数中添加调试日志
   - 检查环境变量的值

## 监控和维护

### 1. 环境变量监控
- 定期检查Vercel环境变量设置
- 监控API函数的执行状态

### 2. 连接状态监控
- 监控Supabase连接状态
- 观察API响应时间

### 3. 错误率监控
- 监控API错误率
- 设置错误告警

## 总结

通过正确配置Vercel环境变量，我们解决了API函数无法连接到Supabase的问题：

- ✅ **修复了环境变量配置**：使用正确的变量名
- ✅ **添加了错误处理**：更好的调试信息
- ✅ **保持了兼容性**：支持多种环境变量名
- ✅ **改善了可靠性**：API函数现在可以正常工作

配置完成后，你的API端点应该能够返回正确的JSON数据，任务详情页面也能正常加载。 