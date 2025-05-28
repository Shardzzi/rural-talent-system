<template>
  <div class="login-container">
    <div class="login-form">
      <div class="form-header">
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
            prefix-icon="el-icon-user"
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item v-if="isRegister" label="邮箱" prop="email">
          <el-input 
            v-model="formData.email" 
            placeholder="请输入邮箱地址"
            prefix-icon="el-icon-message"
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="formData.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            :disabled="loading"
            show-password
          />
        </el-form-item>

        <el-form-item v-if="isRegister" label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="formData.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
            prefix-icon="el-icon-lock"
            :disabled="loading"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="handleSubmit"
            style="width: 100%"
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
            style="width: 100%"
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
          
          // 调试：输出登录后的认证状态
          console.log('🎉 登录成功 - 认证状态:', {
            isAuthenticated: authStore.isAuthenticated,
            user: authStore.user,
            token: authStore.token ? '已设置' : '未设置'
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h2 {
  color: #333;
  margin-bottom: 10px;
  font-weight: 500;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}

.admin-notice {
  width: 100%;
  max-width: 400px;
}

.el-divider {
  margin: 15px 0;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-input {
  height: 40px;
}

.el-button {
  height: 40px;
}
</style>
