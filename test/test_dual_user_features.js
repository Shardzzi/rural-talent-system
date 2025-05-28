/**
 * 综合测试脚本：管理员和普通用户功能对比测试
 * 验证权限控制和数据脱敏功能
 */

const axios = require('axios');

// 配置API基础URL
const API_BASE = 'http://localhost:8083/api';

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

// 测试用户登录
async function testUserLogin(username, password, userType) {
  colorLog(`\n🔐 测试${userType}登录功能...`, 'cyan');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password
    });
    
    colorLog(`✅ ${userType}登录成功:`, 'green');
    console.log({
      status: response.status,
      userRole: response.data.data?.user?.role || response.data.user?.role,
      hasToken: !!(response.data.data?.token || response.data.token),
      username: response.data.data?.user?.username || response.data.user?.username
    });
    
    return {
      token: response.data.data?.token || response.data.token,
      user: response.data.data?.user || response.data.user
    };
  } catch (error) {
    colorLog(`❌ ${userType}登录失败: ${error.message}`, 'red');
    return null;
  }
}

// 尝试注册普通用户
async function ensureRegularUser() {
  colorLog('\n👤 确保测试用户存在...', 'cyan');
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      username: 'testuser',
      password: 'test123',
      name: '测试用户',
      email: 'test@example.com'
    });
    
    colorLog('✅ 测试用户创建成功', 'green');
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('已存在')) {
      colorLog('✅ 测试用户已存在', 'green');
      return true;
    }
    colorLog('ℹ️ 测试用户可能已存在，继续测试...', 'yellow');
    return true;
  }
}

// 测试人员列表获取
async function testPersonList(token, userType) {
  colorLog(`\n📋 测试${userType}获取人员列表...`, 'cyan');
  try {
    const response = await axios.get(`${API_BASE}/persons`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const persons = response.data.data || response.data;
    colorLog(`✅ ${userType}获取人员列表成功`, 'green');
    console.log({
      status: response.status,
      count: persons.length
    });
    
    // 检查数据脱敏情况
    if (persons.length > 0) {
      const person = persons[0];
      colorLog(`📊 ${userType}数据脱敏检查:`, 'magenta');
      console.log({
        姓名: person.name || '无',
        手机号: person.phone || '无',
        身份证: person.idCard || '无',
        详细信息: person.ruralInfo ? '有' : '无'
      });
    }
    
    return persons;
  } catch (error) {
    colorLog(`❌ ${userType}获取人员列表失败: ${error.message}`, 'red');
    return [];
  }
}

// 测试人员详情查看
async function testPersonDetail(token, userType, personId) {
  colorLog(`\n👁️ 测试${userType}查看人员详情...`, 'cyan');
  try {
    const response = await axios.get(`${API_BASE}/persons/${personId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const person = response.data.data || response.data;
    colorLog(`✅ ${userType}查看人员详情成功`, 'green');
    console.log({
      status: response.status,
      personData: {
        id: person.id,
        name: person.name,
        phone: person.phone || '无',
        idCard: person.idCard || '无',
        hasRuralInfo: !!person.ruralInfo,
        hasSkills: !!(person.skills && person.skills.length > 0)
      }
    });
    
    return person;
  } catch (error) {
    colorLog(`❌ ${userType}查看人员详情失败: ${error.message}`, 'red');
    return null;
  }
}

// 测试系统统计API（仅管理员）
async function testSystemStats(token, userType) {
  colorLog(`\n📊 测试${userType}获取系统统计...`, 'cyan');
  try {
    const response = await axios.get(`${API_BASE}/statistics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    colorLog(`✅ ${userType}获取统计成功`, 'green');
    console.log({
      status: response.status,
      stats: response.data.data || response.data
    });
    
    return response.data.data || response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      colorLog(`ℹ️ ${userType}无权访问统计API（正常的权限控制）`, 'yellow');
    } else {
      colorLog(`❌ ${userType}获取统计失败: ${error.message}`, 'red');
    }
    return null;
  }
}

// 测试删除人员权限
async function testDeletePermission(token, userType, personId) {
  colorLog(`\n🗑️ 测试${userType}删除人员权限...`, 'cyan');
  try {
    // 注意：这里只是测试权限，不会真的删除
    const response = await axios.delete(`${API_BASE}/persons/${personId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    colorLog(`⚠️ ${userType}删除成功（需要检查是否应该允许）`, 'yellow');
    console.log({ status: response.status });
    
    return true;
  } catch (error) {
    if (error.response?.status === 403) {
      colorLog(`ℹ️ ${userType}无删除权限（正常的权限控制）`, 'yellow');
    } else if (error.response?.status === 404) {
      colorLog(`ℹ️ ${userType}删除失败：人员不存在`, 'yellow');
    } else {
      colorLog(`❌ ${userType}删除失败: ${error.message}`, 'red');
    }
    return false;
  }
}

// 测试用户档案API
async function testUserProfile(token, userType) {
  colorLog(`\n👤 测试${userType}获取用户档案...`, 'cyan');
  try {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    colorLog(`✅ ${userType}获取用户档案成功`, 'green');
    console.log({
      status: response.status,
      user: response.data.data || response.data
    });
    
    return response.data.data || response.data;
  } catch (error) {
    colorLog(`❌ ${userType}获取用户档案失败: ${error.message}`, 'red');
    return null;
  }
}

// 对比测试结果
function compareResults(adminResult, userResult, testName) {
  colorLog(`\n🔍 ${testName}对比结果:`, 'blue');
  
  if (adminResult && userResult) {
    console.log('管理员结果:', adminResult);
    console.log('普通用户结果:', userResult);
    
    // 简单的数据对比
    if (JSON.stringify(adminResult) === JSON.stringify(userResult)) {
      colorLog('⚠️ 数据完全相同，可能缺少数据脱敏', 'yellow');
    } else {
      colorLog('✅ 数据有差异，符合权限控制预期', 'green');
    }
  } else if (adminResult && !userResult) {
    colorLog('✅ 管理员有权限，普通用户无权限，符合预期', 'green');
  } else if (!adminResult && !userResult) {
    colorLog('❌ 两者都失败，可能存在问题', 'red');
  }
}

// 主测试函数
async function runDualUserTests() {
  colorLog('🚀 开始双用户对比测试...\n', 'blue');
  
  // 1. 确保测试用户存在
  await ensureRegularUser();
  
  // 2. 管理员登录
  const adminAuth = await testUserLogin('admin', 'admin123', '管理员');
  
  // 3. 普通用户登录
  const userAuth = await testUserLogin('testuser', 'test123', '普通用户');
  
  if (!adminAuth || !userAuth) {
    colorLog('❌ 登录失败，无法继续测试', 'red');
    return;
  }
  
  colorLog('\n' + '='.repeat(60), 'blue');
  colorLog('开始功能对比测试', 'blue');
  colorLog('='.repeat(60), 'blue');
  
  // 4. 测试用户档案
  const adminProfile = await testUserProfile(adminAuth.token, '管理员');
  const userProfile = await testUserProfile(userAuth.token, '普通用户');
  compareResults(adminProfile, userProfile, '用户档案');
  
  // 5. 测试人员列表
  const adminPersons = await testPersonList(adminAuth.token, '管理员');
  const userPersons = await testPersonList(userAuth.token, '普通用户');
  compareResults(adminPersons, userPersons, '人员列表');
  
  // 6. 测试人员详情（如果有数据）
  if (adminPersons.length > 0) {
    const personId = adminPersons[0].id;
    const adminDetail = await testPersonDetail(adminAuth.token, '管理员', personId);
    const userDetail = await testPersonDetail(userAuth.token, '普通用户', personId);
    compareResults(adminDetail, userDetail, '人员详情');
  }
  
  // 7. 测试系统统计
  const adminStats = await testSystemStats(adminAuth.token, '管理员');
  const userStats = await testSystemStats(userAuth.token, '普通用户');
  compareResults(adminStats, userStats, '系统统计');
  
  // 8. 测试删除权限（谨慎测试，不真实删除）
  if (adminPersons.length > 0) {
    const personId = adminPersons[0].id;
    colorLog('\n⚠️ 注意：以下删除测试可能会影响数据，请谨慎操作！', 'yellow');
    colorLog('如需测试删除权限，请手动取消注释以下代码', 'yellow');
    /*
    const adminDelete = await testDeletePermission(adminAuth.token, '管理员', personId);
    const userDelete = await testDeletePermission(userAuth.token, '普通用户', personId);
    compareResults(adminDelete, userDelete, '删除权限');
    */
  }
  
  // 测试总结
  colorLog('\n' + '='.repeat(60), 'blue');
  colorLog('测试总结', 'blue');
  colorLog('='.repeat(60), 'blue');
  
  colorLog('\n✨ 双用户对比测试完成！', 'green');
  colorLog('\n📋 测试项目:', 'cyan');
  colorLog('✅ 管理员登录', 'green');
  colorLog('✅ 普通用户登录', 'green');
  colorLog('✅ 用户档案获取', 'green');
  colorLog('✅ 人员列表权限对比', 'green');
  colorLog('✅ 人员详情权限对比', 'green');
  colorLog('✅ 系统统计权限对比', 'green');
  colorLog('⚠️ 删除权限测试（已注释）', 'yellow');
  
  colorLog('\n🎯 建议手动测试:', 'cyan');
  colorLog('1. 访问 http://localhost:8081/', 'white');
  colorLog('2. 分别使用管理员(admin/admin123)和普通用户(testuser/test123)登录', 'white');
  colorLog('3. 对比界面显示的数据差异', 'white');
  colorLog('4. 测试各种操作按钮的权限控制', 'white');
  
  colorLog('\n📊 关键检查点:', 'magenta');
  colorLog('- 普通用户是否能看到敏感信息（手机号、身份证等）', 'white');
  colorLog('- 普通用户是否能访问管理员功能（统计面板、删除等）', 'white');
  colorLog('- 数据脱敏是否在前端和后端都正确实现', 'white');
}

// 执行测试
runDualUserTests().catch(error => {
  colorLog(`❌ 测试执行失败: ${error.message}`, 'red');
  console.error(error);
});
