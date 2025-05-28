// 登录状态测试脚本
// 在浏览器控制台运行此脚本来测试认证状态

console.log('🔍 开始测试认证状态...');

// 测试1: 检查当前认证状态
function checkAuthStatus() {
  const authStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.appContext?.app?.config?.globalProperties?.$pinia?.state?.value?.auth;
  
  if (authStore) {
    console.log('✅ AuthStore状态:', {
      isAuthenticated: authStore.isAuthenticated,
      token: authStore.token ? '已设置' : '未设置',
      user: authStore.user,
      isGuest: authStore.isGuest
    });
  } else {
    console.log('❌ 无法获取AuthStore状态');
  }
}

// 测试2: 检查localStorage
function checkLocalStorage() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('📦 LocalStorage状态:', {
    token: token ? '已设置' : '未设置',
    user: user ? JSON.parse(user) : '未设置'
  });
}

// 测试3: 检查DOM元素
function checkButtonDisplay() {
  const loginBtn = document.querySelector('button:contains("登录/注册")');
  const dashboardBtn = document.querySelector('button:contains("进入")');
  
  console.log('🔘 按钮显示状态:', {
    loginButton: loginBtn ? '显示' : '隐藏',
    dashboardButton: dashboardBtn ? '显示' : '隐藏'
  });
}

// 运行所有测试
checkAuthStatus();
checkLocalStorage();
checkButtonDisplay();

console.log('✨ 测试完成！');
