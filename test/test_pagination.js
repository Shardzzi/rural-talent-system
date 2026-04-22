/**
 * 数据库服务层分页测试
 * 运行方式: node test/test_pagination.js
 */

const path = require('path');
const { createRequire } = require('module');

process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'Node'
});

const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));
backendRequire('ts-node/register/transpile-only');
const databaseService = backendRequire('./src/services/databaseService').default;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  total += 1;
  if (condition) {
    passed += 1;
    log(`✅ ${message}`, 'green');
  } else {
    failed += 1;
    log(`❌ ${message}`, 'red');
  }
}

function isSortedBy(items, field, order = 'asc') {
  for (let i = 1; i < items.length; i += 1) {
    const prev = items[i - 1]?.[field];
    const curr = items[i]?.[field];

    if (prev === undefined || curr === undefined || prev === null || curr === null) {
      continue;
    }

    const prevVal = typeof prev === 'string' ? prev.toString() : Number(prev);
    const currVal = typeof curr === 'string' ? curr.toString() : Number(curr);

    if (order === 'asc' && prevVal > currVal) {
      return false;
    }
    if (order === 'desc' && prevVal < currVal) {
      return false;
    }
  }
  return true;
}

async function run() {
  const createdIds = [];
  const uniquePrefix = `分页测试_${Date.now()}`;

  try {
    log('🚀 开始数据库服务层分页测试', 'blue');
    await databaseService.initDatabase();

    for (let i = 0; i < 25; i += 1) {
      const person = await databaseService.createPerson({
        name: `${uniquePrefix}_${String(i).padStart(2, '0')}`,
        age: 20 + (i % 10),
        gender: i % 2 === 0 ? '男' : '女',
        phone: `139${String(Date.now() + i).slice(-8)}`,
        email: `${uniquePrefix}_${i}@test.local`,
        address: `测试地址${i}`,
        education_level: i % 3 === 0 ? '本科' : (i % 3 === 1 ? '专科' : '高中')
      });
      createdIds.push(person.id);
    }

    const page1 = await databaseService.getAllPersonsPaginated({ page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' });
    assert(Array.isArray(page1.data), 'page1 返回 data 数组');
    assert(page1.page === 1, 'page1.page 正确');
    assert(page1.limit === 10, 'page1.limit 正确');
    assert(page1.data.length <= 10, 'page1 数据条数 <= 10');

    const page2 = await databaseService.getAllPersonsPaginated({ page: 2, limit: 10, sortBy: 'name', sortOrder: 'asc' });
    assert(page2.page === 2, 'page2.page 正确');
    assert(page2.data.length <= 10, 'page2 数据条数 <= 10');
    if (page1.data.length > 0 && page2.data.length > 0) {
      const sameFirst = page1.data[0].id === page2.data[0].id;
      assert(!sameFirst, 'page1 与 page2 返回不同子集');
    } else {
      assert(true, 'page1/page2 空结果场景允许');
    }

    const allPersons = await databaseService.getAllPersons();
    assert(page1.total === allPersons.length, '分页 total 与 getAllPersons 总数一致');
    assert(page1.totalPages === Math.ceil(page1.total / page1.limit), 'totalPages 计算正确');

    const searchPage = await databaseService.searchTalentsPaginated({
      name: uniquePrefix,
      page: 1,
      limit: 10,
      sortBy: 'created_at',
      sortOrder: 'asc'
    });
    assert(Array.isArray(searchPage.data), '搜索分页返回 data 数组');
    assert(searchPage.total >= 25, '搜索分页 total 正确（包含插入测试数据）');
    assert(searchPage.data.length <= 10, '搜索分页 limit 生效');
    if (searchPage.data.length > 0) {
      const allMatch = searchPage.data.every((p) => String(p.name || '').includes(uniquePrefix));
      assert(allMatch, '搜索分页结果符合筛选条件');
    } else {
      assert(false, '搜索分页应命中测试数据');
    }

    const beyondPage = await databaseService.getAllPersonsPaginated({ page: 9999, limit: 10, sortBy: 'created_at', sortOrder: 'asc' });
    assert(Array.isArray(beyondPage.data), '超范围页码返回数组');
    assert(beyondPage.data.length === 0, '超范围页码返回空数组');

    const limitOne = await databaseService.getAllPersonsPaginated({ page: 1, limit: 1, sortBy: 'created_at', sortOrder: 'asc' });
    assert(limitOne.limit === 1, 'limit=1 保持正确');
    assert(limitOne.data.length <= 1, 'limit=1 返回最多1条');

    const sortByAge = await databaseService.getAllPersonsPaginated({ page: 1, limit: 20, sortBy: 'age', sortOrder: 'asc' });
    assert(isSortedBy(sortByAge.data, 'age', 'asc'), '按 age asc 排序正确');

    const sortByNameDesc = await databaseService.getAllPersonsPaginated({ page: 1, limit: 20, sortBy: 'name', sortOrder: 'desc' });
    assert(isSortedBy(sortByNameDesc.data, 'name', 'desc'), '按 name desc 排序正确');

    const invalidSort = await databaseService.getAllPersonsPaginated({ page: 1, limit: 10, sortBy: 'not_allowed_column', sortOrder: 'asc' });
    const defaultSort = await databaseService.getAllPersonsPaginated({ page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'asc' });
    const sameIds = JSON.stringify(invalidSort.data.map((p) => p.id)) === JSON.stringify(defaultSort.data.map((p) => p.id));
    assert(sameIds, '非法 sortBy 自动回退到 created_at');

  } catch (error) {
    failed += 1;
    log(`❌ 测试执行异常: ${error.message}`, 'red');
    console.error(error);
  } finally {
    for (const id of createdIds) {
      try {
        await databaseService.deletePerson(id);
      } catch (_e) {
        // 清理失败不阻塞主流程
      }
    }

    log('='.repeat(50), 'blue');
    log(`总数: ${total} | 通过: ${passed} | 失败: ${failed}`, failed > 0 ? 'red' : 'green');
    log('='.repeat(50), 'blue');

    if (failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  }
}

run();
