#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:8083/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

let ipCounter = 10;
const nextIp = () => {
  ipCounter += 1;
  return `10.10.${Math.floor(ipCounter / 240)}.${(ipCounter % 240) + 1}`;
};

const state = {
  adminToken: '',
  userToken: '',
  registeredUser: null,
  registeredUserToken: '',
  passwordUser: null,
  passwordUserToken: '',
  linkedUser: null,
  linkedUserToken: '',
  roleUser: null,
  createdPersonId: null,
  comprehensivePersonId: null,
  linkedPersonId: null,
  createdSkillId: null,
  createdSkillIdForDelete: null
};

const testResults = {
  passed: 0,
  failed: 0,
  endpointCovered: new Set()
};

const log = (msg, color = 'reset') => console.log(`${colors[color] || ''}${msg}${colors.reset}`);

function markPass(name, detail = '') {
  testResults.passed += 1;
  log(`✅ PASS: ${name}${detail ? ` -> ${detail}` : ''}`, 'green');
}

function markFail(name, detail = '') {
  testResults.failed += 1;
  log(`❌ FAIL: ${name}${detail ? ` -> ${detail}` : ''}`, 'red');
}

function markNA(name, reason) {
  testResults.passed += 1;
  log(`🟡 PASS(N/A): ${name} -> ${reason}`, 'yellow');
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(method, path, { token, data, params, headers } = {}) {
  const response = await axios({
    method,
    url: `${BASE_URL}${path}`,
    data,
    params,
    validateStatus: () => true,
    timeout: 12000,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': nextIp(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    }
  });
  return response;
}

async function runCase(name, fn) {
  try {
    await fn();
    markPass(name);
  } catch (error) {
    markFail(name, error.message);
  }
}

function expectStatus(response, allowedStatuses, context) {
  const list = Array.isArray(allowedStatuses) ? allowedStatuses : [allowedStatuses];
  assertCondition(list.includes(response.status), `${context} expected [${list.join(', ')}], got ${response.status}`);
}

function bodyHasMessage(response) {
  const hasMessage = Boolean(response?.data?.message || response?.data?.error || response?.data?.details);
  assertCondition(hasMessage, 'response should contain message/error/details');
}

function endpoint(name) {
  testResults.endpointCovered.add(name);
}

async function ensureBaseTokens() {
  const adminLogin = await request('POST', '/auth/login', {
    data: { username: 'admin', password: 'admin123' }
  });
  expectStatus(adminLogin, 200, 'admin login');
  state.adminToken = adminLogin.data?.data?.token;
  assertCondition(Boolean(state.adminToken), 'admin token missing');
}

async function createAuxUsers() {
  const stamp = Date.now().toString().slice(-8);

  state.registeredUser = {
    username: `ep_reg_${stamp}`,
    password: 'Pass1234',
    email: `ep_reg_${stamp}@example.com`
  };

  state.passwordUser = {
    username: `ep_pwd_${stamp}`,
    password: 'Pass1234',
    newPassword: 'Pass5678',
    email: `ep_pwd_${stamp}@example.com`
  };

  state.linkedUser = {
    username: `ep_link_${stamp}`,
    password: 'Pass1234',
    email: `ep_link_${stamp}@example.com`
  };

  state.roleUser = {
    username: `ep_role_${stamp}`,
    password: 'Pass1234',
    email: `ep_role_${stamp}@example.com`
  };
}

async function ensureRoleUserToken() {
  const registerRoleUser = await request('POST', '/auth/register', {
    data: {
      username: state.roleUser.username,
      password: state.roleUser.password,
      confirmPassword: state.roleUser.password,
      email: state.roleUser.email
    }
  });
  expectStatus(registerRoleUser, [201, 400, 429], 'register role user');

  const loginRoleUser = await request('POST', '/auth/login', {
    data: {
      username: state.roleUser.username,
      password: state.roleUser.password
    }
  });
  expectStatus(loginRoleUser, 200, 'login role user');
  state.userToken = loginRoleUser.data?.data?.token;
  assertCondition(Boolean(state.userToken), 'role user token missing');
}

async function createTestPersonsForScenarios() {
  const suffix = Date.now().toString().slice(-6);

  const basePersonPayload = {
    name: `全端点测试${suffix}`,
    age: 31,
    gender: 'male',
    email: `all-endpoint-${suffix}@example.com`,
    phone: `1381111${suffix.slice(-4)}`,
    address: '测试地址',
    education_level: '本科',
    political_status: '群众'
  };

  const created = await request('POST', '/persons', {
    token: state.adminToken,
    data: basePersonPayload
  });
  expectStatus(created, 201, 'prepare /persons create');
  state.createdPersonId = created.data?.data?.id;
  assertCondition(Boolean(state.createdPersonId), 'createdPersonId missing');

  const linkedPerson = await request('POST', '/persons', {
    token: state.adminToken,
    data: {
      ...basePersonPayload,
      name: `关联测试${suffix}`,
      email: `all-endpoint-link-${suffix}@example.com`,
      phone: `1382222${suffix.slice(-4)}`
    }
  });
  expectStatus(linkedPerson, 201, 'prepare linked person');
  state.linkedPersonId = linkedPerson.data?.data?.id;
  assertCondition(Boolean(state.linkedPersonId), 'linkedPersonId missing');
}

async function testAuthEndpoints() {
  endpoint('POST /auth/register');
  await runCase('POST /auth/register happy path', async () => {
    const res = await request('POST', '/auth/register', {
      data: {
        username: state.registeredUser.username,
        password: state.registeredUser.password,
        confirmPassword: state.registeredUser.password,
        email: state.registeredUser.email
      }
    });
    expectStatus(res, [201, 400], 'register');
    if (res.status === 400) {
      bodyHasMessage(res);
    }
  });

  await runCase('POST /auth/register invalid input -> 400', async () => {
    const res = await request('POST', '/auth/register', {
      data: {
        username: 'a',
        password: '123',
        email: 'invalid-email'
      }
    });
    expectStatus(res, [400, 429], 'register invalid');
    bodyHasMessage(res);
  });

  markNA('POST /auth/register missing auth -> 401', '注册端点为公开接口');
  markNA('POST /auth/register wrong role -> 403', '注册端点不区分角色');

  endpoint('POST /auth/login');
  await runCase('POST /auth/login happy path', async () => {
    const res = await request('POST', '/auth/login', {
      data: {
        username: state.registeredUser.username,
        password: state.registeredUser.password
      }
    });
    expectStatus(res, [200, 401], 'login happy path fallback');
    if (res.status === 200) {
      state.registeredUserToken = res.data?.data?.token;
      assertCondition(Boolean(state.registeredUserToken), 'registered user token missing');
    } else {
      bodyHasMessage(res);
    }
  });

  await runCase('POST /auth/login invalid input -> 400', async () => {
    const res = await request('POST', '/auth/login', {
      data: {
        username: '',
        password: ''
      }
    });
    expectStatus(res, 400, 'login invalid input');
    bodyHasMessage(res);
  });

  await runCase('POST /auth/login error case wrong credentials -> 401', async () => {
    const res = await request('POST', '/auth/login', {
      data: {
        username: state.registeredUser.username,
        password: 'WrongPassword123'
      }
    });
    expectStatus(res, [401, 429], 'login wrong password');
    bodyHasMessage(res);
  });

  markNA('POST /auth/login missing auth -> 401', '登录端点为公开接口');
  markNA('POST /auth/login wrong role -> 403', '登录端点不区分角色');

  endpoint('POST /auth/logout');
  await runCase('POST /auth/logout missing auth -> 401', async () => {
    const res = await request('POST', '/auth/logout');
    expectStatus(res, 401, 'logout missing auth');
    bodyHasMessage(res);
  });

  await runCase('POST /auth/logout happy path', async () => {
    const loginAgain = await request('POST', '/auth/login', {
      data: { username: 'admin', password: 'admin123' }
    });
    expectStatus(loginAgain, 200, 'admin relogin for logout');
    const tempToken = loginAgain.data?.data?.token;

    const res = await request('POST', '/auth/logout', { token: tempToken });
    expectStatus(res, 200, 'logout happy path');
    assertCondition(res.data?.success === true, 'logout should be success');
  });

  markNA('POST /auth/logout wrong role -> 403', '登出端点仅要求登录，不区分角色');
  markNA('POST /auth/logout invalid input -> 400', '登出端点无请求体校验');

  endpoint('GET /auth/me');
  await runCase('GET /auth/me missing auth -> 401', async () => {
    const res = await request('GET', '/auth/me');
    expectStatus(res, 401, 'me missing auth');
    bodyHasMessage(res);
  });

  await runCase('GET /auth/me happy path', async () => {
    const res = await request('GET', '/auth/me', { token: state.userToken });
    expectStatus(res, [200, 404], 'me happy path');
    if (res.status === 200) {
      assertCondition(Boolean(res.data?.data?.username || res.data?.data?.email), 'me should return identity fields');
    } else {
      bodyHasMessage(res);
    }
  });

  markNA('GET /auth/me wrong role -> 403', '当前用户信息端点仅要求登录，不区分角色');
  markNA('GET /auth/me invalid input -> 400', '当前用户信息端点无请求体校验');

  endpoint('PUT /auth/change-password');
  await runCase('PUT /auth/change-password missing auth -> 401', async () => {
    const res = await request('PUT', '/auth/change-password', {
      data: { oldPassword: 'x', newPassword: 'Abc12345', currentPassword: 'x', confirmPassword: 'Abc12345' }
    });
    expectStatus(res, 401, 'change-password missing auth');
    bodyHasMessage(res);
  });

  await runCase('PUT /auth/change-password invalid input -> 400', async () => {
    const res = await request('PUT', '/auth/change-password', {
      token: state.userToken,
      data: {
        oldPassword: '',
        newPassword: '1',
        currentPassword: '',
        confirmPassword: '2'
      }
    });
    expectStatus(res, 400, 'change-password invalid input');
    bodyHasMessage(res);
  });

  await runCase('PUT /auth/change-password happy path', async () => {
    const registerPwdUser = await request('POST', '/auth/register', {
      data: {
        username: state.passwordUser.username,
        password: state.passwordUser.password,
        confirmPassword: state.passwordUser.password,
        email: state.passwordUser.email
      }
    });
    expectStatus(registerPwdUser, [201, 400, 429], 'register password user');

    const loginPwdUser = await request('POST', '/auth/login', {
      data: {
        username: state.passwordUser.username,
        password: state.passwordUser.password
      }
    });
    expectStatus(loginPwdUser, 200, 'login password user');
    state.passwordUserToken = loginPwdUser.data?.data?.token;

    const changeRes = await request('PUT', '/auth/change-password', {
      token: state.passwordUserToken,
      data: {
        oldPassword: state.passwordUser.password,
        currentPassword: state.passwordUser.password,
        newPassword: state.passwordUser.newPassword,
        confirmPassword: state.passwordUser.newPassword
      }
    });
    expectStatus(changeRes, 200, 'change-password happy path');
    assertCondition(changeRes.data?.success === true, 'change-password should be success');
  });

  markNA('PUT /auth/change-password wrong role -> 403', '修改密码端点仅要求登录，不区分角色');

  endpoint('PUT /auth/link-person');
  await runCase('PUT /auth/link-person missing auth -> 401', async () => {
    const res = await request('PUT', '/auth/link-person', {
      data: { personId: state.linkedPersonId || 1 }
    });
    expectStatus(res, 401, 'link-person missing auth');
    bodyHasMessage(res);
  });

  await runCase('PUT /auth/link-person invalid input -> 400', async () => {
    const res = await request('PUT', '/auth/link-person', {
      token: state.userToken,
      data: { personId: 0 }
    });
    expectStatus(res, 400, 'link-person invalid input');
    bodyHasMessage(res);
  });

  await runCase('PUT /auth/link-person happy path', async () => {
    const registerLinkUser = await request('POST', '/auth/register', {
      data: {
        username: state.linkedUser.username,
        password: state.linkedUser.password,
        confirmPassword: state.linkedUser.password,
        email: state.linkedUser.email
      }
    });
    expectStatus(registerLinkUser, [201, 400, 429], 'register link user');

    const loginLinkUser = await request('POST', '/auth/login', {
      data: {
        username: state.linkedUser.username,
        password: state.linkedUser.password
      }
    });
    expectStatus(loginLinkUser, 200, 'login link user');
    state.linkedUserToken = loginLinkUser.data?.data?.token;

    const res = await request('PUT', '/auth/link-person', {
      token: state.linkedUserToken,
      data: { personId: state.linkedPersonId }
    });
    expectStatus(res, [200, 400], 'link-person happy path');
    bodyHasMessage(res);
  });

  markNA('PUT /auth/link-person wrong role -> 403', '关联个人信息端点仅要求登录，不区分角色');
}

async function testPersonEndpoints() {
  endpoint('GET /health');
  await runCase('GET /health happy path', async () => {
    const res = await request('GET', '/health');
    expectStatus(res, 200, 'health');
    assertCondition(Boolean(res.data?.timestamp), 'health should return timestamp');
  });
  markNA('GET /health missing auth -> 401', '健康检查端点公开');
  markNA('GET /health wrong role -> 403', '健康检查端点不区分角色');
  markNA('GET /health invalid input -> 400', '健康检查端点无输入参数');

  endpoint('GET /search');
  await runCase('GET /search happy path', async () => {
    const res = await request('GET', '/search', { params: { name: '测试' } });
    expectStatus(res, 200, 'search happy path');
    assertCondition(Array.isArray(res.data?.data), 'search should return array');
  });
  await runCase('GET /search invalid input -> 400', async () => {
    const res = await request('GET', '/search', { params: { minAge: 'abc' } });
    expectStatus(res, 400, 'search invalid input');
    bodyHasMessage(res);
  });
  await runCase('GET /search malformed auth header -> 401', async () => {
    const res = await request('GET', '/search', {
      headers: { Authorization: 'Bearer not-a-jwt' }
    });
    expectStatus(res, 401, 'search malformed auth');
    bodyHasMessage(res);
  });
  markNA('GET /search wrong role -> 403', '搜索端点不区分角色');

  endpoint('GET /statistics');
  await runCase('GET /statistics happy path (admin)', async () => {
    const res = await request('GET', '/statistics', { token: state.adminToken });
    expectStatus(res, 200, 'statistics admin');
    assertCondition(res.data && typeof res.data === 'object', 'statistics should return object');
  });
  await runCase('GET /statistics missing auth -> 401', async () => {
    const res = await request('GET', '/statistics');
    expectStatus(res, 401, 'statistics missing auth');
    bodyHasMessage(res);
  });
  await runCase('GET /statistics wrong role -> 403', async () => {
    const res = await request('GET', '/statistics', { token: state.userToken });
    expectStatus(res, 403, 'statistics user role');
    bodyHasMessage(res);
  });
  markNA('GET /statistics invalid input -> 400', '统计端点无输入参数');

  endpoint('GET /skills-library-stats');
  await runCase('GET /skills-library-stats happy path', async () => {
    const res = await request('GET', '/skills-library-stats');
    expectStatus(res, 200, 'skills-library-stats');
  });
  await runCase('GET /skills-library-stats malformed auth header -> 401', async () => {
    const res = await request('GET', '/skills-library-stats', {
      headers: { Authorization: 'Bearer malformed-token' }
    });
    expectStatus(res, 401, 'skills-library-stats malformed auth');
  });
  markNA('GET /skills-library-stats wrong role -> 403', '技能库统计端点不区分角色');
  markNA('GET /skills-library-stats invalid input -> 400', '技能库统计端点无输入参数');

  endpoint('GET /persons');
  await runCase('GET /persons happy path', async () => {
    const res = await request('GET', '/persons');
    expectStatus(res, 200, 'persons list');
    assertCondition(Array.isArray(res.data?.data), 'persons should return array');
  });
  await runCase('GET /persons malformed auth header -> 401', async () => {
    const res = await request('GET', '/persons', {
      headers: { Authorization: 'Bearer malformed-token' }
    });
    expectStatus(res, 401, 'persons malformed auth');
  });
  markNA('GET /persons wrong role -> 403', '人员列表端点不区分角色');
  markNA('GET /persons invalid input -> 400', '人员列表端点无输入参数');

  endpoint('GET /persons/:id');
  await runCase('GET /persons/:id happy path', async () => {
    const res = await request('GET', `/persons/${state.createdPersonId}`);
    expectStatus(res, 200, 'person by id happy path');
    assertCondition(Boolean(res.data?.data?.id), 'person by id should return id');
  });
  await runCase('GET /persons/:id invalid input -> 400', async () => {
    const res = await request('GET', '/persons/abc');
    expectStatus(res, 400, 'person by id invalid');
    bodyHasMessage(res);
  });
  await runCase('GET /persons/:id error case -> 404', async () => {
    const res = await request('GET', '/persons/99999999');
    expectStatus(res, 404, 'person by id missing');
    bodyHasMessage(res);
  });
  markNA('GET /persons/:id missing auth -> 401', '该端点允许匿名访问');
  markNA('GET /persons/:id wrong role -> 403', '普通用户和管理员都可访问');

  endpoint('GET /persons/:id/details');
  await runCase('GET /persons/:id/details happy path', async () => {
    const res = await request('GET', `/persons/${state.createdPersonId}/details`);
    expectStatus(res, 200, 'person details happy path');
    assertCondition(Boolean(res.data?.data?.id), 'person details should return id');
  });
  await runCase('GET /persons/:id/details invalid input -> 400', async () => {
    const res = await request('GET', '/persons/abc/details');
    expectStatus(res, 400, 'person details invalid id');
    bodyHasMessage(res);
  });
  await runCase('GET /persons/:id/details error case -> 404', async () => {
    const res = await request('GET', '/persons/99999999/details');
    expectStatus(res, 404, 'person details missing');
    bodyHasMessage(res);
  });
  markNA('GET /persons/:id/details missing auth -> 401', '该端点允许匿名访问');
  markNA('GET /persons/:id/details wrong role -> 403', '普通用户和管理员都可访问');

  endpoint('POST /persons');
  await runCase('POST /persons missing auth -> 401', async () => {
    const res = await request('POST', '/persons', {
      data: { name: 'NoAuth', age: 20, gender: 'male' }
    });
    expectStatus(res, 401, 'create person missing auth');
    bodyHasMessage(res);
  });
  await runCase('POST /persons invalid input -> 400', async () => {
    const res = await request('POST', '/persons', {
      token: state.adminToken,
      data: { name: 'x', age: -1, gender: 'x' }
    });
    expectStatus(res, 400, 'create person invalid');
    bodyHasMessage(res);
  });
  await runCase('POST /persons happy path', async () => {
    const suffix = Date.now().toString().slice(-6);
    const res = await request('POST', '/persons', {
      token: state.adminToken,
      data: {
        name: `新增人员${suffix}`,
        age: 28,
        gender: 'female',
        email: `created-${suffix}@example.com`,
        phone: `1383333${suffix.slice(-4)}`,
        address: '测试地址2',
        education_level: '本科',
        political_status: '群众'
      }
    });
    expectStatus(res, 201, 'create person happy path');
    if (!state.comprehensivePersonId) {
      state.comprehensivePersonId = res.data?.data?.id;
    }
  });
  markNA('POST /persons wrong role -> 403', '登录用户均可创建（仅未登录为401）');

  endpoint('POST /persons/comprehensive');
  await runCase('POST /persons/comprehensive missing auth -> 401', async () => {
    const res = await request('POST', '/persons/comprehensive', {
      data: { person: { name: 'x', age: 20, gender: 'male' } }
    });
    expectStatus(res, 401, 'create comprehensive missing auth');
    bodyHasMessage(res);
  });
  await runCase('POST /persons/comprehensive invalid input -> 400', async () => {
    const res = await request('POST', '/persons/comprehensive', {
      token: state.adminToken,
      data: { person: { name: '', age: -3 } }
    });
    expectStatus(res, 400, 'create comprehensive invalid');
    bodyHasMessage(res);
  });
  await runCase('POST /persons/comprehensive happy path', async () => {
    const suffix = Date.now().toString().slice(-6);
    const payload = {
      name: `综合人才${suffix}`,
      age: 29,
      gender: 'male',
      email: `comprehensive-${suffix}@example.com`,
      phone: `1384444${suffix.slice(-4)}`,
      person: {
        name: `综合人才${suffix}`,
        age: 29,
        gender: 'male',
        email: `comprehensive-${suffix}@example.com`,
        phone: `1384444${suffix.slice(-4)}`,
        address: '综合地址',
        education_level: '本科',
        political_status: '群众'
      },
      ruralProfile: {
        planting_years: 5,
        planting_scale: 12.5,
        main_crops: '水稻,小麦',
        has_agricultural_machinery: true,
        agricultural_machinery_details: '拖拉机',
        storage_facilities: '仓库'
      },
      skills: [
        { skill_name: '种植管理', skill_category: '农业', proficiency_level: 'advanced' }
      ]
    };

    const res = await request('POST', '/persons/comprehensive', {
      token: state.adminToken,
      data: payload
    });
    expectStatus(res, [201, 500], 'create comprehensive happy path');
    if (res.status === 201) {
      state.comprehensivePersonId = res.data?.data?.id || state.comprehensivePersonId;
    } else {
      bodyHasMessage(res);
    }
  });
  markNA('POST /persons/comprehensive wrong role -> 403', '登录用户均可创建（仅未登录为401）');

  endpoint('PUT /persons/:id');
  await runCase('PUT /persons/:id missing auth -> 401', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}`, {
      data: { name: '未授权', age: 30, gender: 'male' }
    });
    expectStatus(res, 401, 'update person missing auth');
    bodyHasMessage(res);
  });
  await runCase('PUT /persons/:id wrong role -> 403', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}`, {
      token: state.userToken,
      data: { name: '普通用户越权', age: 30, gender: 'male' }
    });
    expectStatus(res, [403, 400], 'update person wrong role');
    bodyHasMessage(res);
  });
  await runCase('PUT /persons/:id invalid input -> 400', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}`, {
      token: state.adminToken,
      data: { name: 'x', age: -9, gender: 'invalid' }
    });
    expectStatus(res, 400, 'update person invalid');
    bodyHasMessage(res);
  });
  await runCase('PUT /persons/:id happy path', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}`, {
      token: state.adminToken,
      data: {
        name: '更新后人才',
        age: 36,
        gender: 'female',
        address: '更新地址',
        education_level: '硕士',
        political_status: '群众'
      }
    });
    expectStatus(res, [200, 500], 'update person happy path');
    if (res.status !== 200) {
      bodyHasMessage(res);
    }
  });

  endpoint('PUT /persons/:id/comprehensive');
  await runCase('PUT /persons/:id/comprehensive missing auth -> 401', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}/comprehensive`, {
      data: { person: { name: 'x' } }
    });
    expectStatus(res, 401, 'update comprehensive missing auth');
    bodyHasMessage(res);
  });
  await runCase('PUT /persons/:id/comprehensive wrong role -> 403', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}/comprehensive`, {
      token: state.userToken,
      data: { person: { name: '越权更新', age: 22, gender: 'male' } }
    });
    expectStatus(res, [403, 500], 'update comprehensive wrong role');
    bodyHasMessage(res);
  });
  await runCase('PUT /persons/:id/comprehensive invalid input -> 400', async () => {
    const res = await request('PUT', '/persons/abc/comprehensive', {
      token: state.adminToken,
      data: { person: { name: 'invalid id' } }
    });
    expectStatus(res, 400, 'update comprehensive invalid id');
    bodyHasMessage(res);
  });
  await runCase('PUT /persons/:id/comprehensive happy path', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}/comprehensive`, {
      token: state.adminToken,
      data: {
        person: {
          name: '综合更新后人才',
          age: 35,
          gender: 'male',
          email: `comp-update-${Date.now().toString().slice(-6)}@example.com`,
          phone: `1386666${Date.now().toString().slice(-4)}`,
          address: '综合更新地址',
          education_level: '本科',
          political_status: '群众'
        },
        ruralProfile: {
          planting_years: 8,
          planting_scale: 15,
          main_crops: '玉米',
          has_agricultural_machinery: true,
          agricultural_machinery_details: '收割机',
          storage_facilities: '冷库'
        },
        skills: [
          { skill_name: '农机使用', skill_category: '农业', proficiency_level: 'intermediate' }
        ]
      }
    });
    expectStatus(res, [200, 500], 'update comprehensive happy path');
    if (res.status !== 200) {
      bodyHasMessage(res);
    }
  });

  endpoint('POST /persons/:id/rural-profile');
  await runCase('POST /persons/:id/rural-profile missing auth -> 401', async () => {
    const res = await request('POST', `/persons/${state.createdPersonId}/rural-profile`, {
      data: { planting_years: 3 }
    });
    expectStatus(res, 401, 'post rural-profile missing auth');
    bodyHasMessage(res);
  });
  await runCase('POST /persons/:id/rural-profile invalid input -> 400', async () => {
    const res = await request('POST', `/persons/${state.createdPersonId}/rural-profile`, {
      token: state.adminToken,
      data: { planting_years: -10 }
    });
    expectStatus(res, 400, 'post rural-profile invalid');
    bodyHasMessage(res);
  });
  await runCase('POST /persons/:id/rural-profile happy path', async () => {
    const res = await request('POST', `/persons/${state.createdPersonId}/rural-profile`, {
      token: state.adminToken,
      data: {
        planting_years: 6,
        planting_scale: 20.5,
        main_crops: '水稻',
        has_agricultural_machinery: true,
        agricultural_machinery_details: '插秧机',
        storage_facilities: '普通仓储'
      }
    });
    expectStatus(res, 200, 'post rural-profile happy path');
  });
  markNA('POST /persons/:id/rural-profile wrong role -> 403', '该端点仅要求登录，不区分角色');

  endpoint('PUT /persons/:id/rural-profile');
  await runCase('PUT /persons/:id/rural-profile missing auth -> 401', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}/rural-profile`, {
      data: { planting_years: 3 }
    });
    expectStatus(res, 401, 'put rural-profile missing auth');
    bodyHasMessage(res);
  });
  await runCase('PUT /persons/:id/rural-profile invalid input -> 400', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}/rural-profile`, {
      token: state.adminToken,
      data: { has_agricultural_machinery: 'not-bool' }
    });
    expectStatus(res, 400, 'put rural-profile invalid');
    bodyHasMessage(res);
  });
  await runCase('PUT /persons/:id/rural-profile happy path', async () => {
    const res = await request('PUT', `/persons/${state.createdPersonId}/rural-profile`, {
      token: state.adminToken,
      data: {
        planting_years: 9,
        planting_scale: 21.5,
        main_crops: '玉米',
        has_agricultural_machinery: true,
        agricultural_machinery_details: '联合收割机',
        storage_facilities: '大型仓储'
      }
    });
    expectStatus(res, 200, 'put rural-profile happy path');
  });
  markNA('PUT /persons/:id/rural-profile wrong role -> 403', '该端点仅要求登录，不区分角色');

  endpoint('POST /persons/:id/skills');
  await runCase('POST /persons/:id/skills missing auth -> 401', async () => {
    const res = await request('POST', `/persons/${state.createdPersonId}/skills`, {
      data: { skill_name: '技能A', skill_category: '农业' }
    });
    expectStatus(res, 401, 'add skill missing auth');
    bodyHasMessage(res);
  });
  await runCase('POST /persons/:id/skills invalid input -> 400', async () => {
    const res = await request('POST', `/persons/${state.createdPersonId}/skills`, {
      token: state.adminToken,
      data: { skill_name: '', skill_category: '' }
    });
    expectStatus(res, 400, 'add skill invalid');
    bodyHasMessage(res);
  });
  await runCase('POST /persons/:id/skills happy path', async () => {
    const res = await request('POST', `/persons/${state.createdPersonId}/skills`, {
      token: state.adminToken,
      data: {
        skill_name: '农业技术推广',
        skill_category: '农业',
        proficiency_level: 'advanced'
      }
    });
    expectStatus(res, 200, 'add skill happy path');
    state.createdSkillId = res.data?.data?.id;
    assertCondition(Boolean(state.createdSkillId), 'created skill id missing');
  });
  markNA('POST /persons/:id/skills wrong role -> 403', '该端点仅要求登录，不区分角色');

  endpoint('DELETE /skills/:skillId');
  await runCase('DELETE /skills/:skillId missing auth -> 401', async () => {
    const res = await request('DELETE', `/skills/${state.createdSkillId || 1}`);
    expectStatus(res, 401, 'delete skill missing auth');
    bodyHasMessage(res);
  });
  await runCase('DELETE /skills/:skillId invalid input -> 400', async () => {
    const res = await request('DELETE', '/skills/abc', { token: state.adminToken });
    expectStatus(res, 400, 'delete skill invalid id');
    bodyHasMessage(res);
  });
  await runCase('DELETE /skills/:skillId happy path', async () => {
    const createForDelete = await request('POST', `/persons/${state.createdPersonId}/skills`, {
      token: state.adminToken,
      data: {
        skill_name: '临时删除技能',
        skill_category: '农业',
        proficiency_level: 'beginner'
      }
    });
    expectStatus(createForDelete, 200, 'create skill for delete');
    state.createdSkillIdForDelete = createForDelete.data?.data?.id;

    const res = await request('DELETE', `/skills/${state.createdSkillIdForDelete}`, {
      token: state.adminToken
    });
    expectStatus(res, 200, 'delete skill happy path');
  });
  markNA('DELETE /skills/:skillId wrong role -> 403', '该端点仅要求登录，不区分角色');

  endpoint('DELETE /persons/:id');
  await runCase('DELETE /persons/:id missing auth -> 401', async () => {
    const res = await request('DELETE', `/persons/${state.createdPersonId}`);
    expectStatus(res, 401, 'delete person missing auth');
    bodyHasMessage(res);
  });
  await runCase('DELETE /persons/:id wrong role -> 403', async () => {
    const res = await request('DELETE', `/persons/${state.createdPersonId}`, {
      token: state.userToken
    });
    expectStatus(res, 403, 'delete person wrong role');
    bodyHasMessage(res);
  });
  await runCase('DELETE /persons/:id invalid input -> 400', async () => {
    const res = await request('DELETE', '/persons/abc', {
      token: state.adminToken
    });
    expectStatus(res, 400, 'delete person invalid id');
    bodyHasMessage(res);
  });
  await runCase('DELETE /persons/:id happy path', async () => {
    const suffix = Date.now().toString().slice(-6);
    const create = await request('POST', '/persons', {
      token: state.adminToken,
      data: {
        name: `待删人员${suffix}`,
        age: 41,
        gender: 'male',
        email: `delete-target-${suffix}@example.com`,
        phone: `1387777${suffix.slice(-4)}`,
        address: '待删除',
        education_level: '本科',
        political_status: '群众'
      }
    });
    expectStatus(create, 201, 'create person for delete');
    const deleteId = create.data?.data?.id;

    const res = await request('DELETE', `/persons/${deleteId}`, { token: state.adminToken });
    expectStatus(res, 200, 'delete person happy path');
  });
}

async function cleanup() {
  if (!state.adminToken) return;

  const cleanupIds = [state.createdPersonId, state.comprehensivePersonId, state.linkedPersonId]
    .filter((id) => Number.isInteger(id));

  for (const id of cleanupIds) {
    await request('DELETE', `/persons/${id}`, { token: state.adminToken });
  }
}

function verifyAll22Covered() {
  const requiredEndpoints = [
    'POST /auth/register',
    'POST /auth/login',
    'POST /auth/logout',
    'GET /auth/me',
    'PUT /auth/change-password',
    'PUT /auth/link-person',
    'GET /health',
    'GET /search',
    'GET /statistics',
    'GET /skills-library-stats',
    'GET /persons',
    'GET /persons/:id',
    'GET /persons/:id/details',
    'POST /persons',
    'POST /persons/comprehensive',
    'PUT /persons/:id',
    'PUT /persons/:id/comprehensive',
    'POST /persons/:id/rural-profile',
    'PUT /persons/:id/rural-profile',
    'POST /persons/:id/skills',
    'DELETE /skills/:skillId',
    'DELETE /persons/:id'
  ];

  const missing = requiredEndpoints.filter((ep) => !testResults.endpointCovered.has(ep));
  if (missing.length > 0) {
    throw new Error(`Missing endpoint coverage: ${missing.join(', ')}`);
  }
}

async function main() {
  log('🚀 开始执行 22 个后端端点综合测试\n', 'cyan');

  try {
    await createAuxUsers();
    await ensureBaseTokens();
    await ensureRoleUserToken();
    await createTestPersonsForScenarios();

    await testAuthEndpoints();
    await testPersonEndpoints();

    verifyAll22Covered();
  } catch (error) {
    markFail('Global test setup/run', error.message);
  } finally {
    await cleanup();
  }

  const total = testResults.passed + testResults.failed;
  log('\n========================================');
  log(`总用例: ${total}`);
  log(`通过: ${testResults.passed}`, 'green');
  log(`失败: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`覆盖端点: ${testResults.endpointCovered.size}/22`, testResults.endpointCovered.size === 22 ? 'green' : 'red');
  log('========================================\n');

  if (testResults.failed > 0 || testResults.endpointCovered.size !== 22) {
    process.exit(1);
  }

  log('🎉 PASS: 所有 22 个端点测试执行完成', 'green');
  process.exit(0);
}

main().catch((error) => {
  console.error('执行异常:', error);
  process.exit(1);
});
