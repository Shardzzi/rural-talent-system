<template>
  <div class="login-container">
    <div class="login-form">
      <div class="form-header">
        <div class="brand-icon">
          <el-icon :size="48"><HomeFilled /></el-icon>
        </div>
        <h2>{{ isRegister ? '用户注册' : '用户登录' }}</h2>
        <p class="subtitle">数字乡村人才信息系统</p>
      </div>

      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="formRules" 
        label-width="80px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="formData.username" 
            placeholder="请输入用户名"
            :prefix-icon="User"
            :disabled="loading"
            size="large"
          />
        </el-form-item>

        <el-form-item v-if="isRegister" label="邮箱" prop="email">
          <el-input 
            v-model="formData.email" 
            placeholder="请输入邮箱地址"
            :prefix-icon="Message"
            :disabled="loading"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="formData.password" 
            type="password" 
            placeholder="请输入密码"
            :prefix-icon="Lock"
            :disabled="loading"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item v-if="isRegister" label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="formData.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            :disabled="loading"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="handleSubmit"
            size="large"
            class="submit-btn"
          >
            {{ isRegister ? '注册' : '登录' }}
          </el-button>
        </el-form-item>

        <div class="form-footer">
          <el-button 
            type="text" 
            @click="toggleMode"
            :disabled="loading"
          >
            {{ isRegister ? '已有账号？立即登录' : '没有账号？立即注册' }}
          </el-button>
          
          <el-divider content-position="center">或</el-divider>
          
          <el-button 
            type="info" 
            plain 
            @click="enterAsGuest"
            :disabled="loading"
            size="large"
            class="guest-btn"
          >
            游客浏览
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- 管理员登录提示 -->
    <div class="admin-notice">
      <el-alert
        title="管理员登录"
        description="管理员请使用账号：admin，密码：admin123"
        type="info"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { HomeFilled, User, Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'LoginForm',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const formRef = ref(null)
    const loading = ref(false)
    const isRegister = ref(false)

    const formData = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })

    const formRules = computed(() => ({
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
      ],
      email: isRegister.value ? [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ] : [],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' },
        { 
          pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, 
          message: '密码必须包含至少一个字母和一个数字', 
          trigger: 'blur' 
        }
      ],
      confirmPassword: isRegister.value ? [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== formData.password) {
              callback(new Error('两次输入密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ] : []
    }))

    const resetForm = () => {
      formData.username = ''
      formData.email = ''
      formData.password = ''
      formData.confirmPassword = ''
      if (formRef.value) {
        formRef.value.clearValidate()
      }
    }

    const toggleMode = () => {
      isRegister.value = !isRegister.value
      resetForm()
    }

    const handleSubmit = async () => {
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
        loading.value = true

        if (isRegister.value) {
          await authStore.register(formData)
          ElMessage.success('注册成功，请登录')
          isRegister.value = false
          resetForm()
        } else {
          await authStore.login({
            username: formData.username,
            password: formData.password
          })
          
          ElMessage.success('登录成功')
          
          // 根据用户角色跳转到不同页面
          if (authStore.user?.role === 'admin') {
            router.push('/admin')
          } else {
            router.push('/user')
          }
        }
      } catch (error) {
        ElMessage.error(error.message || (isRegister.value ? '注册失败' : '登录失败'))
      } finally {
        loading.value = false
      }
    }

    const enterAsGuest = () => {
      authStore.setGuest()
      router.push('/guest')
    }

    return {
      formRef,
      loading,
      isRegister,
      formData,
      formRules,
      toggleMode,
      handleSubmit,
      enterAsGuest
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a3a5c 0%, #2c5f8a 40%, #3b8ccb 70%, #67C23A 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 60% 80%, rgba(255,255,255,0.06) 0%, transparent 45%);
  animation: bgFloat 20s ease-in-out infinite alternate;
}

@keyframes bgFloat {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-30px, -20px); }
}

.login-form {
  background: rgba(255, 255, 255, 0.95);
  padding: 48px 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.2);
  width: 100%;
  max-width: 420px;
  margin-bottom: 20px;
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;
  animation: formAppear 0.6s ease-out;
}

@keyframes formAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-header {
  text-align: center;
  margin-bottom: 36px;
}

.brand-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #1a3a5c, #3b8ccb);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(59, 140, 203, 0.3);
}

.form-header h2 {
  color: #1a3a5c;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 22px;
}

.subtitle {
  color: #8c939d;
  font-size: 14px;
  margin: 0;
  letter-spacing: 2px;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  letter-spacing: 2px;
}

.guest-btn {
  width: 100%;
}

.admin-notice {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

.admin-notice :deep(.el-alert) {
  border-radius: 10px;
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.9);
}

.el-divider {
  margin: 15px 0;
}

.el-form-item {
  margin-bottom: 22px;
}
</style>
