import { readFileSync } from 'fs';

try {
  const content = readFileSync('src/locales/zh.json', 'utf8');
  JSON.parse(content);
  console.log('✅ JSON语法正确！');
} catch (error) {
  console.log('❌ JSON语法错误:', error.message);
  console.log('错误位置:', error.message);
} 