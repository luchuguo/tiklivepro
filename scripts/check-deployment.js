#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 检查部署配置...\n');

// 检查vercel.json
const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  console.log('✅ vercel.json 存在');
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    console.log('✅ vercel.json 格式正确');
    if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
      console.log('✅ 包含重写规则');
    } else {
      console.log('❌ 缺少重写规则');
    }
  } catch (error) {
    console.log('❌ vercel.json 格式错误:', error.message);
  }
} else {
  console.log('❌ vercel.json 不存在');
}

// 检查_redirects
const redirectsPath = path.join(process.cwd(), 'public', '_redirects');
if (fs.existsSync(redirectsPath)) {
  console.log('✅ _redirects 存在');
  const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
  if (redirectsContent.includes('/index.html')) {
    console.log('✅ 包含正确的重定向规则');
  } else {
    console.log('❌ 重定向规则不正确');
  }
} else {
  console.log('❌ _redirects 不存在');
}

// 检查dist目录
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ dist 目录存在');
  const indexHtmlPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log('✅ index.html 存在');
  } else {
    console.log('❌ index.html 不存在');
  }
} else {
  console.log('❌ dist 目录不存在，请先运行 npm run build');
}

console.log('\n📋 部署检查完成！');
console.log('\n如果所有检查都通过，请重新部署到Vercel：');
console.log('1. git add .');
console.log('2. git commit -m "Fix routing configuration"');
console.log('3. git push');
console.log('\n或者使用Vercel CLI：');
console.log('vercel --prod --force'); 