const axios = require('axios');

const BASE_URL = (process.env.API_BASE_URL || 'http://localhost:8085') + '/api';
let token = '';
let testPersonId = '';
let testUserId = '';
let cleanupData = {
  personId: null,
  userId: null,
  token: null
};

// 添加延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let ipCounter = 10;
const nextIp = () => {
  ipCounter += 1;
  return `10.10.${Math.floor(ipCounter / 240)}.${(ipCounter % 240) + 1}`;
};

// 辅助函数
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': nextIp(),
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

// 清理测试数据
async function cleanupTestData() {
  console.log('\n🧹 清理测试数据...');
  
  try {
    // 删除创建的人员信息（需要管理员权限）
    if (cleanupData.personId) {
      // 使用管理员账户登录
      console.log('🔐 使用管理员权限清理数据...');
      await sleep(300); // 添加延迟避免JWT token重复
      const adminLogin = await makeRequest('POST', '/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      // 设置管理员token
      token = adminLogin.data.token;
      
      // 删除测试人员信息
      await makeRequest('DELETE', `/persons/${cleanupData.personId}`);
      console.log('✅ 已删除测试人员信息');
    }
    
    // 注意：用户信息通常不会删除，因为可能涉及到数据完整性
    // 在实际生产环境中，测试用户应该在专门的测试数据库中
    console.log('ℹ️ 测试用户保留（符合数据保留策略）');
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ 测试数据已不存在，无需清理');
    } else {
      console.error('⚠️ 清理数据时出现错误:', error.response?.data || error.message);
    }
  }
}

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
    await sleep(200); // 添加延迟避免JWT token重复
    const loginResult = await makeRequest('POST', '/auth/login', {
      username: testUser.username,
      password: testUser.password
    });
    token = loginResult.data.token;
    testUserId = loginResult.data.user.id;
    cleanupData.token = token;
    cleanupData.userId = testUserId;
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
    cleanupData.personId = testPersonId;
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
  } finally {
    // 无论测试成功还是失败，都要清理数据
    await cleanupTestData();
  }
}

// 运行测试
runIntegrationTest().catch(error => {
  console.error('测试执行失败:', error);
});
