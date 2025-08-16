import { readFileSync, writeFileSync, existsSync } from 'fs';

// 定义需要替换的翻译键映射（AccountSettingsPage.tsx）
const accountSettingsKeyMap = {
  '错误密码': 'wrongPassword',
  '账号不存在': 'accountNotExists',
  '余额不足': 'insufficientBalance',
  'IP地址限制': 'ipAddressRestricted',
  '内容含有敏感词': 'contentContainsSensitiveWords',
  '手机号码不正确': 'incorrectPhoneNumber',
  '获取设置失败，请重试': 'getSettingsFailed',
  '获取设置时发生错误，请重试': 'getSettingsError',
  '请输入手机号码': 'enterPhoneNumber',
  '请输入正确的手机号码格式': 'enterCorrectPhoneFormat',
  '请输入验证码': 'enterVerificationCode',
  '请先发送验证码': 'sendCode',
  '验证成功！手机号码已绑定': 'verificationSuccess',
  '验证码错误，请重新输入': 'codeErrorReenter',
  '请先验证手机号码': 'verifyPhoneFirst',
  '个人资料已更新': 'profileUpdated',
  '保存资料时发生错误，请重试': 'saveProfileError',
  '两次输入的新密码不一致': 'newPasswordsNotMatch',
  '新密码长度不能少于6位': 'newPasswordTooShort',
  '更新密码失败': 'updatePasswordFailed',
  '密码已成功更新': 'passwordUpdated',
  '更新密码时发生错误，请重试': 'updatePasswordFailed',
  '隐私设置已更新': 'privacySettingsUpdated',
  '保存隐私设置时发生错误，请重试': 'savePrivacySettingsError',
  '退出登录失败，请重试': 'logoutFailed',
  '正在获取您的账号设置': 'gettingAccountSettings',
  '请先登录后再访问账号设置': 'loginRequiredForSettings',
  '账号设置': 'accountSettings',
  '达人账号': 'influencerAccount',
  '企业账号': 'companyAccount',
  '普通账号': 'normalAccount',
  '个人资料': 'personalProfile',
  '安全设置': 'securitySettings',
  '通知设置': 'notificationSettings',
  '隐私设置': 'privacySettings',
  '退出登录': 'logout',
  '邮箱地址': 'emailAddress',
  '邮箱地址不可修改': 'emailNotModifiable',
  '手机号码': 'phoneNumber',
  '发送中...': 'sending',
  '发送验证码': 'sendCode',
  '请输入4位验证码': 'enterVerificationCode',
  '验证': 'verification',
  '手机号码已绑定，可以保存资料': 'phoneBoundCanSave',
  '账号类型': 'accountType',
  '保存更改': 'saveChanges',
  '请先验证手机号码后再保存': 'verifyPhoneFirstThenSave',
  '当前密码': 'currentPassword',
  '请输入当前密码': 'enterCurrentPassword',
  '新密码': 'newPassword',
  '请输入新密码': 'enterNewPassword',
  '密码长度至少6位': 'passwordMin6Chars',
  '确认新密码': 'confirmNewPassword',
  '请再次输入新密码': 'enterNewPasswordAgain',
  '更新中...': 'updating',
  '更新密码': 'updatePassword',
  '登录历史': 'loginHistory',
  '最近登录': 'recentLogin',
  '设备': 'device',
  'IP地址': 'ipAddress',
  '邮件通知': 'emailNotification',
  '系统通知': 'systemNotification',
  '接收系统更新、维护和安全相关的通知': 'receiveSystemUpdates',
  '任务通知': 'taskNotification',
  '接收新任务、申请状态变更等通知': 'receiveTaskUpdates',
  '营销信息': 'marketingInfo',
  '接收优惠、活动和新功能相关的通知': 'receivePromotions',
  '短信通知': 'smsNotification',
  '重要通知': 'importantNotification',
  '接收账号安全和重要更新的短信通知': 'receiveSecuritySMS',
  '任务提醒': 'taskReminder',
  '接收即将开始的直播任务提醒': 'receiveLiveReminders',
  '保存设置': 'saveSettings',
  '资料可见性': 'profileVisibility',
  '公开 - 所有人可见': 'publicAllVisible',
  '注册用户 - 仅注册用户可见': 'registeredUsersOnly',
  '私密 - 仅自己可见': 'privateOnlyMe',
  '控制谁可以查看您的个人资料': 'controlProfileVisibility',
  '联系方式可见性': 'contactVisibility',
  '联系人 - 仅联系人可见': 'contactsOnly',
  '私密 - 不公开': 'privateNotPublic',
  '控制谁可以查看您的联系方式': 'controlContactVisibility',
  '允许私信': 'allowPrivateMessage',
  '允许其他用户向您发送私信': 'allowOthersToMessage',
  '账号信息': 'accountInfo',
  '账号ID': 'accountId',
  '注册时间': 'registrationTime'
};

// 需要处理的文件列表
const filesToProcess = [
  'src/components/pages/AccountSettingsPage.tsx'
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
  for (const [oldKey, newKey] of Object.entries(accountSettingsKeyMap)) {
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
  console.log('开始修复AccountSettingsPage的翻译键...\n');
  
  for (const file of filesToProcess) {
    console.log(`处理文件: ${file}`);
    processFile(file);
    console.log('');
  }
  
  console.log('翻译键修复完成！');
}

main(); 