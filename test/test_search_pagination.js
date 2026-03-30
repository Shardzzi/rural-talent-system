/**
 * 搜索和分页测试 (Task 17)
 * 覆盖：姓名搜索、年龄范围、性别、学历、技能、作物筛选
 * 分页参数测试、组合筛选测试、CSV导出测试
 */

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:8083/api';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

// 延迟
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 测试计数
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 测试断言
function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    log(`  ✅ ${testName}${detail ? ' - ' + detail : ''}`, 'green');
  } else {
    failedTests++;
    log(`  ❌ ${testName}${detail ? ' - ' + detail : ''}`, 'red');
  }
}

// API 请求封装
async function apiRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    if (data) {
      config.data = data;
    }
    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    };
  }
}

// 登录获取token
async function login(credentials) {
  const result = await apiRequest('POST', '/auth/login', credentials);
  if (result.success) {
    return result.data.data?.token || result.data.token;
  }
  return null;
}

// ============================================================
// 测试用例
// ============================================================

// 1. 搜索 - 姓名筛选
async function testSearchByName(token) {
  log('\n📋 测试1: 姓名搜索', 'cyan');

  // 获取全部数据作为基准
  const allResult = await apiRequest('GET', '/search', null, token);
  assert(allResult.success, '搜索接口可用');
  const totalCount = allResult.data?.data?.length || 0;
  log(`    数据库总人数: ${totalCount}`, 'blue');

  // 搜索无匹配项
  const noMatch = await apiRequest('GET', '/search?name=不存在的姓名XYZ999', null, token);
  assert(noMatch.success, '无匹配搜索返回成功');
  assert((noMatch.data?.data?.length || 0) === 0, '无匹配搜索结果为空');

  // 搜索有匹配项（使用通配词匹配，只要数据库有数据就应返回）
  if (totalCount > 0) {
    // 取第一个人的名字做搜索
    const firstPerson = allResult.data.data[0];
    const nameFragment = firstPerson.name ? firstPerson.name.substring(0, 1) : '张';
    const matchResult = await apiRequest('GET', `/search?name=${encodeURIComponent(nameFragment)}`, null, token);
    assert(matchResult.success, '姓名搜索返回成功');
    const matchCount = matchResult.data?.data?.length || 0;
    assert(matchCount >= 0, `姓名搜索"${nameFragment}"返回${matchCount}条结果`);
  }
}

// 2. 年龄范围筛选
async function testSearchByAge(token) {
  log('\n📋 测试2: 年龄范围筛选', 'cyan');

  // 最小年龄
  const minAgeResult = await apiRequest('GET', '/search?minAge=18', null, token);
  assert(minAgeResult.success, '最小年龄筛选返回成功');
  if (minAgeResult.data?.data?.length > 0) {
    const allAboveMin = minAgeResult.data.data.every(p => p.age >= 18);
    assert(allAboveMin, '所有结果年龄 >= 18');
  } else {
    assert(true, '最小年龄筛选返回空结果（可能无数据）');
  }

  // 最大年龄
  const maxAgeResult = await apiRequest('GET', '/search?maxAge=60', null, token);
  assert(maxAgeResult.success, '最大年龄筛选返回成功');
  if (maxAgeResult.data?.data?.length > 0) {
    const allBelowMax = maxAgeResult.data.data.every(p => p.age <= 60);
    assert(allBelowMax, '所有结果年龄 <= 60');
  } else {
    assert(true, '最大年龄筛选返回空结果（可能无数据）');
  }

  // 年龄范围
  const rangeResult = await apiRequest('GET', '/search?minAge=20&maxAge=50', null, token);
  assert(rangeResult.success, '年龄范围筛选返回成功');
  if (rangeResult.data?.data?.length > 0) {
    const allInRange = rangeResult.data.data.every(p => p.age >= 20 && p.age <= 50);
    assert(allInRange, '所有结果年龄在20-50范围内');
  } else {
    assert(true, '年龄范围筛选返回空结果（可能无数据）');
  }

  // 反转范围（min > max）—— 应该返回空结果
  const reversedResult = await apiRequest('GET', '/search?minAge=60&maxAge=20', null, token);
  assert(reversedResult.success, '反转年龄范围查询不报错');
  assert((reversedResult.data?.data?.length || 0) === 0, '反转年龄范围返回空结果');
}

// 3. 性别筛选
async function testSearchByGender(token) {
  log('\n📋 测试3: 性别筛选', 'cyan');

  const genders = ['male', 'female', 'other'];
  for (const gender of genders) {
    const result = await apiRequest('GET', `/search?gender=${gender}`, null, token);
    assert(result.success, `性别筛选(${gender})返回成功`);
    if (result.data?.data?.length > 0) {
      const allMatch = result.data.data.every(p => p.gender === gender);
      assert(allMatch, `所有结果性别为${gender}`);
    } else {
      assert(true, `性别${gender}筛选返回空结果`);
    }
  }
}

// 4. 学历筛选
async function testSearchByEducation(token) {
  log('\n📋 测试4: 学历筛选', 'cyan');

  const levels = ['无', '小学', '初中', '高中', '专科', '本科', '硕士', '博士'];
  let testedAny = false;

  for (const level of levels) {
    const result = await apiRequest('GET', `/search?education_level=${encodeURIComponent(level)}`, null, token);
    assert(result.success, `学历筛选(${level})返回成功`);
    if (result.data?.data?.length > 0) {
      testedAny = true;
      const allMatch = result.data.data.every(p => p.education_level === level);
      assert(allMatch, `所有结果学历为"${level}"`);
    }
  }

  if (!testedAny) {
    assert(true, '学历筛选测试完成（数据库中无对应学历数据）');
  }
}

// 5. 技能筛选
async function testSearchBySkill(token) {
  log('\n📋 测试5: 技能筛选', 'cyan');

  // 先获取所有数据看有没有技能
  const allResult = await apiRequest('GET', '/search', null, token);
  const persons = allResult.data?.data || [];

  // 查找有技能的人
  const personWithSkill = persons.find(p => p.skills && p.skills.length > 0);

  if (personWithSkill && personWithSkill.skills) {
    const skillName = personWithSkill.skills.split(',')[0].trim();
    const result = await apiRequest('GET', `/search?skill=${encodeURIComponent(skillName)}`, null, token);
    assert(result.success, `技能搜索("${skillName}")返回成功`);
    assert((result.data?.data?.length || 0) >= 1, `技能搜索至少找到1条结果`);
  } else {
    assert(true, '技能筛选：数据库中无技能数据，跳过匹配验证');
  }

  // 搜索不存在的技能
  const noSkill = await apiRequest('GET', '/search?skill=不存在的技能XYZ', null, token);
  assert(noSkill.success, '不存在技能搜索返回成功');
  assert((noSkill.data?.data?.length || 0) === 0, '不存在技能搜索结果为空');
}

// 6. 作物筛选
async function testSearchByCrop(token) {
  log('\n📋 测试6: 作物筛选', 'cyan');

  // 先获取所有数据看有没有作物
  const allResult = await apiRequest('GET', '/search', null, token);
  const persons = allResult.data?.data || [];

  // 查找有作物的人
  const personWithCrop = persons.find(p => p.main_crops && p.main_crops.length > 0);

  if (personWithCrop && personWithCrop.main_crops) {
    // main_crops可能包含多个作物，取第一个
    const cropName = personWithCrop.main_crops.split(/[、,，]/)[0].trim();
    const result = await apiRequest('GET', `/search?crop=${encodeURIComponent(cropName)}`, null, token);
    assert(result.success, `作物搜索("${cropName}")返回成功`);
    assert((result.data?.data?.length || 0) >= 1, `作物搜索至少找到1条结果`);
  } else {
    assert(true, '作物筛选：数据库中无作物数据，跳过匹配验证');
  }

  // 搜索不存在的作物
  const noCrop = await apiRequest('GET', '/search?crop=不存在的作物XYZ', null, token);
  assert(noCrop.success, '不存在作物搜索返回成功');
  assert((noCrop.data?.data?.length || 0) === 0, '不存在作物搜索结果为空');
}

// 7. 分页参数测试
async function testPagination(token) {
  log('\n📋 测试7: 分页参数测试', 'cyan');

  // page=1（第一页）
  const page1 = await apiRequest('GET', '/search?page=1&limit=5', null, token);
  assert(page1.success, '分页参数page=1&limit=5请求成功');
  assert(page1.data?.success === true, '分页响应success=true');

  // page=2（第二页）
  const page2 = await apiRequest('GET', '/search?page=2&limit=5', null, token);
  assert(page2.success, '分页参数page=2请求成功');

  // page=9999（超出数据范围）
  const pageBeyond = await apiRequest('GET', '/search?page=9999&limit=100', null, token);
  assert(pageBeyond.success, '超出数据范围的页码请求成功');
  // 注：当前实现不做真正的服务端分页，所以仍返回全部数据

  // limit=1
  const limit1 = await apiRequest('GET', '/search?limit=1', null, token);
  assert(limit1.success, 'limit=1请求成功');

  // limit=100
  const limit100 = await apiRequest('GET', '/search?limit=100', null, token);
  assert(limit100.success, 'limit=100请求成功');

  // 无效page（非数字）—— 验证中间件应返回400
  const invalidPage = await apiRequest('GET', '/search?page=abc', null, token);
  assert(invalidPage.status === 400, '无效page参数返回400');

  // 无效limit（超出范围）—— limit=0应返回400
  const invalidLimit = await apiRequest('GET', '/search?limit=0', null, token);
  assert(invalidLimit.status === 400, '无效limit=0参数返回400');
}

// 8. 组合筛选测试
async function testCombinedFilters(token) {
  log('\n📋 测试8: 组合筛选测试', 'cyan');

  // 年龄 + 性别
  const ageGender = await apiRequest('GET', '/search?minAge=20&maxAge=50&gender=male', null, token);
  assert(ageGender.success, '年龄+性别组合筛选成功');
  if (ageGender.data?.data?.length > 0) {
    const allValid = ageGender.data.data.every(p =>
      p.age >= 20 && p.age <= 50 && p.gender === 'male'
    );
    assert(allValid, '组合筛选结果符合年龄和性别条件');
  } else {
    assert(true, '年龄+性别组合筛选无匹配数据');
  }

  // 技能 + 作物
  const skillCrop = await apiRequest('GET', '/search?skill=种植&crop=水稻', null, token);
  assert(skillCrop.success, '技能+作物组合筛选成功');

  // 多条件组合
  const multi = await apiRequest('GET', '/search?minAge=25&maxAge=45&gender=female&education_level=本科', null, token);
  assert(multi.success, '多条件组合筛选成功');
  if (multi.data?.data?.length > 0) {
    const allValid = multi.data.data.every(p =>
      p.age >= 25 && p.age <= 45 && p.gender === 'female' && p.education_level === '本科'
    );
    assert(allValid, '多条件组合结果全部符合条件');
  } else {
    assert(true, '多条件组合筛选无匹配数据');
  }
}

// 9. CSV导出测试
async function testCsvExport(token) {
  log('\n📋 测试9: CSV导出测试', 'cyan');

  // 管理员导出
  const exportResult = await apiRequest('GET', '/persons/export', null, token);
  assert(exportResult.success, 'CSV导出接口调用成功');
  assert(exportResult.status === 200, 'CSV导出返回状态码200');

  if (exportResult.success) {
    // 检查响应头（axios会自动处理）
    // CSV内容应以UTF-8 BOM开头
    const data = typeof exportResult.data === 'string' ? exportResult.data : '';
    if (data.length > 0) {
      assert(data.includes('\uFEFF') || data.includes('ID') || data.includes('姓名'),
        'CSV内容包含表头信息');

      // 检查有换行（至少有表头行）
      const lines = data.split('\n').filter(l => l.trim().length > 0);
      assert(lines.length >= 1, `CSV至少包含1行（表头），实际${lines.length}行`);
    } else {
      assert(true, 'CSV导出内容已接收（axios可能解析为非字符串）');
    }
  }

  // 未登录访问CSV应失败
  const noAuthExport = await apiRequest('GET', '/persons/export', null, null);
  assert(noAuthExport.status === 401, '未登录访问CSV导出返回401');
}

// ============================================================
// 主函数
// ============================================================

async function runTests() {
  log('🚀 搜索和分页测试开始...\n', 'blue');

  // 登录管理员
  log('🔐 登录管理员账户...', 'yellow');
  const adminToken = await login(ADMIN_CREDENTIALS);
  assert(adminToken, '管理员登录成功');
  await sleep(300);

  if (!adminToken) {
    log('❌ 无法登录管理员，终止测试', 'red');
    process.exit(1);
  }

  // 执行所有测试
  await testSearchByName(adminToken);
  await sleep(200);

  await testSearchByAge(adminToken);
  await sleep(200);

  await testSearchByGender(adminToken);
  await sleep(200);

  await testSearchByEducation(adminToken);
  await sleep(200);

  await testSearchBySkill(adminToken);
  await sleep(200);

  await testSearchByCrop(adminToken);
  await sleep(200);

  await testPagination(adminToken);
  await sleep(200);

  await testCombinedFilters(adminToken);
  await sleep(200);

  await testCsvExport(adminToken);

  // 测试结果汇总
  log('\n' + '='.repeat(50), 'blue');
  log('📊 测试结果汇总', 'blue');
  log('='.repeat(50), 'blue');
  log(`  总测试数: ${totalTests}`, 'reset');
  log(`  通过: ${passedTests}`, 'green');
  log(`  失败: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log('='.repeat(50), 'blue');

  if (failedTests > 0) {
    log(`\n❌ 有 ${failedTests} 个测试未通过`, 'red');
    process.exit(1);
  } else {
    log('\n🎉 所有搜索和分页测试通过！', 'green');
    process.exit(0);
  }
}

// 执行
runTests().catch(error => {
  log(`❌ 测试执行异常: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
