#!/usr/bin/env node

console.log('🔍 系统健康检查开始...\n');

const { execSync } = require('child_process');
const axios = require('axios');

// 检查服务端口是否在监听
function checkPort(port, serviceName) {
  try {
    const result = execSync(`netstat -tlnp 2>/dev/null | grep :${port} || ss -tlnp 2>/dev/null | grep :${port}`, 
      { encoding: 'utf8' });
    if (result.trim()) {
      console.log(`✅ ${serviceName} (端口 ${port}) 正在运行`);
      return true;
    } else {
      console.log(`❌ ${serviceName} (端口 ${port}) 未运行`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${serviceName} (端口 ${port}) 未运行`);
    return false;
  }
}

// 检查数据库连接和数据完整性
function checkDatabase() {
  try {
    console.log('\n📊 数据库健康检查');
    console.log('=====================================');
    
    // 检查数据库文件是否存在
    const dbPath = '../backend/data/persons.db';
    execSync(`test -f ${dbPath}`);
    console.log('✅ 数据库文件存在');
    
    // 检查主要表结构
    const tables = execSync(`cd ../backend && sqlite3 data/persons.db ".tables"`, 
      { encoding: 'utf8' }).trim().split(/\s+/);
    
    const expectedTables = ['persons', 'users', 'rural_talent_profile', 'cooperation_intentions', 'talent_skills'];
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ 所有必需的数据表都存在');
    } else {
      console.log(`❌ 缺少数据表: ${missingTables.join(', ')}`);
      return false;
    }
    
    // 检查数据记录数量
    const personCount = execSync(`cd ../backend && sqlite3 data/persons.db "SELECT COUNT(*) FROM persons;"`, 
      { encoding: 'utf8' }).trim();
    const userCount = execSync(`cd ../backend && sqlite3 data/persons.db "SELECT COUNT(*) FROM users;"`, 
      { encoding: 'utf8' }).trim();
    const ruralCount = execSync(`cd ../backend && sqlite3 data/persons.db "SELECT COUNT(*) FROM rural_talent_profile;"`, 
      { encoding: 'utf8' }).trim();
    
    console.log(`✅ 数据统计:`);
    console.log(`   - 人员信息: ${personCount} 条`);
    console.log(`   - 用户账户: ${userCount} 条`);
    console.log(`   - 农村特色信息: ${ruralCount} 条`);
    
    return true;
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
    return false;
  }
}

// 检查API端点是否可访问
async function checkAPIEndpoints() {
  console.log('\n🌐 API端点健康检查');
  console.log('=====================================');
  
  const baseURL = 'http://localhost:8083/api';
  const endpoints = [
    { path: '/persons', method: 'GET', name: '人员列表API' },
    { path: '/health', method: 'GET', name: '系统健康检查' }
  ];
  
  let allGood = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${baseURL}${endpoint.path}`,
        timeout: 5000
      });
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name} 正常响应`);
      } else {
        console.log(`⚠️ ${endpoint.name} 响应异常 (状态码: ${response.status})`);
        allGood = false;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${endpoint.name} 连接被拒绝 (后端服务未启动)`);
      } else {
        console.log(`❌ ${endpoint.name} 请求失败: ${error.message}`);
      }
      allGood = false;
    }
  }
  
  return allGood;
}

// 主检查函数
async function runHealthCheck() {
  let allChecksPass = true;
  
  // 1. 检查服务端口
  console.log('🚀 服务端口检查');
  console.log('=====================================');
  const backendRunning = checkPort(8083, '后端服务');
  const frontendRunning = checkPort(8081, '前端服务');
  
  if (!backendRunning || !frontendRunning) {
    allChecksPass = false;
  }
  
  // 2. 检查数据库
  const dbHealthy = checkDatabase();
  if (!dbHealthy) {
    allChecksPass = false;
  }
  
  // 3. 检查API端点 (仅在后端运行时)
  if (backendRunning) {
    const apiHealthy = await checkAPIEndpoints();
    if (!apiHealthy) {
      allChecksPass = false;
    }
  }
  
  // 总结报告
  console.log('\n📋 健康检查总结');
  console.log('=====================================');
  if (allChecksPass) {
    console.log('🎉 系统健康检查通过！所有组件正常运行。');
  } else {
    console.log('⚠️ 系统健康检查发现问题，请检查上述失败项目。');
  }
  
  console.log('\n💡 提示:');
  console.log('   - 如果服务未启动，请运行: pnpm run dev (在相应目录)');
  console.log('   - 如果API无响应，请检查后端服务状态');
  console.log('   - 如果数据库有问题，请检查 backend/data/persons.db 文件');
}

// 运行健康检查
runHealthCheck().catch(error => {
  console.error('\n❌ 健康检查执行失败:', error.message);
});
