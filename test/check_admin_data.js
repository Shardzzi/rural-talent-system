// 检查管理员登录后的数据结构
const fetch = require('node-fetch');

async function checkAdminData() {
  try {
    // 登录
    const loginResponse = await fetch('http://localhost:8083/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    // 获取人员列表
    const response = await fetch('http://localhost:8083/api/persons', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    console.log('管理员登录后获取的第一个人员数据:');
    console.log(JSON.stringify(data.data[0], null, 2));
    
    console.log('\n字段检查:');
    console.log('是否有rural_profile:', !!data.data[0].rural_profile);
    console.log('是否有cooperation_intentions:', !!data.data[0].cooperation_intentions);
    console.log('是否有talent_skills:', !!data.data[0].talent_skills);
    
  } catch(error) {
    console.error('错误:', error.message);
  }
}

checkAdminData();
