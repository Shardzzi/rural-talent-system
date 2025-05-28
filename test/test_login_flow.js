// 测试登录API和认证状态更新
const fetch = require('node-fetch');

console.log('🔍 测试登录API和认证状态...');

async function testLogin() {
  try {
    // 测试登录API
    console.log('🚀 尝试管理员登录...');
    
    const loginResponse = await fetch('http://localhost:8083/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    console.log('✅ 登录响应:', {
      success: loginData.success,
      token: loginData.data?.token ? '已获取' : '未获取',
      user: loginData.data?.user
    });
    
    if (!loginData.success) {
      throw new Error(loginData.message || '登录失败');
    }
    
    // 验证token是否有效
    const token = loginData.data.token;
    
    const meResponse = await fetch('http://localhost:8083/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const meData = await meResponse.json();
    
    console.log('✅ 用户信息验证成功:', {
      success: meData.success,
      user: meData.data
    });
    
    return {
      token,
      user: loginData.data.user
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

async function testPersonsAPI(token) {
  try {
    console.log('🚀 测试人员信息API...');
    
    const response = await fetch('http://localhost:8083/api/persons', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    console.log('✅ 人员信息API测试成功:', {
      count: data.data?.length || 0,
      firstPerson: data.data?.[0]?.name || '无数据'
    });
    
  } catch (error) {
    console.error('❌ 人员信息API测试失败:', error.message);
  }
}

// 运行测试
testLogin()
  .then(authData => {
    return testPersonsAPI(authData.token);
  })
  .catch(error => {
    console.error('❌ 整体测试失败:', error.message);
  });
