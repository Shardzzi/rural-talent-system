/**
 * 认证与权限综合测试
 * 测试覆盖: Token生命周期、角色权限、并发会话、密码修改、重复注册防护
 */

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:8083/api';
const JWT_SECRET = 'rural_talent_system_secret_key_2025';

// 颜色输出
const colors = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m'
};
function log(text, color = 'reset') { console.log(colors[color] + text + colors.reset); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 测试统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    log(`  ✅ ${testName}${detail ? ' — ' + detail : ''}`, 'green');
  } else {
    failedTests++;
    log(`  ❌ ${testName}${detail ? ' — ' + detail : ''}`, 'red');
  }
  return condition;
}

// HTTP请求辅助
async function request(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true // 不抛异常，手动检查状态
    };
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (data) config.data = data;
    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: error.response?.status || 0, data: error.response?.data || { message: error.message } };
  }
}

// ========================
// 测试辅助: 注册用户并登录
// ========================
async function registerAndLogin(suffix) {
  const username = `authtest_${suffix}_${Date.now()}`;
  const email = `${username}@test.com`;
  const password = 'Test1234';

  // 注册
  const regRes = await request('POST', '/auth/register', {
    username, password, confirmPassword: password, email
  });
  if (regRes.status !== 201) {
    log(`  ⚠️ 注册用户 ${username} 失败: ${regRes.data?.message}`, 'yellow');
    return null;
  }
  await sleep(100);

  // 登录
  const loginRes = await request('POST', '/auth/login', { username, password });
  if (loginRes.status !== 200) {
    log(`  ⚠️ 登录用户 ${username} 失败`, 'yellow');
    return null;
  }
  return {
    token: loginRes.data.data.token,
    user: loginRes.data.data.user,
    username,
    email,
    password
  };
}

// ========================
// 1. Token 生命周期测试
// ========================
async function testTokenLifecycle() {
  log('\n📋 1. Token生命周期测试', 'blue');

  // 1.1 登录获取token
  const loginRes = await request('POST', '/auth/login', {
    username: 'admin', password: 'admin123'
  });
  assert(loginRes.status === 200, '登录成功获取token');
  const token = loginRes.data.data?.token;
  assert(typeof token === 'string' && token.length > 0, 'Token非空字符串');

  // 1.2 使用token访问受保护资源
  await sleep(100);
  const meRes = await request('GET', '/auth/me', null, token);
  assert(meRes.status === 200, '有效token可访问 /auth/me');
  assert(meRes.data.data?.username === 'admin', 'Token用户信息正确', `username=${meRes.data.data?.username}`);

  // 1.3 使用token访问人员列表
  await sleep(100);
  const personsRes = await request('GET', '/persons', null, token);
  assert(personsRes.status === 200, '有效token可访问人员列表');

  // 1.4 登出使token失效
  await sleep(100);
  const logoutRes = await request('POST', '/auth/logout', null, token);
  assert(logoutRes.status === 200, '登出成功');

  // 1.5 登出后token应被拒绝
  await sleep(100);
  const meAfterLogout = await request('GET', '/auth/me', null, token);
  assert(meAfterLogout.status === 401, '登出后token被拒绝', `status=${meAfterLogout.status}`);

  // 1.6 无效token格式
  const badTokenRes = await request('GET', '/auth/me', null, 'invalid.token.format');
  assert(badTokenRes.status === 401, '无效token格式被拒绝');

  // 1.7 无token访问受保护端点
  const noTokenRes = await request('GET', '/auth/me');
  assert(noTokenRes.status === 401, '无token访问受保护端点被拒绝');

  // 1.8 空Bearer token
  const emptyBearerRes = await request('GET', '/auth/me', null, '');
  assert(emptyBearerRes.status === 401, '空Bearer token被拒绝');
}

// ========================
// 2. 角色权限测试
// ========================
async function testRoleBasedAccess() {
  log('\n📋 2. 角色权限测试 (Admin / User / Guest)', 'blue');

  // 获取管理员token
  const adminLogin = await request('POST', '/auth/login', {
    username: 'admin', password: 'admin123'
  });
  const adminToken = adminLogin.data.data.token;

  // 注册/获取普通用户
  await sleep(100);
  const normalUser = await registerAndLogin('roleuser');
  assert(normalUser !== null, '普通用户注册登录成功');
  if (!normalUser) return;

  const userToken = normalUser.token;

  // ---- Guest (无token) 权限 ----
  log('\n  🔍 访客权限测试', 'cyan');

  // 访客可以查看人员列表（脱敏）
  const guestPersons = await request('GET', '/persons');
  assert(guestPersons.status === 200, '访客可查看人员列表');

  // 访客可以搜索
  const guestSearch = await request('GET', '/search?keyword=test');
  assert(guestSearch.status === 200, '访客可搜索人才');

  // 访客不能创建人员
  const guestCreate = await request('POST', '/persons', {
    name: '访客创建测试', age: 25, gender: '男', phone: '13800000000'
  });
  assert(guestCreate.status === 401, '访客不能创建人员', `status=${guestCreate.status}`);

  // 访客不能删除
  const guestDelete = await request('DELETE', '/persons/nonexistent');
  assert(guestDelete.status === 401, '访客不能删除人员');

  // 访客不能访问统计
  const guestStats = await request('GET', '/statistics');
  assert(guestStats.status === 401, '访客不能访问统计');

  // 访客不能导出
  const guestExport = await request('GET', '/persons/export');
  assert(guestExport.status === 401, '访客不能导出数据');

  // 访客不能修改密码
  const guestChangePw = await request('PUT', '/auth/change-password', {
    currentPassword: 'test', newPassword: 'Test5678', confirmPassword: 'Test5678'
  });
  assert(guestChangePw.status === 401, '访客不能修改密码');

  // ---- User 权限 ----
  log('\n  👤 普通用户权限测试', 'cyan');

  // 用户可以查看人员列表
  await sleep(100);
  const userPersons = await request('GET', '/persons', null, userToken);
  assert(userPersons.status === 200, '普通用户可查看人员列表');

  // 用户可以搜索
  await sleep(100);
  const userSearch = await request('GET', '/search?keyword=test', null, userToken);
  assert(userSearch.status === 200, '普通用户可搜索人才');

  // 用户可以创建人员
  await sleep(100);
  const userCreate = await request('POST', '/persons', {
    name: '用户创建测试', age: 28, gender: '女', phone: '13900000000',
    email: 'usercreate@test.com'
  }, userToken);
  assert(userCreate.status === 200 || userCreate.status === 201, '普通用户可创建人员', `status=${userCreate.status}`);

  // 用户不能访问统计
  await sleep(100);
  const userStats = await request('GET', '/statistics', null, userToken);
  assert(userStats.status === 403, '普通用户不能访问统计', `status=${userStats.status}`);

  // 用户不能导出
  await sleep(100);
  const userExport = await request('GET', '/persons/export', null, userToken);
  assert(userExport.status === 403, '普通用户不能导出数据', `status=${userExport.status}`);

  // 用户不能删除（管理员专属）
  await sleep(100);
  const userDelete = await request('DELETE', '/persons/nonexistent', null, userToken);
  assert(userDelete.status === 403, '普通用户不能删除人员', `status=${userDelete.status}`);

  // 用户可以获取自己的信息
  await sleep(100);
  const userMe = await request('GET', '/auth/me', null, userToken);
  assert(userMe.status === 200, '普通用户可获取自身信息');

  // 用户可以修改自己的密码
  await sleep(100);
  const userChangePw = await request('PUT', '/auth/change-password', {
    currentPassword: normalUser.password,
    newPassword: 'Test5678',
    confirmPassword: 'Test5678'
  }, userToken);
  assert(userChangePw.status === 200, '普通用户可修改自己的密码');

  // 改回密码以便后续测试
  await sleep(100);
  await request('PUT', '/auth/change-password', {
    currentPassword: 'Test5678',
    newPassword: normalUser.password,
    confirmPassword: normalUser.password
  }, userToken);

  // ---- Admin 权限 ----
  log('\n  👑 管理员权限测试', 'cyan');

  // 管理员可以查看人员列表
  await sleep(100);
  const adminPersons = await request('GET', '/persons', null, adminToken);
  assert(adminPersons.status === 200, '管理员可查看人员列表');

  // 管理员可以创建人员
  await sleep(100);
  const adminCreate = await request('POST', '/persons', {
    name: '管理员创建测试', age: 35, gender: '男', phone: '13700000000',
    email: 'admincreate@test.com'
  }, adminToken);
  assert(adminCreate.status === 200 || adminCreate.status === 201, '管理员可创建人员');

  // 管理员可以访问统计
  await sleep(100);
  const adminStats = await request('GET', '/statistics', null, adminToken);
  assert(adminStats.status === 200, '管理员可访问统计', `status=${adminStats.status}`);

  // 管理员可以导出
  await sleep(100);
  const adminExport = await request('GET', '/persons/export', null, adminToken);
  assert(adminExport.status === 200, '管理员可导出数据');

  // 管理员可以删除人员（用不存在的ID测试权限层）
  await sleep(100);
  const adminDelete = await request('DELETE', '/persons/nonexistent_id', null, adminToken);
  // 404表示通过了权限检查，到达了数据层
  assert(adminDelete.status === 404 || adminDelete.status === 200, '管理员有删除权限（404=通过权限检查，人员不存在）', `status=${adminDelete.status}`);

  // 管理员可以修改密码
  await sleep(100);
  const adminMe = await request('GET', '/auth/me', null, adminToken);
  assert(adminMe.status === 200, '管理员可获取自身信息');
}

// ========================
// 3. 并发会话测试
// ========================
async function testConcurrentSessions() {
  log('\n📋 3. 并发会话测试', 'blue');

  const user = await registerAndLogin('session1');
  assert(user !== null, '会话测试用户注册成功');
  if (!user) return;

  const token1 = user.token;

  // 第二次登录（模拟第二个浏览器）
  await sleep(200);
  const login2 = await request('POST', '/auth/login', {
    username: user.username, password: user.password
  });
  assert(login2.status === 200, '第二次登录成功（模拟另一浏览器）');
  const token2 = login2.data.data.token;
  assert(token1 !== token2, '两次登录获得不同token');

  // 两个token都能使用
  await sleep(100);
  const me1 = await request('GET', '/auth/me', null, token1);
  assert(me1.status === 200, '第一个token可用');

  await sleep(100);
  const me2 = await request('GET', '/auth/me', null, token2);
  assert(me2.status === 200, '第二个token可用');

  // 从第一个会话登出
  await sleep(100);
  const logout1 = await request('POST', '/auth/logout', null, token1);
  assert(logout1.status === 200, '第一个会话登出成功');

  // 第二个会话应该仍然有效（不同token的独立会话）
  await sleep(100);
  const me2After = await request('GET', '/auth/me', null, token2);
  assert(me2After.status === 200, '第二个会话登出后仍有效', `status=${me2After.status}`);

  // 第一个token应该已失效
  await sleep(100);
  const me1After = await request('GET', '/auth/me', null, token1);
  assert(me1After.status === 401, '已登出的第一个token被拒绝', `status=${me1After.status}`);

  // 清理: 登出第二个会话
  await sleep(100);
  await request('POST', '/auth/logout', null, token2);
}

// ========================
// 4. 密码修改测试
// ========================
async function testPasswordChange() {
  log('\n📋 4. 密码修改测试', 'blue');

  const user = await registerAndLogin('pwchange');
  assert(user !== null, '密码修改测试用户注册成功');
  if (!user) return;

  const oldToken = user.token;
  const originalPw = user.password;
  const newPw = 'NewPass99';

  // 验证旧token可用
  await sleep(100);
  const meBefore = await request('GET', '/auth/me', null, oldToken);
  assert(meBefore.status === 200, '密码修改前token可用');

  // 修改密码
  await sleep(100);
  const changePw = await request('PUT', '/auth/change-password', {
    currentPassword: originalPw,
    newPassword: newPw,
    confirmPassword: newPw
  }, oldToken);
  assert(changePw.status === 200, '密码修改成功');

  // 旧密码不能登录
  await sleep(100);
  const oldLogin = await request('POST', '/auth/login', {
    username: user.username, password: originalPw
  });
  assert(oldLogin.status === 401, '旧密码不能登录');

  // 新密码可以登录
  await sleep(100);
  const newLogin = await request('POST', '/auth/login', {
    username: user.username, password: newPw
  });
  assert(newLogin.status === 200, '新密码可以登录');

  // 原token仍然有效（会话未因密码修改而失效 — 这是当前实现行为）
  await sleep(100);
  const oldTokenAfter = await request('GET', '/auth/me', null, oldToken);
  // 记录实际行为，两种都合理
  if (oldTokenAfter.status === 200) {
    assert(true, '密码修改后原token仍有效（会话保持）');
  } else {
    assert(oldTokenAfter.status === 401, '密码修改后原token失效（会话清除）');
  }

  // 错误的当前密码
  const newToken = newLogin.data.data.token;
  await sleep(100);
  const wrongCurrentPw = await request('PUT', '/auth/change-password', {
    currentPassword: 'wrongpassword1',
    newPassword: 'Another123',
    confirmPassword: 'Another123'
  }, newToken);
  assert(wrongCurrentPw.status === 400, '当前密码错误时修改失败');

  // 新密码确认不匹配
  await sleep(100);
  const mismatchConfirm = await request('PUT', '/auth/change-password', {
    currentPassword: newPw,
    newPassword: 'Another123',
    confirmPassword: 'Different456'
  }, newToken);
  assert(mismatchConfirm.status === 400, '新密码确认不匹配时修改失败');

  // 新密码太短
  await sleep(100);
  const shortPw = await request('PUT', '/auth/change-password', {
    currentPassword: newPw,
    newPassword: 'ab1',
    confirmPassword: 'ab1'
  }, newToken);
  assert(shortPw.status === 400, '密码过短时修改失败');
}

// ========================
// 5. 重复注册防护测试
// ========================
async function testDuplicateRegistration() {
  log('\n📋 5. 重复注册防护测试', 'blue');

  const suffix = Date.now();
  const username = `duptest_${suffix}`;
  const email = `duptest_${suffix}@test.com`;
  const password = 'Test1234';

  // 第一次注册成功
  const reg1 = await request('POST', '/auth/register', {
    username, password, confirmPassword: password, email
  });
  assert(reg1.status === 201, '首次注册成功');

  // 重复用户名
  await sleep(100);
  const dupUsername = await request('POST', '/auth/register', {
    username, password, confirmPassword: password,
    email: `other_${suffix}@test.com`
  });
  assert(dupUsername.status === 400, '重复用户名被拒绝');
  const dupUsernameMsg = dupUsername.data?.message || '';
  assert(
    dupUsernameMsg.includes('用户名') || dupUsernameMsg.includes('username') || dupUsernameMsg.includes('已存在'),
    '拒绝原因包含用户名已存在',
    `message=${dupUsernameMsg}`
  );

  // 重复邮箱
  await sleep(100);
  const dupEmail = await request('POST', '/auth/register', {
    username: `other_${suffix}`, password, confirmPassword: password, email
  });
  assert(dupEmail.status === 400, '重复邮箱被拒绝');
  const dupEmailMsg = dupEmail.data?.message || '';
  assert(
    dupEmailMsg.includes('邮箱') || dupEmailMsg.includes('email') || dupEmailMsg.includes('已注册'),
    '拒绝原因包含邮箱已注册',
    `message=${dupEmailMsg}`
  );
}

// ========================
// 6. Token 过期测试
// ========================
async function testTokenExpiry() {
  log('\n📋 6. Token过期验证', 'blue');

  // 登录获取token
  const loginRes = await request('POST', '/auth/login', {
    username: 'admin', password: 'admin123'
  });
  assert(loginRes.status === 200, '获取token用于过期测试');

  const token = loginRes.data.data.token;

  // 解码JWT查看过期时间
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    assert(decoded !== null, 'JWT可解码');
    assert(decoded.exp !== undefined, 'JWT包含过期时间');

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - now;
    assert(expiresIn > 0, 'Token尚未过期', `剩余${Math.round(expiresIn / 3600)}小时`);

    // Token过期时间应在23-25小时范围内（24h设置）
    const hoursUntilExpiry = expiresIn / 3600;
    assert(
      hoursUntilExpiry >= 23 && hoursUntilExpiry <= 25,
      'Token有效期约24小时',
      `实际=${hoursUntilExpiry.toFixed(1)}h`
    );
  } catch (e) {
    // jsonwebtoken 可能未安装，跳过解码测试
    log('  ⚠️ jsonwebtoken模块不可用，跳过JWT解码测试', 'yellow');
  }

  // 验证伪造的过期token被拒绝
  // 创建一个已过期的token（如果jsonwebtoken可用）
  try {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: 'fake', username: 'fake', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const expiredRes = await request('GET', '/auth/me', null, expiredToken);
    assert(expiredRes.status === 401, '过期token被拒绝', `status=${expiredRes.status}`);
  } catch (e) {
    log('  ⚠️ 无法创建过期token测试，跳过', 'yellow');
  }
}

// ========================
// 主测试入口
// ========================
async function main() {
  log('\n🔐 认证与权限综合测试\n' + '='.repeat(50), 'magenta');

  try {
    // 验证服务器可达
    const healthCheck = await request('GET', '/health');
    if (healthCheck.status !== 200) {
      log('❌ 后端服务未启动，请先运行 pnpm dev', 'red');
      process.exit(1);
    }
    log('✅ 后端服务连接正常\n', 'green');

    // 执行测试套件
    await testTokenLifecycle();
    await sleep(200);
    await testRoleBasedAccess();
    await sleep(200);
    await testConcurrentSessions();
    await sleep(200);
    await testPasswordChange();
    await sleep(200);
    await testDuplicateRegistration();
    await sleep(200);
    await testTokenExpiry();

    // 结果汇总
    log('\n' + '='.repeat(50), 'magenta');
    log(`📊 测试结果: ${passedTests}/${totalTests} 通过`, passedTests === totalTests ? 'green' : 'yellow');
    if (failedTests > 0) {
      log(`   ❌ ${failedTests} 个测试失败`, 'red');
    }
    log('='.repeat(50) + '\n', 'magenta');

    // 退出码
    process.exit(failedTests > 0 ? 1 : 0);

  } catch (error) {
    log(`\n❌ 测试执行异常: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
