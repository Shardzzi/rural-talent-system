const axios = require('axios');

// 测试 Shard 用户登录和个人信息关联
async function testShardLogin() {
    try {
        console.log('=== 测试 Shard 用户登录 ===');
        
        // 1. 登录 Shard 用户
        const loginResponse = await axios.post('http://localhost:8083/api/auth/login', {
            username: 'Shard',
            password: 'Zqclfk123'
        });
        
        console.log('登录响应状态:', loginResponse.status);
        console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
        
        const { token, user } = loginResponse.data.data;
        
        // 2. 检查用户数据中的 personId
        console.log('\n=== 用户数据分析 ===');
        console.log('用户ID:', user.id);
        console.log('用户名:', user.username);
        console.log('邮箱:', user.email);
        console.log('角色:', user.role);
        console.log('personId (camelCase):', user.personId);
        console.log('person_id (snake_case):', user.person_id);
        
        // 3. 如果有 personId，获取个人信息
        if (user.personId) {
            console.log('\n=== 获取个人信息 (使用 personId) ===');
            const personResponse = await axios.get(`http://localhost:8083/api/persons/${user.personId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('个人信息响应状态:', personResponse.status);
            console.log('个人信息数据:', JSON.stringify(personResponse.data, null, 2));
        }
        
        // 4. 如果有 person_id，也尝试获取个人信息
        if (user.person_id) {
            console.log('\n=== 获取个人信息 (使用 person_id) ===');
            const personResponse = await axios.get(`http://localhost:8083/api/persons/${user.person_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('个人信息响应状态:', personResponse.status);
            console.log('个人信息数据:', JSON.stringify(personResponse.data, null, 2));
        }
        
        // 5. 测试获取所有人员列表
        console.log('\n=== 获取人员列表 ===');
        const personsResponse = await axios.get('http://localhost:8083/api/persons', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('人员列表响应状态:', personsResponse.status);
        console.log('人员列表数据结构:', JSON.stringify(personsResponse.data, null, 2));
        
        // 查找李五的记录 - 需要处理不同的响应格式
        let liwuRecord = null;
        if (personsResponse.data && personsResponse.data.data && Array.isArray(personsResponse.data.data)) {
            liwuRecord = personsResponse.data.data.find(person => person.name === '李五');
        } else if (Array.isArray(personsResponse.data)) {
            liwuRecord = personsResponse.data.find(person => person.name === '李五');
        }
        if (liwuRecord) {
            console.log('找到李五的记录:', JSON.stringify(liwuRecord, null, 2));
        } else {
            console.log('未找到李五的记录');
        }
        
    } catch (error) {
        console.error('测试失败:', error.response?.data || error.message);
    }
}

testShardLogin();
