<template>
  <div class="login-container">
    <button type="button" class="back-home" @click="$router.push('/')">
      <span aria-hidden="true">←</span>
      返回人才库
    </button>

    <div class="login-shell">
      <section class="login-story">
        <div class="story-brand">
          <span class="brand-mark">
            <el-icon :size="24"><HomeFilled /></el-icon>
          </span>
          <span class="brand-copy">
            <strong>乡村人才</strong>
            <small>RURAL TALENT NETWORK</small>
          </span>
        </div>

        <div class="story-content">
          <span class="story-eyebrow">连接乡土智慧</span>
          <h1>让每一份乡土经验，<em>被看见，也被连接。</em></h1>
          <p>从人才发现、信息管理到合作对接，用可信数据服务乡村发展。</p>

          <div class="story-features">
            <div class="story-feature">
              <span class="feature-number">01</span>
              <div>
                <strong>人才一库汇聚</strong>
                <small>多维档案，持续更新</small>
              </div>
            </div>
            <div class="story-feature">
              <span class="feature-number">02</span>
              <div>
                <strong>能力精准发现</strong>
                <small>组合筛选，快速触达</small>
              </div>
            </div>
          </div>
        </div>

        <div class="story-footer">
          <span></span>
          可信数据 · 精准连接 · 共建共享
        </div>
      </section>

      <section class="login-panel">
        <div class="login-form">
          <div class="form-header">
            <span class="form-kicker">{{ isRegister ? 'CREATE ACCOUNT' : 'WELCOME BACK' }}</span>
            <h2>{{ isRegister ? '创建您的平台账号' : '欢迎回来' }}</h2>
            <p>{{ isRegister ? '加入乡村人才协作网络' : '登录后继续管理和发现乡村人才' }}</p>
          </div>

          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-position="top"
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

            <el-form-item class="submit-item">
              <el-button
                type="primary"
                native-type="submit"
                :loading="loading"
                @click="handleSubmit"
                size="large"
                class="submit-btn"
              >
                {{ isRegister ? '完成注册' : '登录平台' }}
              </el-button>
            </el-form-item>

            <div class="form-footer">
              <div class="mode-switch">
                <span>{{ isRegister ? '已经有账号？' : '第一次来到这里？' }}</span>
                <el-button link type="primary" @click="toggleMode" :disabled="loading">
                  {{ isRegister ? '返回登录' : '创建账号' }}
                </el-button>
              </div>

              <el-divider content-position="center">或</el-divider>

              <el-button
                plain
                @click="enterAsGuest"
                :disabled="loading"
                size="large"
                class="guest-btn"
              >
                先以游客身份浏览
              </el-button>
            </div>
          </el-form>
        </div>

        <div class="admin-notice" v-if="!isRegister">
          <el-alert
            title="演示管理员账号"
            description="账号：admin / 密码：admin123"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
        <p class="privacy-note">登录即表示您同意平台按规范保护并使用相关信息</p>
      </section>
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
  display: grid;
  place-items: center;
  padding: 40px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 8%, rgba(215, 161, 79, 0.16), transparent 22rem),
    radial-gradient(circle at 96% 92%, rgba(35, 98, 74, 0.1), transparent 28rem),
    var(--color-bg-page);
}

.login-container::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(35, 98, 74, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(35, 98, 74, 0.025) 1px, transparent 1px);
  background-size: 36px 36px;
}

.back-home {
  position: absolute;
  top: 28px;
  left: 32px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 10px 14px;
  color: var(--color-text-regular);
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(255, 254, 251, 0.76);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-home:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-light-5);
  transform: translateX(-2px);
}

.login-shell {
  width: 100%;
  max-width: 1080px;
  min-height: 660px;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.95fr);
  position: relative;
  z-index: 1;
  overflow: hidden;
  border: 1px solid rgba(35, 98, 74, 0.11);
  border-radius: 30px 30px 30px 10px;
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.login-story {
  display: flex;
  flex-direction: column;
  padding: 46px 52px 42px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 92%, rgba(215, 161, 79, 0.2), transparent 22rem),
    var(--color-sidebar);
}

.login-story::after {
  content: '';
  width: 320px;
  height: 320px;
  position: absolute;
  right: -160px;
  top: -120px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 44% 56% 42% 58%;
  box-shadow:
    0 0 0 42px rgba(255, 255, 255, 0.022),
    0 0 0 86px rgba(255, 255, 255, 0.016);
  transform: rotate(18deg);
}

.story-brand {
  display: flex;
  align-items: center;
  gap: 13px;
  position: relative;
  z-index: 1;
}

.brand-mark {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-sidebar-deep);
  border-radius: 14px 14px 14px 5px;
  background: var(--color-accent);
}

.brand-copy {
  display: flex;
  flex-direction: column;
}

.brand-copy strong {
  font-size: 17px;
  letter-spacing: 0.08em;
}

.brand-copy small {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.story-content {
  margin: auto 0;
  position: relative;
  z-index: 1;
}

.story-eyebrow,
.form-kicker {
  color: var(--color-accent);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.22em;
}

.story-content h1 {
  max-width: 500px;
  margin: 20px 0;
  font-size: clamp(38px, 3.4vw, 52px);
  font-weight: 720;
  line-height: 1.24;
  letter-spacing: -0.045em;
}

.story-content h1 em {
  display: block;
  color: #edc985;
  font-style: normal;
}

.story-content > p {
  max-width: 450px;
  margin: 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 15px;
  line-height: 1.8;
}

.story-features {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 36px;
}

.story-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.045);
}

.feature-number {
  color: var(--color-accent);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18px;
}

.story-feature strong,
.story-feature small {
  display: block;
}

.story-feature strong {
  font-size: 12px;
}

.story-feature small {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 10px;
}

.story-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.story-footer span {
  width: 28px;
  height: 1px;
  background: var(--color-accent);
}

.login-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 44px 52px 32px;
  background: var(--color-surface);
}

.login-form {
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
}

.form-header {
  margin-bottom: 28px;
}

.form-header h2 {
  margin: 9px 0 7px;
  color: var(--color-text-primary);
  font-size: 28px;
  font-weight: 720;
  letter-spacing: -0.03em;
}

.form-header p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.login-form :deep(.el-form-item__label) {
  margin-bottom: 6px;
  color: var(--color-text-regular);
  font-size: 12px;
  font-weight: 650;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  padding: 0 14px;
  background: var(--color-surface-soft);
}

.submit-item {
  margin-top: 8px;
  margin-bottom: 14px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
  border-radius: 12px;
  letter-spacing: 0.08em;
}

.guest-btn {
  width: 100%;
  height: 44px;
  color: var(--color-text-regular);
  border-color: var(--color-border);
  background: transparent;
}

.form-footer {
  text-align: center;
}

.mode-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.admin-notice {
  width: 100%;
  max-width: 390px;
  margin: 20px auto 0;
}

.admin-notice :deep(.el-alert) {
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background: var(--color-surface-soft);
}

.admin-notice :deep(.el-alert__title) {
  color: var(--color-text-regular);
  font-size: 12px;
}

.admin-notice :deep(.el-alert__description) {
  color: var(--color-text-secondary);
  font-size: 11px;
}

.privacy-note {
  margin: 18px 0 0;
  color: var(--color-text-placeholder);
  font-size: 10px;
  text-align: center;
}

.el-divider {
  margin: 14px 0;
}

.el-form-item {
  margin-bottom: 18px;
}

@media (max-width: 900px) {
  .login-container {
    padding: 80px 20px 28px;
    overflow: auto;
  }

  .login-shell {
    max-width: 560px;
    grid-template-columns: 1fr;
    border-radius: 24px 24px 24px 8px;
  }

  .login-story {
    min-height: auto;
    padding: 28px;
  }

  .story-content {
    margin: 52px 0 34px;
  }

  .story-content h1 {
    font-size: 38px;
  }

  .story-features {
    display: none;
  }

  .login-panel {
    padding: 36px 28px 26px;
  }
}

@media (max-width: 520px) {
  .login-container {
    padding: 70px 12px 16px;
  }

  .back-home {
    top: 16px;
    left: 16px;
  }

  .login-story {
    padding: 24px 22px;
  }

  .story-content {
    margin: 36px 0 26px;
  }

  .story-content h1 {
    margin: 14px 0;
    font-size: 31px;
  }

  .story-content > p {
    font-size: 13px;
  }

  .login-panel {
    padding: 30px 22px 22px;
  }

  .form-header h2 {
    font-size: 24px;
  }
}
</style>
