import { readFileSync, writeFileSync, existsSync } from 'fs';

// 定义需要替换的翻译键映射
const translationKeyMap = {
  // InfluencerProfilePage.tsx
  '达人个人中心': 'influencerPersonalCenter',
  '取消编辑': 'cancelEdit',
  '编辑资料': 'editProfile',
  '昵称': 'nickname',
  '请输入您的昵称': 'enterNickname',
  '真实姓名': 'realName',
  '请输入您的真实姓名（选填）': 'enterRealNameOptional',
  'TikTok账号': 'tiktokAccount',
  '请输入您的TikTok账号': 'enterTiktokAccount',
  '所在地区': 'location',
  '请输入您的所在地区': 'enterLocation',
  '小时收费（元）': 'hourlyRate',
  '请输入您的小时收费': 'enterHourlyRate',
  '从业年限': 'experienceYears',
  '请输入您的从业年限': 'enterExperienceYears',
  '个人简介': 'personalIntro',
  '请简要介绍自己...': 'briefIntro',
  '专业领域': 'professionalField',
  '选择分类...': 'selectCategory',
  '添加': 'add',
  '技能标签': 'skillTags',
  '输入标签...': 'enterTags',
  '取消': 'cancel',
  '保存中...': 'saving',
  '保存': 'save',
  '未设置昵称': 'noNicknameSet',
  '已认证': 'verified',
  '已审核': 'reviewed',
  '待审核': 'pendingReview',
  '邮箱': 'email',
  '小时收费': 'hourlyRateDisplay',
  '未设置': 'notSet',
  '年': 'year',
  '暂未设置专业领域': 'noProfessionalFieldSet',
  '暂未设置技能标签': 'noSkillTagsSet',
  '账号状态': 'accountStatus',
  '活跃': 'active',
  '不活跃': 'inactive',
  '已暂停': 'suspended',
  '未知': 'unknown',
  '审核状态': 'reviewStatus',
  '认证状态': 'certificationStatus',
  '未认证': 'uncertified',
  '数据统计': 'dataStatistics',
  '粉丝数量': 'followerCount',
  '直播场次': 'liveSessions',
  '平均观看量': 'averageViewers',
  '平均评分': 'averageRating',
  '完善您的达人资料': 'completeInfluencerProfile',
  '您还没有设置达人资料。完善资料可以帮助品牌方更好地了解您，增加合作机会。': 'noInfluencerProfile',
  '立即设置': 'setNow',
  '审核中': 'underReview',
  '您的达人资料正在审核中，审核通过后您将可以接收任务邀请和申请任务。审核通常需要1-3个工作日，请耐心等待。': 'profileUnderReview',
  '提交时间': 'submissionTime',
  '提升资料完整度': 'improveProfileCompleteness',
  '完善的资料可以提高您被品牌方选中的几率。以下是一些建议：': 'completeProfileTips',
  '添加个人简介，介绍您的专业背景和特长': 'addPersonalIntro',
  '选择您擅长的专业领域': 'selectProfessionalField',
  '添加技能标签，展示您的专业能力': 'addSkillTags',
  '关联您的TikTok账号': 'linkTiktokAccount',
  '填写您的所在地区': 'fillLocation',
  '上传个人头像': 'uploadPersonalAvatar',
  '该分类已存在': 'categoryExists',
  '该标签已存在': 'tagExists',
  '获取资料失败，请重试': 'getProfileFailedRetry',
  '获取资料时发生错误，请重试': 'getProfileErrorRetry',
  '更新资料失败，请重试': 'updateProfileFailedRetry',
  '创建资料失败，请重试': 'createProfileFailedRetry',
  '更换封面': 'changeCover',
  '头像预览': 'avatarPreview',
  '用户头像': 'userAvatar',
  '加载中...': 'loading',
  '正在获取您的资料': 'gettingYourProfile',
  '未登录': 'notLoggedIn',
  '请先登录后再访问个人中心': 'loginRequiredForPersonalCenter',
  '权限不足': 'insufficientPermissions',
  '只有达人用户可以访问此页面': 'onlyInfluencersCanAccess',
  '用户未登录': 'userNotLoggedIn',
  '昵称不能为空': 'nicknameRequired',
  '资料保存成功': 'profileSaveSuccess',
  '保存失败': 'saveFailed',
  '上传失败': 'uploadFailed',
  '上传异常': 'uploadException'
};

// 需要处理的文件列表
const filesToProcess = [
  'src/components/pages/InfluencerProfilePage.tsx',
  'src/components/pages/AccountSettingsPage.tsx',
  'src/components/pages/InfluencerTasksPage.tsx'
];

// 处理单个文件
function processFile(filePath) {
  if (!existsSync(filePath)) {
    console.log(`文件不存在: ${filePath}`);
    return;
  }

  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  // 替换翻译键
  for (const [oldKey, newKey] of Object.entries(translationKeyMap)) {
    const oldPattern = `t('${oldKey}')`;
    const newPattern = `t('${newKey}')`;
    
    if (content.includes(oldPattern)) {
      content = content.replace(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern);
      changed = true;
      console.log(`替换: ${oldKey} -> ${newKey}`);
    }
  }

  if (changed) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 已更新文件: ${filePath}`);
  } else {
    console.log(`⏭️  无需更新: ${filePath}`);
  }
}

// 主函数
function main() {
  console.log('开始批量修复翻译键...\n');
  
  for (const file of filesToProcess) {
    console.log(`处理文件: ${file}`);
    processFile(file);
    console.log('');
  }
  
  console.log('翻译键修复完成！');
}

main(); 