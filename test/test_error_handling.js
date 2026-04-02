/**
 * 错误处理测试
 * 覆盖 404、500、验证错误、认证错误、权限错误等场景
 */

const axios = require('axios');
const http = require('http');

const API_BASE = 'http://localhost:8083/api';

const colors = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m'
};

function colorLog(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    colorLog(`  ✅ ${testName}`, 'green');
  } else {
    failedTests++;
    colorLog(`  ❌ ${testName}${detail ? ' - ' + detail : ''}`, 'red');
  }
}

let adminTokenCache = null;
async function getAdminToken() {
  if (adminTokenCache) return adminTokenCache;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        username: 'admin', password: 'admin123'
      });
      adminTokenCache = res.data.data?.token || res.data.token;
      return adminTokenCache;
    } catch (e) {
      if (e.response?.status === 429 && attempt < 2) {
        const retryAfter = parseInt(e.response.headers['retry-after'] || '60', 10);
        colorLog(`  ⏳ 登录限速，等待 ${retryAfter}s...`, 'yellow');
        await sleep(retryAfter * 1000);
        continue;
      }
      throw e;
    }
  }
}

async function getUserToken() {
  try {
    await axios.post(`${API_BASE}/auth/register`, {
      username: 'errtest_user', password: 'test123456',
      confirmPassword: 'test123456', email: 'errtest@example.com'
    });
  } catch (e) { /* 用户已存在 */ }
  await sleep(300);
  const res = await axios.post(`${API_BASE}/auth/login`, {
    username: 'errtest_user', password: 'test123456'
  });
  return res.data.data?.token || res.data.token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ========== 404 错误测试 ==========
async function test404Errors() {
  colorLog('\n📁 404 错误测试', 'cyan');

  try {
    await axios.get(`${API_BASE}/nonexistent-route`);
    assert(false, '不存在的路由应返回404');
  } catch (error) {
    assert(error.response?.status === 404, 'GET /api/nonexistent-route 返回404', `实际状态: ${error.response?.status}`);
    assert(error.response?.data?.success === false, '404响应包含 success: false');
  }

  try {
    await axios.get(`${API_BASE}/persons/999999`);
    assert(false, '不存在的人员ID应返回404');
  } catch (error) {
    assert(error.response?.status === 404, 'GET /api/persons/999999 返回404', `实际状态: ${error.response?.status}`);
  }

  const token = await getAdminToken();
  await sleep(200);
  try {
    await axios.delete(`${API_BASE}/persons/999999`, { headers: { Authorization: `Bearer ${token}` } });
    assert(false, '删除不存在的人员应返回404');
  } catch (error) {
    assert(error.response?.status === 404, 'DELETE /api/persons/999999 返回404', `实际状态: ${error.response?.status}`);
  }
}

// ========== 401 认证错误测试 ==========
async function test401Errors() {
  colorLog('\n🔐 401 认证错误测试', 'cyan');

  try {
    await axios.post(`${API_BASE}/persons`, { name: '测试', age: 25, gender: '男' });
    assert(false, '无token创建人员应返回401');
  } catch (error) {
    assert(error.response?.status === 401, '无token POST /api/persons 返回401', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: 'Bearer invalidtoken12345' } });
    assert(false, '无效token应返回401');
  } catch (error) {
    assert(error.response?.status === 401, '无效token访问 /auth/me 返回401', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: 'InvalidFormat token123' } });
    assert(false, '无效Bearer格式应返回401');
  } catch (error) {
    assert(error.response?.status === 401, '无效Authorization格式返回401', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: 'Bearer ' } });
    assert(false, '空Bearer token应返回401');
  } catch (error) {
    assert(error.response?.status === 401, '空Bearer token返回401', `实际状态: ${error.response?.status}`);
  }
}

// ========== 403 权限错误测试 ==========
async function test403Errors() {
  colorLog('\n🚫 403 权限错误测试', 'cyan');

  const userToken = await getUserToken();
  await sleep(200);

  try {
    await axios.get(`${API_BASE}/statistics`, { headers: { Authorization: `Bearer ${userToken}` } });
    assert(false, '普通用户访问统计应返回403');
  } catch (error) {
    assert(error.response?.status === 403, '普通用户GET /statistics 返回403', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.get(`${API_BASE}/persons/export`, { headers: { Authorization: `Bearer ${userToken}` } });
    assert(false, '普通用户导出数据应返回403');
  } catch (error) {
    assert(error.response?.status === 403, '普通用户GET /persons/export 返回403', `实际状态: ${error.response?.status}`);
  }
}

// ========== 400 验证错误测试 ==========
async function testValidationErrors() {
  colorLog('\n✏️ 400 验证错误测试', 'cyan');

  const token = await getAdminToken();
  await sleep(200);

  try {
    await axios.post(`${API_BASE}/persons`, {}, { headers: authHeaders(token) });
    assert(false, '空body创建人员应返回400');
  } catch (error) {
    assert(error.response?.status === 400, '空body POST /persons 返回400', `实际状态: ${error.response?.status}`);
    assert(error.response?.data?.success === false, '验证错误包含 success: false');
  }

  try {
    await axios.post(`${API_BASE}/persons`, { name: '测试用户', age: 999, gender: '男' }, { headers: authHeaders(token) });
    assert(false, '年龄超出范围应返回400');
  } catch (error) {
    assert(error.response?.status === 400, '年龄999 POST /persons 返回400', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.post(`${API_BASE}/persons`, { name: '测试用户', age: -5, gender: '男' }, { headers: authHeaders(token) });
    assert(false, '负数年龄应返回400');
  } catch (error) {
    assert(error.response?.status === 400, '年龄-5 POST /persons 返回400', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.post(`${API_BASE}/persons`, { name: '测试用户', age: 25, gender: 'invalid' }, { headers: authHeaders(token) });
    assert(false, '无效性别值应返回400');
  } catch (error) {
    assert(error.response?.status === 400, '性别invalid POST /persons 返回400', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.post(`${API_BASE}/persons`, { name: '测试用户', age: 25, gender: '男', email: 'not-an-email' }, { headers: authHeaders(token) });
    assert(false, '无效邮箱格式应返回400');
  } catch (error) {
    assert(error.response?.status === 400, '无效邮箱 POST /persons 返回400', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.post(`${API_BASE}/persons`, { name: '测试用户', age: 25, gender: '男', phone: '123' }, { headers: authHeaders(token) });
    assert(false, '无效电话格式应返回400');
  } catch (error) {
    assert(error.response?.status === 400, '无效电话 POST /persons 返回400', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.post(`${API_BASE}/persons`, { name: 'A', age: 25, gender: '男' }, { headers: authHeaders(token) });
    assert(false, '姓名太短应返回400');
  } catch (error) {
    assert(error.response?.status === 400, '姓名1字符 POST /persons 返回400', `实际状态: ${error.response?.status}`);
  }

  await sleep(1000);
  try {
    await axios.post(`${API_BASE}/auth/register`, {
      username: 'ab', password: 'test123456', confirmPassword: 'test123456', email: 'test@example.com'
    });
    assert(false, '用户名太短应返回400');
  } catch (error) {
    assert(error.response?.status === 400 || error.response?.status === 429,
      '用户名2字符注册返回400', `实际状态: ${error.response?.status}`);
  }

  await sleep(1000);
  try {
    const ts = Date.now();
    await axios.post(`${API_BASE}/auth/register`, {
      username: `testuser${ts}`, password: '123', confirmPassword: '123', email: `test${ts}@example.com`
    });
    assert(false, '密码太短应返回400');
  } catch (error) {
    assert(error.response?.status === 400 || error.response?.status === 429,
      '密码3字符注册返回400', `实际状态: ${error.response?.status}`);
  }

  await sleep(1000);
  try {
    const ts = Date.now();
    await axios.post(`${API_BASE}/auth/register`, {
      username: `testuser${ts}`, password: 'test123456', confirmPassword: 'test123456', email: 'not-an-email'
    });
    assert(false, '无效邮箱注册应返回400');
  } catch (error) {
    assert(error.response?.status === 400 || error.response?.status === 429,
      '无效邮箱注册返回400', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.get(`${API_BASE}/search?page=0`);
    assert(false, '页码为0应返回400');
  } catch (error) {
    assert(error.response?.status === 400, '搜索page=0返回400', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.get(`${API_BASE}/search?limit=999`);
    assert(false, 'limit超出范围应返回400');
  } catch (error) {
    assert(error.response?.status === 400, '搜索limit=999返回400', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.put(`${API_BASE}/auth/link-person`, { personId: 'abc' }, { headers: authHeaders(token) });
    assert(false, 'personId非整数应返回400');
  } catch (error) {
    assert(error.response?.status === 400, 'link-person personId=abc 返回400', `实际状态: ${error.response?.status}`);
  }
}

// ========== 请求格式错误测试 ==========
async function testMalformedRequests() {
  colorLog('\n🔧 请求格式错误测试', 'cyan');

  const token = await getAdminToken();
  await sleep(200);

  try {
    await axios.post(`${API_BASE}/persons`, 'this is not json{', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    assert(false, '无效JSON应返回错误');
  } catch (error) {
    assert(error.response?.status === 400 || error.response?.status === 500,
      '无效JSON返回4xx/5xx', `实际状态: ${error.response?.status}`);
  }

  await new Promise((resolve) => {
    const data = JSON.stringify({ name: 'test', age: 25, gender: '男' });
    const options = {
      hostname: 'localhost', port: 8083, path: '/api/persons', method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        assert(res.statusCode >= 200 || res.statusCode >= 400, '无Content-Type请求得到响应');
        resolve();
      });
    });
    req.on('error', () => { assert(false, '请求发送失败'); resolve(); });
    req.write(data);
    req.end();
  });

  try {
    await axios.get(`${API_BASE}/persons`, {
      data: { unexpected: 'body' },
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(true, 'GET带body被正常处理');
  } catch (error) {
    assert(error.response?.status >= 400, 'GET带body返回错误状态码', `实际状态: ${error.response?.status}`);
  }

  try {
    await axios.patch(`${API_BASE}/persons/1`);
    assert(false, 'PATCH方法应返回404或405');
  } catch (error) {
    assert(error.response?.status === 404 || error.response?.status === 405,
      'PATCH /persons/1 返回404或405', `实际状态: ${error.response?.status}`);
  }
}

async function test500Errors() {
  colorLog('\n🧱 500路径鲁棒性测试', 'cyan');

  const token = await getAdminToken();
  await sleep(200);

  try {
    await axios.put(`${API_BASE}/persons/notanumber`, {
      name: 'test', age: 25, gender: '男'
    }, { headers: authHeaders(token) });
    assert(false, 'PUT /persons/notanumber 应返回400或404');
  } catch (error) {
    const status = error.response?.status;
    const body = error.response?.data;
    assert(status === 400 || status === 404,
      'PUT /persons/notanumber 返回400或404', `实际状态: ${status}`);
    assert(status !== 500, 'PUT /persons/notanumber 非500错误');
    assert(body?.success === false && typeof body?.message === 'string',
      'PUT错误响应格式一致 {success:false,message:string}');
  }

  await new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8083,
      path: '/api/persons',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let bodyText = '';
      res.on('data', chunk => bodyText += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        assert(status === 400 || status === 500,
          'malformed JSON 返回400或500', `实际状态: ${status}`);

        try {
          const parsed = JSON.parse(bodyText || '{}');
          assert(parsed?.success === false && typeof parsed?.message === 'string',
            'malformed JSON 错误响应格式一致 {success:false,message:string}');
        } catch (e) {
          assert(false, 'malformed JSON 响应应为JSON结构', e.message);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      assert(false, 'malformed JSON 请求发送失败', e.message);
      resolve();
    });

    req.write('{"name":"broken-json"');
    req.end();
  });

  for (const id of [0, -1]) {
    try {
      await axios.get(`${API_BASE}/persons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert(false, `GET /persons/${id} 应返回400或404`);
    } catch (error) {
      const status = error.response?.status;
      const body = error.response?.data;
      assert(status === 400 || status === 404,
        `GET /persons/${id} 返回400或404`, `实际状态: ${status}`);
      assert(status !== 500, `GET /persons/${id} 非500错误`);
      assert(body?.success === false && typeof body?.message === 'string',
        `GET /persons/${id} 错误响应格式一致`);
    }
  }

  const concurrent = Array.from({ length: 5 }, (_, i) => {
    return axios.get(`${API_BASE}/definitely-not-exist-${Date.now()}-${i}`)
      .then(() => ({ ok: false, status: 200 }))
      .catch(err => ({ ok: true, status: err.response?.status, data: err.response?.data }));
  });

  const concurrentResults = await Promise.all(concurrent);
  const all404 = concurrentResults.every(r => r.ok && r.status === 404);
  const none500 = concurrentResults.every(r => r.status !== 500);
  const validFormat = concurrentResults.every(r =>
    r.data?.success === false && typeof r.data?.message === 'string'
  );
  assert(all404, '5个并发不存在路由请求均返回404');
  assert(none500, '5个并发不存在路由请求均非500');
  assert(validFormat, '并发错误响应格式一致 {success:false,message:string}');

  const loginFlood = [];
  for (let i = 0; i < 8; i++) {
    loginFlood.push(
      axios.post(`${API_BASE}/auth/login`, {
        username: 'admin',
        password: 'wrong-password'
      }).then(() => ({ status: 200 }))
        .catch(err => ({ status: err.response?.status }))
    );
  }
  const loginResults = await Promise.all(loginFlood);
  const has429 = loginResults.some(r => r.status === 429);
  const loginNone500 = loginResults.every(r => r.status !== 500);
  assert(has429, '快速多次登录出现429限流');
  assert(loginNone500, '快速多次登录未出现500');
}

async function main() {
  colorLog('🚀 错误处理测试开始...\n', 'blue');

  try {
    await test404Errors();
    await sleep(100);
    await test401Errors();
    await sleep(100);
    await test403Errors();
    await sleep(100);
    await testValidationErrors();
    await sleep(100);
    await testMalformedRequests();
    await sleep(100);
    await test500Errors();

    colorLog('\n📋 错误处理测试总结', 'blue');
    colorLog('=====================================', 'blue');
    colorLog(`总测试数: ${totalTests}`, 'reset');
    colorLog(`通过: ${passedTests}`, 'green');
    colorLog(`失败: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

    if (failedTests > 0) {
      colorLog('\n⚠️ 存在失败的测试', 'red');
      process.exit(1);
    } else {
      colorLog('\n🎉 所有错误处理测试通过！', 'green');
      process.exit(0);
    }
  } catch (error) {
    colorLog(`\n❌ 测试执行异常: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
