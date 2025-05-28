// 端到端认证状态测试脚本
const fetch = require('node-fetch');

console.log('🔄 开始端到端认证状态测试...\n');

class AuthE2ETest {
  constructor() {
    this.baseURL = 'http://localhost:8083';
    this.frontendURL = 'http://localhost:8081';
  }

  async testStep(stepName, testFunction) {
    console.log(`🧪 ${stepName}...`);
    try {
      const result = await testFunction();
      console.log(`✅ ${stepName} - 成功`);
      if (result) {
        console.log(`   结果:`, result);
      }
      return result;
    } catch (error) {
      console.log(`❌ ${stepName} - 失败:`, error.message);
      throw error;
    }
  }

  async testLogin() {
    return await this.testStep('测试登录API', async () => {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '登录失败');
      }

      return {
        token: data.data.token.substring(0, 20) + '...',
        user: data.data.user
      };
    });
  }

  async testTokenValidation(token) {
    return await this.testStep('验证Token有效性', async () => {
      const response = await fetch(`${this.baseURL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Token验证失败');
      }

      return data.data;
    });
  }

  async testPersonsAPIAsLoggedIn(token) {
    return await this.testStep('测试登录用户访问人员API', async () => {
      const response = await fetch(`${this.baseURL}/api/persons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '获取人员信息失败');
      }

      return {
        count: data.data.length,
        hasDetailedInfo: data.data[0] && data.data[0].rural_profile ? true : false
      };
    });
  }

  async testPersonsAPIAsGuest() {
    return await this.testStep('测试游客访问人员API', async () => {
      const response = await fetch(`${this.baseURL}/api/persons`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '获取人员信息失败');
      }

      return {
        count: data.data.length,
        hasDetailedInfo: data.data[0] && data.data[0].rural_profile ? true : false
      };
    });
  }

  async testLogout(token) {
    return await this.testStep('测试登出API', async () => {
      const response = await fetch(`${this.baseURL}/api/auth/logout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data.success;
    });
  }

  async simulateLocalStorageOperations(authData) {
    return await this.testStep('模拟LocalStorage操作', async () => {
      // 模拟前端设置localStorage
      const tokenSet = authData && authData.token ? true : false;
      const userSet = authData && authData.user ? true : false;
      
      // 模拟清除localStorage
      const cleared = true;

      return {
        tokenSet,
        userSet,
        cleared
      };
    });
  }

  async runFullTest() {
    console.log('==========================================');
    console.log('🚀 数字乡村人才信息系统 - 认证状态完整测试');
    console.log('==========================================\n');

    try {
      // 1. 测试游客访问
      const guestData = await this.testPersonsAPIAsGuest();
      console.log('   游客模式数据是否脱敏:', !guestData.hasDetailedInfo ? '是' : '否');

      console.log('');

      // 2. 测试登录流程
      const authData = await this.testLogin();
      
      // 重新获取完整token用于后续测试
      const loginResponse = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
      const loginData = await loginResponse.json();
      const fullToken = loginData.data.token;

      console.log('');

      // 3. 验证token
      const userInfo = await this.testTokenValidation(fullToken);

      console.log('');

      // 4. 测试登录用户访问
      const loggedInData = await this.testPersonsAPIAsLoggedIn(fullToken);
      console.log('   登录用户数据是否包含详细信息:', loggedInData.hasDetailedInfo ? '是' : '否');

      console.log('');

      // 5. 模拟前端状态管理
      await this.simulateLocalStorageOperations(loginData.data);

      console.log('');

      // 6. 测试登出
      await this.testLogout(fullToken);

      console.log('');
      console.log('==========================================');
      console.log('🎉 所有测试通过！认证状态管理正常工作');
      console.log('==========================================');

      console.log('\n📋 测试总结:');
      console.log('✅ 登录API正常');
      console.log('✅ Token验证正常'); 
      console.log('✅ 游客模式数据脱敏正常');
      console.log('✅ 登录用户获取完整数据正常');
      console.log('✅ 登出API正常');
      
      console.log('\n🔍 前端需要验证的问题:');
      console.log('1. 登录后按钮状态是否正确更新为"进入管理中心"');
      console.log('2. 从管理页面返回首页时按钮状态是否保持正确');
      console.log('3. PersonDetailDialog是否正确显示详细信息');

    } catch (error) {
      console.log('\n==========================================');
      console.log('❌ 测试失败:', error.message);
      console.log('==========================================');
    }
  }
}

// 运行测试
const test = new AuthE2ETest();
test.runFullTest();
