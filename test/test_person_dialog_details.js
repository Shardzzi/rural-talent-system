// 测试PersonDetailDialog详细信息显示
const fetch = require('node-fetch');

console.log('🧪 测试PersonDetailDialog详细信息展示...\n');

async function testPersonDialog() {
  try {
    console.log('1. 获取第一个人员的ID');
    
    // 登录管理员
    const loginResponse = await fetch('http://localhost:8083/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginResponse.json();
    const adminToken = loginData.data.token;
    
    // 管理员获取人员列表
    const personsResponse = await fetch('http://localhost:8083/api/persons', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const personsData = await personsResponse.json();
    
    if (!personsData.data || personsData.data.length === 0) {
      throw new Error('没有找到人员数据');
    }
    
    const firstPerson = personsData.data[0];
    console.log(`- 获取到人员: ${firstPerson.name} (ID: ${firstPerson.id})`);
    
    // 测试getPersonDetails接口 - 这是PersonDetailDialog使用的接口
    console.log('\n2. 测试getPersonDetails接口');
    const detailsResponse = await fetch(`http://localhost:8083/api/persons/${firstPerson.id}/details`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const detailsData = await detailsResponse.json();
    
    console.log('详情接口返回数据:');
    console.log('- 成功状态:', detailsData.success);
    console.log('- 农村特色信息:', detailsData.data.ruralProfile ? '存在' : '不存在');
    if (detailsData.data.ruralProfile) {
      console.log('  - 主要作物:', detailsData.data.ruralProfile.main_crops);
      console.log('  - 养殖类型:', detailsData.data.ruralProfile.breeding_types);
      console.log('  - 合作意愿:', detailsData.data.ruralProfile.cooperation_willingness);
    }
    
    console.log('- 技能信息:', detailsData.data.skills ? `${detailsData.data.skills.length}个技能` : '不存在');
    if (detailsData.data.skills && detailsData.data.skills.length > 0) {
      console.log('  - 第一个技能:', detailsData.data.skills[0].skill_name);
    }
    
    console.log('- 合作意向:', detailsData.data.cooperation ? '存在' : '不存在');
    if (detailsData.data.cooperation) {
      console.log('  - 合作类型:', detailsData.data.cooperation.cooperation_type);
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testPersonDialog();
