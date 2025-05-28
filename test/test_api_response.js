#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAPIResponse() {
    try {
        console.log('🔍 测试管理员登录和数据获取...\n');
        
        // 1. 管理员登录
        console.log('1. 管理员登录...');
        const loginResponse = await fetch('http://localhost:8083/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const loginData = await loginResponse.json();
        if (!loginData.success) {
            console.error('❌ 登录失败:', loginData.message);
            return;
        }
        
        const token = loginData.data.token;
        console.log('✅ 登录成功');
        
        // 2. 获取人员详细信息
        console.log('\n2. 获取人员详细信息 (ID: 1)...');
        const personResponse = await fetch('http://localhost:8083/api/persons/1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const personData = await personResponse.json();
        if (!personData.success) {
            console.error('❌ 获取人员信息失败:', personData.message);
            return;
        }
        
        const person = personData.data;
        console.log('✅ 获取成功\n');
        
        // 3. 分析数据结构
        console.log('=== 数据结构分析 ===');
        console.log('📊 基本信息字段:');
        console.log(`  - id: ${person.id}`);
        console.log(`  - name: ${person.name}`);
        console.log(`  - age: ${person.age}`);
        console.log(`  - gender: ${person.gender}`);
        console.log(`  - education_level: ${person.education_level}`);
        console.log(`  - address: ${person.address}`);
        console.log(`  - phone: ${person.phone}`);
        console.log(`  - email: ${person.email}`);
        
        console.log('\n🌾 农村特色信息:');
        if (person.rural_profile) {
            console.log('  存在农村特色信息:');
            Object.keys(person.rural_profile).forEach(key => {
                console.log(`    - ${key}: ${person.rural_profile[key]}`);
            });
        } else {
            console.log('  ❌ 无农村特色信息');
        }
        
        console.log('\n🤝 合作意向信息:');
        if (person.cooperation_intentions) {
            console.log('  存在合作意向信息:');
            Object.keys(person.cooperation_intentions).forEach(key => {
                console.log(`    - ${key}: ${person.cooperation_intentions[key]}`);
            });
        } else {
            console.log('  ❌ 无合作意向信息');
        }
        
        console.log('\n🛠️ 技能信息:');
        if (person.talent_skills && person.talent_skills.length > 0) {
            console.log(`  技能数量: ${person.talent_skills.length}`);
            person.talent_skills.forEach((skill, index) => {
                console.log(`    ${index + 1}. ${JSON.stringify(skill)}`);
            });
        } else {
            console.log('  ❌ 无技能信息');
        }
        
        // 4. 前端字段映射检查
        console.log('\n=== 前端字段映射检查 ===');
        console.log('🔍 检查前端期望的字段:');
        console.log(`  - person.education (前端期望) vs person.education_level (后端): ${person.education || '无'} vs ${person.education_level || '无'}`);
        console.log(`  - person.location (前端期望) vs person.address (后端): ${person.location || '无'} vs ${person.address || '无'}`);
        console.log(`  - person.skills (前端期望) vs person.talent_skills (后端): ${person.skills || '无'} vs ${person.talent_skills ? '数组' : '无'}`);
        
        console.log('\n✅ API响应测试完成');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testAPIResponse();
