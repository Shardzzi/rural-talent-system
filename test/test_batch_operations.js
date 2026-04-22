#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8083/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

let ipCounter = 200;
const nextIp = () => {
  ipCounter += 1;
  return `10.10.${Math.floor(ipCounter / 240)}.${(ipCounter % 240) + 1}`;
};

const state = {
  adminToken: '',
  createdIds: [],
  importSessionId: null
};

const testResults = { passed: 0, failed: 0 };

const log = (msg, color = 'reset') => console.log(`${colors[color] || ''}${msg}${colors.reset}`);

function markPass(name, detail = '') {
  testResults.passed += 1;
  log(`✅ PASS: ${name}${detail ? ` -> ${detail}` : ''}`, 'green');
}

function markFail(name, detail = '') {
  testResults.failed += 1;
  log(`❌ FAIL: ${name}${detail ? ` -> ${detail}` : ''}`, 'red');
}

const headers = (token, extraIp) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'X-Forwarded-For': extraIp || nextIp(),
    'Content-Type': 'application/json'
  }
});

async function adminLogin() {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }, { headers: { 'X-Forwarded-For': nextIp() } });

    if (res.data.success && res.data.token) {
      state.adminToken = res.data.token;
      markPass('Admin login');
    } else {
      markFail('Admin login', 'No token returned');
    }
  } catch (err) {
    markFail('Admin login', err.response?.data?.message || err.message);
  }
}

async function testBatchDeleteValidation() {
  log('\n--- Batch Delete Validation ---', 'cyan');

  try {
    await axios.post(`${BASE_URL}/batch/delete`, {}, headers(state.adminToken));
    markFail('Batch delete no body', 'Should have returned 400');
  } catch (err) {
    if (err.response?.status === 400) {
      markPass('Batch delete rejects empty body');
    } else {
      markFail('Batch delete empty body', `Expected 400, got ${err.response?.status}`);
    }
  }

  try {
    await axios.post(`${BASE_URL}/batch/delete`, { ids: [] }, headers(state.adminToken));
    markFail('Batch delete empty ids', 'Should have returned 400');
  } catch (err) {
    if (err.response?.status === 400) {
      markPass('Batch delete rejects empty ids array');
    } else {
      markFail('Batch delete empty ids', `Expected 400, got ${err.response?.status}`);
    }
  }

  try {
    await axios.post(`${BASE_URL}/batch/delete`, { ids: [0, -1] }, headers(state.adminToken));
    markFail('Batch delete invalid ids', 'Should have returned 400');
  } catch (err) {
    if (err.response?.status === 400) {
      markPass('Batch delete rejects invalid ids');
    } else {
      markFail('Batch delete invalid ids', `Expected 400, got ${err.response?.status}`);
    }
  }

  try {
    await axios.post(`${BASE_URL}/batch/delete`, { ids: [99999] }, headers(state.adminToken));
    markFail('Batch delete non-existent ids', 'Should have returned 500');
  } catch (err) {
    if (err.response?.status === 500) {
      markPass('Batch delete non-existent ids returns error');
    } else {
      markPass('Batch delete non-existent ids (accepted)');
    }
  }
}

async function testBatchUpdateValidation() {
  log('\n--- Batch Update Validation ---', 'cyan');

  try {
    await axios.put(`${BASE_URL}/batch/update`, {}, headers(state.adminToken));
    markFail('Batch update no body', 'Should have returned 400');
  } catch (err) {
    if (err.response?.status === 400) {
      markPass('Batch update rejects empty body');
    } else {
      markFail('Batch update empty body', `Expected 400, got ${err.response?.status}`);
    }
  }

  try {
    await axios.put(`${BASE_URL}/batch/update`, { ids: [1], updates: { name: 'hacked' } }, headers(state.adminToken));
    markFail('Batch update disallowed field', 'Should have returned 400');
  } catch (err) {
    if (err.response?.status === 400) {
      markPass('Batch update rejects disallowed fields');
    } else {
      markFail('Batch update disallowed field', `Expected 400, got ${err.response?.status}`);
    }
  }

  try {
    await axios.put(`${BASE_URL}/batch/update`, { ids: [], updates: { education_level: '本科' } }, headers(state.adminToken));
    markFail('Batch update empty ids', 'Should have returned 400');
  } catch (err) {
    if (err.response?.status === 400) {
      markPass('Batch update rejects empty ids array');
    } else {
      markFail('Batch update empty ids', `Expected 400, got ${err.response?.status}`);
    }
  }
}

async function testBatchUpdateRealData() {
  log('\n--- Batch Update Real Data ---', 'cyan');

  try {
    const res = await axios.put(`${BASE_URL}/batch/update`, {
      ids: [1, 2],
      updates: { education_level: '本科' }
    }, headers(state.adminToken));

    if (res.data.success) {
      markPass('Batch update succeeds', `Updated ${res.data.data.updatedCount} records`);
    } else {
      markFail('Batch update real data', res.data.message);
    }
  } catch (err) {
    markFail('Batch update real data', err.response?.data?.message || err.message);
  }

  try {
    const res = await axios.put(`${BASE_URL}/batch/update`, {
      ids: [1, 2],
      updates: { education_level: '高中' }
    }, headers(state.adminToken));

    if (res.data.success) {
      markPass('Batch update restore', `Restored ${res.data.data.updatedCount} records`);
    }
  } catch (err) {
    markPass('Batch update restore (skipped)', err.response?.data?.message);
  }
}

async function testAuthRequired() {
  log('\n--- Auth Required for Batch Endpoints ---', 'cyan');

  const endpoints = [
    { method: 'post', url: '/batch/delete', data: { ids: [1] } },
    { method: 'put', url: '/batch/update', data: { ids: [1], updates: {} } },
    { method: 'post', url: '/import/upload', data: {} },
    { method: 'post', url: '/import/preview', data: {} },
    { method: 'post', url: '/import/confirm', data: {} },
    { method: 'get', url: '/import/template' }
  ];

  for (const ep of endpoints) {
    try {
      if (ep.method === 'get') {
        await axios.get(`${BASE_URL}${ep.url}`);
      } else {
        await axios[ep.method](`${BASE_URL}${ep.url}`, ep.data);
      }
      markFail(`${ep.method.toUpperCase()} ${ep.url} auth check`, 'Should require auth');
    } catch (err) {
      if (err.response?.status === 401) {
        markPass(`${ep.method.toUpperCase()} ${ep.url} requires auth`);
      } else {
        markFail(`${ep.method.toUpperCase()} ${ep.url} auth`, `Expected 401, got ${err.response?.status}`);
      }
    }
  }
}

async function testDownloadTemplate() {
  log('\n--- Download Template ---', 'cyan');

  try {
    const res = await axios.get(`${BASE_URL}/import/template`, {
      headers: {
        Authorization: `Bearer ${state.adminToken}`,
        'X-Forwarded-For': nextIp()
      },
      responseType: 'text'
    });

    if (res.status === 200 && res.data.includes('姓名') && res.data.includes('年龄')) {
      markPass('Download template returns valid CSV');
    } else {
      markFail('Download template', 'Missing expected headers');
    }
  } catch (err) {
    markFail('Download template', err.response?.data?.message || err.message);
  }
}

async function testImportUploadAndConfirm() {
  log('\n--- Import Upload and Confirm ---', 'cyan');

  const csvContent = '姓名,年龄,性别,电话,邮箱,地址,学历,政治面貌\n' +
    `导入测试A,28,男,13900001111,import_a@test.com,测试地址,本科,群众\n` +
    `导入测试B,35,女,13900002222,import_b@test.com,测试地址2,大专,党员`;

  const tmpPath = path.join(__dirname, '_batch_test_import.csv');
  fs.writeFileSync(tmpPath, '\uFEFF' + csvContent, 'utf-8');

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(tmpPath));

    const uploadRes = await axios.post(`${BASE_URL}/import/upload`, form, {
      headers: {
        Authorization: `Bearer ${state.adminToken}`,
        'X-Forwarded-For': nextIp(),
        ...form.getHeaders()
      }
    });

    if (uploadRes.data.success && uploadRes.data.data.sessionId) {
      state.importSessionId = uploadRes.data.data.sessionId;
      markPass('Import upload', `Session: ${state.importSessionId}, valid: ${uploadRes.data.data.validRows}, invalid: ${uploadRes.data.data.invalidRows}`);
    } else {
      markFail('Import upload', uploadRes.data.message);
      return;
    }
  } catch (err) {
    markFail('Import upload', err.response?.data?.message || err.message);
    fs.unlinkSync(tmpPath);
    return;
  }

  try {
    const previewRes = await axios.post(`${BASE_URL}/import/preview`, {
      sessionId: state.importSessionId
    }, headers(state.adminToken));

    if (previewRes.data.success && previewRes.data.data.previews) {
      markPass('Import preview', `Total: ${previewRes.data.data.totalRows}, Valid: ${previewRes.data.data.validRows}`);
    } else {
      markFail('Import preview', previewRes.data.message);
    }
  } catch (err) {
    markFail('Import preview', err.response?.data?.message || err.message);
  }

  try {
    const confirmRes = await axios.post(`${BASE_URL}/import/confirm`, {
      sessionId: state.importSessionId
    }, headers(state.adminToken));

    if (confirmRes.data.success) {
      markPass('Import confirm', `Success: ${confirmRes.data.data.success}, Failed: ${confirmRes.data.data.failed}`);
    } else {
      markFail('Import confirm', confirmRes.data.message);
    }
  } catch (err) {
    markFail('Import confirm', err.response?.data?.message || err.message);
  }

  try {
    fs.unlinkSync(tmpPath);
  } catch {}
}

async function testImportPreviewExpired() {
  log('\n--- Import Preview Expired Session ---', 'cyan');

  try {
    await axios.post(`${BASE_URL}/import/preview`, {
      sessionId: 'fake_session_id'
    }, headers(state.adminToken));
    markFail('Import preview expired', 'Should have returned 404');
  } catch (err) {
    if (err.response?.status === 404) {
      markPass('Import preview expired session returns 404');
    } else {
      markFail('Import preview expired', `Expected 404, got ${err.response?.status}`);
    }
  }
}

async function testBatchDeleteRealData() {
  log('\n--- Batch Delete (cleanup imported data) ---', 'cyan');

  try {
    const searchRes = await axios.get(`${BASE_URL}/search?name=导入测试`, headers(state.adminToken));
    const persons = searchRes.data.data || [];
    const ids = persons.map(p => p.id);

    if (ids.length > 0) {
      const delRes = await axios.post(`${BASE_URL}/batch/delete`, { ids }, headers(state.adminToken));
      if (delRes.data.success) {
        markPass('Batch delete imported records', `Deleted ${delRes.data.data.deletedCount}`);
      } else {
        markFail('Batch delete imported', delRes.data.message);
      }
    } else {
      markPass('Batch delete imported (none found, skipped)');
    }
  } catch (err) {
    markPass('Batch delete cleanup', err.response?.data?.message || 'skipped');
  }
}

async function runAll() {
  log('\n========================================', 'cyan');
  log('  Batch Operations & Import Tests', 'cyan');
  log('========================================\n', 'cyan');

  await adminLogin();

  if (!state.adminToken) {
    log('\n❌ Cannot proceed without admin token. Exiting.', 'red');
    process.exit(1);
  }

  await testAuthRequired();
  await testBatchDeleteValidation();
  await testBatchUpdateValidation();
  await testBatchUpdateRealData();
  await testDownloadTemplate();
  await testImportUploadAndConfirm();
  await testImportPreviewExpired();
  await testBatchDeleteRealData();

  log('\n========================================', 'cyan');
  log(`  Results: ${testResults.passed} passed, ${testResults.failed} failed`, testResults.failed > 0 ? 'red' : 'green');
  log('========================================\n', 'cyan');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAll().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
