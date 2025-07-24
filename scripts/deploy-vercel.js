#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始Vercel部署流程...\n');

// 检查必要文件
const requiredFiles = [
  'vercel.json',
  'package.json',
  'vite.config.ts',
  'index.html'
];

console.log('📋 检查必要文件...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} 存在`);
  } else {
    console.log(`❌ ${file} 不存在`);
    process.exit(1);
  }
});

// 检查vercel.json配置
console.log('\n📋 检查vercel.json配置...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
    console.log('✅ vercel.json 配置正确');
  } else {
    console.log('❌ vercel.json 缺少rewrites配置');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ vercel.json 格式错误:', error.message);
  process.exit(1);
}

// 构建项目
console.log('\n🔨 构建项目...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 构建成功');
} catch (error) {
  console.log('❌ 构建失败');
  process.exit(1);
}

// 检查构建输出
console.log('\n📋 检查构建输出...');
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  if (files.includes('index.html')) {
    console.log('✅ dist/index.html 存在');
  } else {
    console.log('❌ dist/index.html 不存在');
    process.exit(1);
  }
} else {
  console.log('❌ dist 目录不存在');
  process.exit(1);
}

// 部署到Vercel
console.log('\n🚀 部署到Vercel...');
try {
  execSync('vercel --prod --force', { stdio: 'inherit' });
  console.log('✅ 部署成功');
} catch (error) {
  console.log('❌ 部署失败，请检查Vercel CLI配置');
  console.log('💡 提示：请确保已安装并登录Vercel CLI');
  console.log('   安装：npm i -g vercel');
  console.log('   登录：vercel login');
  process.exit(1);
}

console.log('\n🎉 部署完成！');
console.log('📝 请测试以下URL：');
console.log('   - 首页：https://your-domain.com/');
console.log('   - 帮助页：https://your-domain.com/help');
console.log('   - 关于页：https://your-domain.com/about');
console.log('   - 达人详情：https://your-domain.com/influencer/123');
console.log('   - 任务详情：https://your-domain.com/task/456');
console.log('   - 公司详情：https://your-domain.com/company/789'); 