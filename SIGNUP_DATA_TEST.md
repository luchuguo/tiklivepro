# 注册数据保存测试指南

## 🧪 测试目的

验证注册页面的两步流程是否正确保存所有用户信息到数据库中。

## 📋 测试步骤

### 1. 达人主播注册测试

#### 第一步：基本信息
- [ ] 选择用户类型：达人主播
- [ ] 输入邮箱：test.influencer@example.com
- [ ] 发送邮箱验证码
- [ ] 输入6位验证码
- [ ] 设置密码：123456
- [ ] 确认密码：123456
- [ ] 点击"下一步"

#### 第二步：信息完善
- [ ] 填写姓名：张小明
- [ ] 输入手机：13800138001
- [ ] 发送短信验证码
- [ ] 输入4位验证码
- [ ] 填写昵称：美妆达人
- [ ] 填写TikTok账号：@beauty_expert
- [ ] 填写所在地：北京
- [ ] 添加擅长领域：美妆护肤、时尚穿搭
- [ ] 添加技能标签：美妆博主、直播带货
- [ ] 填写时薪：200
- [ ] 填写经验年限：3
- [ ] 填写个人简介：专业美妆达人，擅长护肤和彩妆
- [ ] 点击"递交注册"

#### 数据库验证
检查以下表是否有对应记录：

**user_profiles 表**
```sql
SELECT * FROM user_profiles WHERE email = 'test.influencer@example.com';
```

**influencers 表**
```sql
SELECT * FROM influencers WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test.influencer@example.com');
```

### 2. 企业用户注册测试

#### 第一步：基本信息
- [ ] 选择用户类型：企业用户
- [ ] 输入邮箱：test.company@example.com
- [ ] 发送邮箱验证码
- [ ] 输入6位验证码
- [ ] 设置密码：123456
- [ ] 确认密码：123456
- [ ] 点击"下一步"

#### 第二步：信息完善
- [ ] 填写姓名：李经理
- [ ] 输入手机：13900139001
- [ ] 发送短信验证码
- [ ] 输入4位验证码
- [ ] 填写公司名称：美妆科技有限公司
- [ ] 填写联系人：李经理
- [ ] 填写营业执照：123456789012345
- [ ] 选择所属行业：美妆护肤
- [ ] 选择公司规模：51-100人
- [ ] 填写官网：https://beauty-tech.com
- [ ] 填写公司简介：专业美妆产品研发和销售
- [ ] 点击"递交注册"

#### 数据库验证
检查以下表是否有对应记录：

**user_profiles 表**
```sql
SELECT * FROM user_profiles WHERE email = 'test.company@example.com';
```

**companies 表**
```sql
SELECT * FROM companies WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test.company@example.com');
```

## 🔍 验证要点

### 数据完整性检查

1. **user_profiles 表**
   - [ ] user_id 正确关联
   - [ ] user_type 正确设置
   - [ ] phone 字段正确保存
   - [ ] created_at 和 updated_at 正确生成

2. **influencers 表**
   - [ ] user_id 正确关联
   - [ ] nickname 正确保存
   - [ ] real_name 正确拼接（姓+名）
   - [ ] categories 数组正确保存
   - [ ] tags 数组正确保存
   - [ ] hourly_rate 数字类型正确
   - [ ] experience_years 数字类型正确
   - [ ] 初始状态正确设置

3. **companies 表**
   - [ ] user_id 正确关联
   - [ ] company_name 正确保存
   - [ ] contact_person 正确保存
   - [ ] industry 正确保存
   - [ ] company_size 正确保存
   - [ ] 初始状态正确设置

### 错误处理测试

1. **网络错误**
   - [ ] 模拟网络断开
   - [ ] 验证注册失败
   - [ ] 检查数据库无残留数据

2. **重复邮箱**
   - [ ] 使用已存在的邮箱注册
   - [ ] 验证错误提示正确
   - [ ] 检查数据库无重复记录

3. **必填字段缺失**
   - [ ] 不填写必填字段
   - [ ] 验证前端验证正确
   - [ ] 验证后端验证正确

## 📊 测试结果记录

### 测试环境
- 浏览器：Chrome/Firefox/Safari
- 操作系统：Windows/macOS/Linux
- 网络环境：正常/慢速/断网

### 测试结果
- [ ] 达人主播注册成功
- [ ] 企业用户注册成功
- [ ] 数据保存完整
- [ ] 错误处理正确
- [ ] 用户体验良好

### 发现的问题
1. 问题描述：
   - 重现步骤：
   - 预期结果：
   - 实际结果：

## 🚀 性能测试

### 注册响应时间
- [ ] 第一步完成时间 < 3秒
- [ ] 第二步完成时间 < 5秒
- [ ] 数据库写入时间 < 2秒

### 并发测试
- [ ] 同时注册10个用户
- [ ] 验证数据一致性
- [ ] 检查无数据冲突

## 📝 测试报告

### 测试总结
- 测试日期：
- 测试人员：
- 测试版本：
- 测试结果：通过/失败

### 建议改进
1. 功能改进：
2. 性能优化：
3. 用户体验：

---

**注意**: 测试完成后请清理测试数据，避免影响生产环境。 