# 生产环境配置指南

## 问题描述
你的生产环境无法获取数据，错误信息显示：`SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON`

## 问题原因
1. **环境变量配置错误**：生产环境没有正确的Supabase配置
2. **Vercel环境变量缺失**：需要在Vercel中设置环境变量
3. **API路由配置问题**：Vercel可能没有正确处理API请求

## 解决步骤

### 步骤1：获取Supabase配置
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings > API
4. 复制以下信息：
   - Project URL (例如: https://your-project.supabase.co)
   - anon public key (长字符串)

### 步骤2：在Vercel中设置环境变量
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 Settings > Environment Variables
4. 添加以下环境变量：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
VITE_AOKSEND_API_KEY=884803afe724197ac55c616976dc5387
VITE_PICUI_API_KEY=1405|3YreLPxEh0bv2VwTf7o7adFLpEs2DXdLxQ7dmr9t
```

### 步骤3：重新部署
1. 在Vercel中重新部署项目
2. 或者推送代码到GitHub触发自动部署

### 步骤4：验证配置
部署完成后，检查浏览器控制台是否还有Supabase配置错误。

## 常见问题

### Q: 为什么本地可以工作？
A: 本地环境可能使用了缓存的数据，或者有其他的环境变量配置。

### Q: 如何检查环境变量是否正确设置？
A: 在浏览器控制台中查看Supabase配置检查的日志输出。

### Q: 部署后还是不行怎么办？
A: 
1. 确认环境变量已正确设置
2. 检查Supabase项目状态
3. 验证域名是否在Supabase中配置
4. 检查RLS策略设置

## 预防措施
1. 永远不要在代码中硬编码敏感信息
2. 使用环境变量管理配置
3. 定期检查生产环境的配置
4. 设置监控和告警 