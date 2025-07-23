import https from 'https';
import querystring from 'querystring';

// 短信宝API配置
const SMS_USERNAME = 'luchuguo';
const SMS_PASSWORD_MD5 = '95895002b700461898a9821c0704e929';
const SMS_API_URL = 'https://api.smsbao.com/sms';

// 测试手机号
const testPhone = '18638014853';

// 测试函数
async function testSmsApi() {
  console.log('开始测试短信宝API...');
  console.log('测试手机号:', testPhone);
  
  // 构建请求参数
  const params = {
    u: SMS_USERNAME,
    p: SMS_PASSWORD_MD5,
    m: testPhone,
    c: '【短信宝】API测试消息'
  };
  
  const queryString = querystring.stringify(params);
  const fullUrl = `${SMS_API_URL}?${queryString}`;
  
  console.log('完整API URL:', fullUrl);
  
  return new Promise((resolve, reject) => {
    https.get(fullUrl, (res) => {
      console.log('响应状态码:', res.statusCode);
      console.log('响应头:', res.headers);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('响应内容:', data);
        
        // 解析响应
        if (data === '0') {
          console.log('✅ API调用成功！');
        } else {
          console.log('❌ API调用失败，错误代码:', data);
          
          // 错误代码说明
          const errorMessages = {
            '30': '错误密码',
            '40': '账号不存在',
            '41': '余额不足',
            '43': 'IP地址限制',
            '50': '内容含有敏感词',
            '51': '手机号码不正确'
          };
          
          const errorMessage = errorMessages[data] || '未知错误';
          console.log('错误说明:', errorMessage);
        }
        
        resolve(data);
      });
    }).on('error', (err) => {
      console.error('❌ 网络请求失败:', err.message);
      reject(err);
    });
  });
}

// 运行测试
testSmsApi()
  .then((result) => {
    console.log('\n测试完成，结果:', result);
  })
  .catch((error) => {
    console.error('\n测试失败:', error);
  }); 