// 测试新的权限控制系统
const fetch = require('node-fetch');

console.log('🧪 测试新的权限控制系统...\n');

async function testPermissions() {
  try {
    console.log('1. 测试游客访问（应该返回脱敏数据）');
    const guestResponse = await fetch('http://localhost:8083/api/persons');
    const guestData = await guestResponse.json();
    
    console.log('游客数据结构:');
    console.log('- 人员数量:', guestData.data?.length || 0);
    console.log('- 第一个人员字段:', Object.keys(guestData.data?.[0] || {}));
    console.log('- 是否有详细信息:', !!guestData.data?.[0]?.rural_profile);
    console.log('- 是否有完整地址:', guestData.data?.[0]?.address?.includes('...'));
    
    console.log('\n2. 测试管理员访问（应该返回完整详细数据）');
    
    // 登录管理员
    const loginResponse = await fetch('http://localhost:8083/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginResponse.json();
    const adminToken = loginData.data.token;
    
    // 管理员获取人员列表
    const adminResponse = await fetch('http://localhost:8083/api/persons', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminData = await adminResponse.json();
    
    console.log('管理员数据结构:');
    console.log('- 人员数量:', adminData.data?.length || 0);
    console.log('- 第一个人员字段:', Object.keys(adminData.data?.[0] || {}));
    console.log('- 是否有农村特色信息:', !!adminData.data?.[0]?.rural_profile);
    console.log('- 是否有合作意向:', !!adminData.data?.[0]?.cooperation_intentions);
    console.log('- 是否有技能信息:', !!adminData.data?.[0]?.talent_skills);
    console.log('- 技能数量:', adminData.data?.[0]?.talent_skills?.length || 0);
    console.log('- 完整联系方式:', adminData.data?.[0]?.phone);
    console.log('- 完整地址:', adminData.data?.[0]?.address);
    
    console.log('\n3. 权限对比');
    console.log('游客看到的字段数:', Object.keys(guestData.data?.[0] || {}).length);
    console.log('管理员看到的字段数:', Object.keys(adminData.data?.[0] || {}).length);
    
    if (adminData.data?.[0]?.rural_profile) {
      console.log('✅ 管理员可以看到农村特色信息');
    } else {
      console.log('❌ 管理员无法看到农村特色信息');
    }
    
    if (guestData.data?.[0]?.address?.includes('...')) {
      console.log('✅ 游客数据已正确脱敏');
    } else {
      console.log('❌ 游客数据脱敏有问题');
    }
    
    console.log('\n🎉 权限控制测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testPermissions();
