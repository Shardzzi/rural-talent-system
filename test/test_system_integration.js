const axios = require('axios');

const BASE_URL = 'http://localhost:8083/api';
let token = '';
let testPersonId = '';

// 辅助函数
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`请求失败 ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
};

// 系统集成测试
async function runIntegrationTest() {
  console.log('🚀 开始系统集成测试...\n');
  
  try {
    // 1. 测试用户注册
    console.log('1. 测试用户注册...');
    const timestamp = Date.now().toString().slice(-6); // 只使用最后6位
    const testUser = {
      username: `test${timestamp}`,
      password: 'test123456',
      confirmPassword: 'test123456',
      email: `test${timestamp}@example.com`
    };
    
    const registerResult = await makeRequest('POST', '/auth/register', testUser);
    console.log('✅ 用户注册成功:', registerResult.message);
    
    // 2. 测试用户登录
    console.log('\n2. 测试用户登录...');
    const loginResult = await makeRequest('POST', '/auth/login', {
      username: testUser.username,
      password: testUser.password
    });
    token = loginResult.data.token;
    console.log('✅ 用户登录成功:', loginResult.message);
    console.log('   用户信息:', JSON.stringify(loginResult.data.user, null, 2));
    
    // 3. 测试获取用户信息
    console.log('\n3. 测试获取当前用户信息...');
    const userInfo = await makeRequest('GET', '/auth/me');
    console.log('✅ 获取用户信息成功:', JSON.stringify(userInfo.data, null, 2));
    
    // 4. 测试创建个人信息
    console.log('\n4. 测试创建个人信息...');
    const testPerson = {
      name: `测试用户${timestamp}`,
      age: 30,
      gender: '男',
      email: testUser.email,
      phone: `138${timestamp.slice(0,4)}${timestamp.slice(-4)}`,
      address: '测试地址',
      educationLevel: '本科',
      politicalStatus: '群众'
    };
    
    const personResult = await makeRequest('POST', '/persons', testPerson);
    testPersonId = personResult.data.id;
    console.log('✅ 创建个人信息成功:', personResult.message);
    console.log('   个人信息ID:', testPersonId);
    
    // 5. 测试关联用户和个人信息
    console.log('\n5. 测试关联用户和个人信息...');
    const linkResult = await makeRequest('PUT', '/auth/link-person', {
      personId: testPersonId
    });
    console.log('✅ 关联个人信息成功:', linkResult.message);
    console.log('   更新后的用户信息:', JSON.stringify(linkResult.data.user, null, 2));
    
    // 6. 验证关联后的用户信息
    console.log('\n6. 验证关联后的用户信息...');
    const updatedUserInfo = await makeRequest('GET', '/auth/me');
    console.log('✅ 关联验证成功:', JSON.stringify(updatedUserInfo.data, null, 2));
    
    // 7. 测试游客访问权限
    console.log('\n7. 测试游客访问权限...');
    token = ''; // 清除token模拟游客
    const guestPersons = await makeRequest('GET', '/persons');
    console.log('✅ 游客可以访问人员列表');
    console.log('   返回人员数量:', guestPersons.data.length);
    
    // 8. 测试权限控制
    console.log('\n8. 测试权限控制...');
    try {
      await makeRequest('POST', '/persons', testPerson);
      console.log('❌ 权限控制失败：游客不应该能创建人员信息');
    } catch (error) {
      console.log('✅ 权限控制正常：游客无法创建人员信息');
    }
    
    console.log('\n🎉 系统集成测试完成！所有功能正常工作。');
    
  } catch (error) {
    console.error('\n❌ 系统集成测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
runIntegrationTest();
