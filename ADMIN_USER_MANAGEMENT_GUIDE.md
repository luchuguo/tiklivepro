# 管理员用户管理功能指南

## 功能概述

超级管理员登录后，可以在用户管理列表中查看所有用户的详细信息，包括手机号码、个人资料等，并支持查看达人和企业的详细信息。

## 功能特点

### 1. 用户列表显示
- **邮箱信息**：显示用户注册邮箱
- **用户类型**：达人主播、企业用户、管理员
- **创建时间**：用户注册时间
- **更新时间**：最后更新时间
- **审核状态**：已审核/待审核
- **操作按钮**：查看详情、审核通过

### 2. 用户详情查看
点击"查看"按钮可以查看用户的详细信息，包括：

#### 基本信息
- 邮箱地址
- 手机号码
- 用户类型（带颜色标识）
- 注册时间
- 更新时间
- 审核状态（带颜色标识）

#### 达人详细信息
- **头像和状态标识**：显示达人头像，认证状态、审核状态、账号状态
- **统计信息**：粉丝数、评分、评价数、直播场次
- **基本信息**：
  - TikTok账号
  - 位置
  - 时薪
  - 经验年限
  - 平均观看数
  - 创建时间
- **个人简介**：显示达人的个人介绍
- **分类标签**：显示达人的分类和标签信息

#### 企业详细信息
- **Logo和认证状态**：显示企业Logo，认证状态标识
- **基本信息**：
  - 行业
  - 公司规模
  - 营业执照
  - 创建时间
  - 更新时间
  - 网站链接（可点击）
- **公司描述**：显示企业的详细描述

## 技术实现

### 1. 数据获取
```typescript
// 获取用户资料，包含手机号码
const { data: profiles, error } = await supabase
  .from('user_profiles')
  .select('*')
  .order('created_at', { ascending: false })

// 并发获取审核字段和详细信息
const enhanced = await Promise.all(
  (profiles || []).map(async (u: any) => {
    // 获取达人详细信息
    if (u.user_type === 'influencer') {
      const { data } = await supabase
        .from('influencers')
        .select(`
          is_approved, 
          nickname, 
          real_name, 
          tiktok_account, 
          bio, 
          location, 
          categories, 
          tags, 
          hourly_rate, 
          experience_years, 
          avatar_url,
          followers_count,
          rating,
          total_reviews,
          total_live_count,
          avg_views,
          status,
          is_verified,
          created_at,
          updated_at
        `)
        .eq('user_id', u.user_id)
        .single()
      // ...
    }
    // 获取企业详细信息
    else if (u.user_type === 'company') {
      const { data } = await supabase
        .from('companies')
        .select(`
          is_verified, 
          company_name, 
          contact_person, 
          business_license, 
          industry, 
          company_size, 
          website, 
          description, 
          logo_url,
          created_at,
          updated_at
        `)
        .eq('user_id', u.user_id)
        .single()
      // ...
    }
  })
)
```

### 2. 表格显示
```typescript
<table className="min-w-full text-sm text-left border divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-4 py-3 font-medium text-gray-700">邮箱</th>
      <th className="px-4 py-3 font-medium text-gray-700">手机号码</th>
      <th className="px-4 py-3 font-medium text-gray-700">类型</th>
      <th className="px-4 py-3 font-medium text-gray-700">创建时间</th>
      <th className="px-4 py-3 font-medium text-gray-700">更新时间</th>
      <th className="px-4 py-3 font-medium text-gray-700">审核状态</th>
      <th className="px-4 py-3 font-medium text-gray-700">操作</th>
    </tr>
  </thead>
  <tbody>
    {/* 用户数据行 */}
  </tbody>
</table>
```

### 3. 详情弹窗
```typescript
{selectedProfile && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      {/* 基本信息区域 */}
      <div className="bg-gray-50 rounded-lg p-4">
        {/* 基本信息内容 */}
      </div>
      
      {/* 详细信息区域 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {/* 达人/企业详细信息 */}
      </div>
    </div>
  </div>
)}
```

## 用户体验

### 1. 视觉设计
- **响应式布局**：支持不同屏幕尺寸
- **颜色标识**：不同类型用户使用不同颜色
- **状态标签**：审核状态使用颜色区分
- **图片显示**：头像和Logo支持错误回退

### 2. 交互体验
- **搜索功能**：支持按邮箱、用户ID、用户类型搜索
- **刷新功能**：一键刷新用户列表
- **详情查看**：点击查看按钮打开详情弹窗
- **审核操作**：直接审核通过待审核用户

### 3. 信息展示
- **分层展示**：基本信息 + 详细信息
- **网格布局**：信息分类清晰
- **标签展示**：分类和标签使用彩色标签
- **链接支持**：网站链接可点击跳转

## 安全考虑

### 1. 权限控制
- 只有超级管理员可以访问
- 用户信息查询权限验证
- 审核操作权限验证

### 2. 数据保护
- 敏感信息脱敏显示
- 手机号码仅在详情页面显示
- 邮箱地址正常显示

### 3. 操作日志
- 审核操作记录
- 查看操作记录
- 管理员操作追踪

## 后续优化

### 1. 功能增强
- **批量操作**：支持批量审核
- **导出功能**：导出用户数据
- **筛选功能**：按时间、状态筛选
- **分页功能**：大量数据分页显示

### 2. 性能优化
- **数据缓存**：减少重复查询
- **懒加载**：图片懒加载
- **虚拟滚动**：大量数据虚拟滚动

### 3. 用户体验
- **实时更新**：数据实时同步
- **操作反馈**：操作成功/失败提示
- **快捷键**：支持键盘快捷键
- **移动适配**：移动端优化

## 注意事项

1. **数据隐私**：确保用户隐私信息得到保护
2. **操作权限**：严格控制管理员权限
3. **数据准确性**：确保显示信息的准确性
4. **性能考虑**：大量数据时的性能优化
5. **错误处理**：完善的错误处理机制 