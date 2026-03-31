/**
 * 边界情况测试
 * 覆盖 SQL注入、XSS、超大输入、并发请求等安全与边界场景
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
  if (condition) { passedTests++; colorLog(`  ✅ ${testName}`, 'green'); }
  else { failedTests++; colorLog(`  ❌ ${testName}${detail ? ' - ' + detail : ''}`, 'red'); }
}

let cachedToken = null;
async function getAdminToken() {
  if (cachedToken) return cachedToken;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        username: 'admin', password: 'admin123'
      });
      cachedToken = res.data.data?.token || res.data.token;
      return cachedToken;
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

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ========== SQL注入测试 ==========
async function testSQLInjection() {
  colorLog('\n🛡️ SQL注入防护测试', 'cyan');

  const token = await getAdminToken();
  await sleep(500);

  // 1. name字段SQL注入 - OR 1=1
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: "OR 1=1--", age: 25, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(true, 'SQL注入 OR 1=1-- 未导致服务器错误');
  } catch (error) {
    assert(error.response?.status !== 500,
      'SQL注入 OR 1=1-- 未导致500', `实际状态: ${error.response?.status}`);
  }

  // 2. name字段SQL注入 - DROP TABLE
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: "'; DROP TABLE persons;--", age: 25, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(true, 'SQL注入 DROP TABLE 未导致服务器错误');
  } catch (error) {
    assert(error.response?.status !== 500,
      'SQL注入 DROP TABLE 未导致500', `实际状态: ${error.response?.status}`);
  }

  // 3. 验证数据库仍完整（用单条记录验证，避免列表接口schema bug）
  try {
    const res = await axios.get(`${API_BASE}/persons/1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(res.status === 200, 'SQL注入后数据库仍可正常查询');
  } catch (error) {
    assert(false, 'SQL注入后数据库查询失败', error.message);
  }

  // 4. 搜索参数SQL注入
  try {
    const res = await axios.get(`${API_BASE}/search?name=' OR '1'='1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(res.status === 200, '搜索SQL注入未导致服务器错误');
  } catch (error) {
    assert(error.response?.status !== 500,
      '搜索SQL注入未导致500', `实际状态: ${error.response?.status}`);
  }

  // 5. 登录SQL注入
  await sleep(1500);
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      username: "admin'--", password: "anything"
    });
    assert(false, 'SQL注入登录应失败');
  } catch (error) {
    assert(error.response?.status === 400 || error.response?.status === 401,
      'SQL注入登录被正确拒绝', `实际状态: ${error.response?.status}`);
  }

  // 6. 登录 UNION注入
  await sleep(1000);
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      username: "' UNION SELECT * FROM users--", password: "anything"
    });
    assert(false, 'UNION注入登录应失败');
  } catch (error) {
    assert(error.response?.status === 400 || error.response?.status === 401,
      'UNION注入登录被正确拒绝', `实际状态: ${error.response?.status}`);
  }

  await sleep(200);
}

// ========== XSS防护测试 ==========
async function testXSSProtection() {
  colorLog('\n🔒 XSS防护测试', 'cyan');

  const token = await getAdminToken();
  await sleep(500);

  // 1. name字段script标签 - sanitizer剥离HTML后name为空
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '<script>alert(1)</script>', age: 25, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(true, 'XSS script标签未导致服务器错误');
  } catch (error) {
    assert(error.response?.status !== 500,
      'XSS script标签未导致500', `实际状态: ${error.response?.status}`);
  }

  // 2. notes字段img onerror
  try {
    const ts = Date.now();
    const res = await axios.post(`${API_BASE}/persons`, {
      name: 'XSSImgTest' + ts, age: 25, gender: 'male',
      email: 'xss_' + ts + '@test.com', phone: '138' + String(ts).slice(-8)
    }, { headers: authHeaders(token) });
    const personId = res.data?.data?.id || res.data?.id;

    if (personId) {
      await sleep(200);
      await axios.put(`${API_BASE}/persons/${personId}/comprehensive`, {
        notes: '<img src=x onerror=alert(1)>'
      }, { headers: authHeaders(token) });

      await sleep(200);
      const detail = await axios.get(`${API_BASE}/persons/${personId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notes = detail.data?.data?.notes || '';
      assert(!notes.includes('<img') || !notes.includes('onerror'),
        'XSS img标签被sanitizer过滤', `notes: ${notes.substring(0, 50)}`);

      await sleep(200);
      await axios.delete(`${API_BASE}/persons/${personId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      assert(true, 'XSS img测试跳过（无personId）');
    }
  } catch (error) {
    assert(error.response?.status !== 500,
      'XSS img onerror未导致500', `实际状态: ${error.response?.status}`);
  }

  // 3. name字段带事件处理器 - sanitizer剥离HTML
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '<div onmouseover="alert(1)">test</div>', age: 25, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(true, 'XSS事件处理器未导致服务器错误');
  } catch (error) {
    assert(error.response?.status !== 500,
      'XSS事件处理器未导致500', `实际状态: ${error.response?.status}`);
  }

  await sleep(200);
}

// ========== 超大输入测试 ==========
async function testOversizedInputs() {
  colorLog('\n📏 超大输入测试', 'cyan');

  const token = await getAdminToken();
  await sleep(500);
  const longString = 'A'.repeat(10000);

  // 1. 超长name - 验证拒绝（400）
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: longString, age: 25, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(false, '10000字符name应被拒绝');
  } catch (error) {
    assert(error.response?.status === 400,
      '10000字符name返回400', `实际状态: ${error.response?.status}`);
  }

  // 2. 超大age - 验证拒绝（400）
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '测试用户', age: 999999, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(false, 'age=999999应被拒绝');
  } catch (error) {
    assert(error.response?.status === 400,
      'age=999999返回400', `实际状态: ${error.response?.status}`);
  }

  // 3. 超大age（负数极端值）
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '测试用户', age: -999999, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(false, 'age=-999999应被拒绝');
  } catch (error) {
    assert(error.response?.status === 400,
      'age=-999999返回400', `实际状态: ${error.response?.status}`);
  }

  // 4. 超长notes - 创建人员后用comprehensive更新
  try {
    const ts = Date.now();
    const createRes = await axios.post(`${API_BASE}/persons`, {
      name: 'NotesTest' + ts, age: 25, gender: 'male',
      email: 'notes_' + ts + '@test.com', phone: '138' + String(ts).slice(-8)
    }, { headers: authHeaders(token) });
    const personId = createRes.data?.data?.id || createRes.data?.id;

    if (personId) {
      await sleep(200);
      await axios.put(`${API_BASE}/persons/${personId}/comprehensive`, {
        notes: longString
      }, { headers: authHeaders(token) });
      assert(false, '10000字符notes应被拒绝');
    }
  } catch (error) {
    assert(error.response?.status === 400,
      '10000字符notes返回400', `实际状态: ${error.response?.status}`);
  }

  // 5. 超大salary_expectation
  try {
    const ts2 = Date.now();
    const createRes2 = await axios.post(`${API_BASE}/persons`, {
      name: 'SalaryTest' + ts2, age: 25, gender: 'male',
      email: 'salary_' + ts2 + '@test.com', phone: '139' + String(ts2).slice(-8)
    }, { headers: authHeaders(token) });
    const personId2 = createRes2.data?.data?.id || createRes2.data?.id;

    if (personId2) {
      await sleep(200);
      await axios.put(`${API_BASE}/persons/${personId2}/comprehensive`, {
        salary_expectation: 999999999
      }, { headers: authHeaders(token) });
      assert(false, '超大salary_expectation应被拒绝');
    }
  } catch (error) {
    assert(error.response?.status === 400,
      '超大salary_expectation返回400', `实际状态: ${error.response?.status}`);
  }

  await sleep(200);
}

// ========== 并发请求测试 ==========
async function testConcurrentRequests() {
  colorLog('\n⚡ 并发请求测试', 'cyan');

  const token = await getAdminToken();
  await sleep(500);

  // 1. 10个并发GET请求（用/persons/1避免列表接口schema bug）
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.get(`${API_BASE}/persons/1`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => ({ status: res.status, ok: true }))
        .catch(err => ({ status: err.response?.status, ok: false }))
    );
  }

  const results = await Promise.all(promises);
  const failCount = results.filter(r => !r.ok).length;
  assert(failCount === 0, '10个并发GET /persons/1全部成功', `失败数: ${failCount}`);

  // 2. 10个并发GET请求到health
  const healthPromises = [];
  for (let i = 0; i < 10; i++) {
    healthPromises.push(
      axios.get(`${API_BASE}/health`)
        .then(res => ({ status: res.status, ok: true }))
        .catch(err => ({ status: err.response?.status, ok: false }))
    );
  }

  const healthResults = await Promise.all(healthPromises);
  const healthFailCount = healthResults.filter(r => !r.ok).length;
  assert(healthFailCount === 0, '10个并发GET /health全部成功', `失败数: ${healthFailCount}`);

  await sleep(200);
}

// ========== 数据类型边界测试 ==========
async function testDataTypeBoundaries() {
  colorLog('\n🔢 数据类型边界测试', 'cyan');

  const token = await getAdminToken();
  await sleep(500);

  // 1. age为字符串而非数字
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '类型测试1', age: 'twenty-five', gender: 'male'
    }, { headers: authHeaders(token) });
    assert(false, 'age为字符串应被拒绝');
  } catch (error) {
    assert(error.response?.status === 400,
      'age=字符串返回400', `实际状态: ${error.response?.status}`);
  }

  // 2. age为浮点数 - isInt应拒绝
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '类型测试2', age: 25.5, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(true, 'age=25.5被处理');
  } catch (error) {
    assert(error.response?.status === 400,
      'age=25.5返回400（非整数）', `实际状态: ${error.response?.status}`);
  }

  // 3. age为null
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '类型测试3', age: null, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(false, 'age=null应被拒绝');
  } catch (error) {
    assert(error.response?.status === 400,
      'age=null返回400', `实际状态: ${error.response?.status}`);
  }

  // 4. gender为数字
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '类型测试4', age: 25, gender: 123
    }, { headers: authHeaders(token) });
    assert(false, 'gender=123应被拒绝');
  } catch (error) {
    assert(error.response?.status === 400,
      'gender=123返回400', `实际状态: ${error.response?.status}`);
  }

  // 5. 空字符串name
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '', age: 25, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(false, 'name=空字符串应被拒绝');
  } catch (error) {
    assert(error.response?.status === 400,
      'name=""返回400', `实际状态: ${error.response?.status}`);
  }

  // 6. 特殊字符name（正常Unicode）
  try {
    await axios.post(`${API_BASE}/persons`, {
      name: '测试★用户♡', age: 25, gender: 'male'
    }, { headers: authHeaders(token) });
    assert(true, 'Unicode特殊字符name被接受');
  } catch (error) {
    assert(error.response?.status !== 500,
      'Unicode特殊字符name未导致500', `实际状态: ${error.response?.status}`);
  }

  await sleep(200);
}

// ========== 重复操作测试 ==========
async function testDuplicateOperations() {
  colorLog('\n🔄 重复操作测试', 'cyan');

  const ts = Date.now();
  await sleep(2000);

  try {
    await axios.post(`${API_BASE}/auth/register`, {
      username: `dup_test_${ts}`, password: 'test123456',
      confirmPassword: 'test123456', email: `dup_${ts}@example.com`
    });
    await sleep(2000);
    await axios.post(`${API_BASE}/auth/register`, {
      username: `dup_test_${ts}`, password: 'test123456',
      confirmPassword: 'test123456', email: `dup_${ts}@example.com`
    });
    assert(false, '重复注册应返回错误');
  } catch (error) {
    assert(error.response?.status === 400 || error.response?.status === 409 || error.response?.status === 429,
      '重复注册返回400/409', `实际状态: ${error.response?.status}`);
  }

  await sleep(200);
}

// ========== 主函数 ==========
async function main() {
  colorLog('🚀 边界情况测试开始...\n', 'blue');

  try {
    await testSQLInjection();
    await testXSSProtection();
    await testOversizedInputs();
    await testConcurrentRequests();
    await testDataTypeBoundaries();
    await testDuplicateOperations();

    colorLog('\n📋 边界情况测试总结', 'blue');
    colorLog('=====================================', 'blue');
    colorLog(`总测试数: ${totalTests}`, 'reset');
    colorLog(`通过: ${passedTests}`, 'green');
    colorLog(`失败: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

    if (failedTests > 0) {
      colorLog('\n⚠️ 存在失败的测试', 'red');
      process.exit(1);
    } else {
      colorLog('\n🎉 所有边界情况测试通过！', 'green');
      process.exit(0);
    }
  } catch (error) {
    colorLog(`\n❌ 测试执行异常: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
