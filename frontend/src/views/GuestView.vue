<template>
  <div class="guest-view">
    <!-- 认证状态调试面板 -->
    <AuthDebugPanel />
    
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <h1>数字乡村人才信息系统</h1>
        <p>汇聚乡村人才，助力乡村振兴</p>
        <div class="banner-actions">
          <el-button v-if="!authStore.isAuthenticated" type="primary" size="large" @click="goToLogin">
            <el-icon><User /></el-icon>
            登录/注册
          </el-button>
          <el-button v-if="authStore.isAuthenticated" type="success" size="large" @click="goToDashboard">
            <el-icon><User /></el-icon>
            进入{{ authStore.user?.role === 'admin' ? '管理' : '用户' }}中心
          </el-button>
          <el-button size="large" @click="scrollToContent">
            <el-icon><ArrowDown /></el-icon>
            浏览人才
          </el-button>
        </div>
      </div>
      <div class="banner-stats">
        <div class="stat-item">
          <div class="stat-number">{{ totalPersons }}</div>
          <div class="stat-label">人才总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ skillCategories }}</div>
          <div class="stat-label">技能类别</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ locations }}</div>
          <div class="stat-label">覆盖地区</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content" ref="contentRef">
      <!-- 搜索和筛选区域 -->
      <el-card class="search-card">
        <div class="search-header">
          <h3>
            <el-icon><Search /></el-icon>
            发现人才
          </h3>
          <p>搜索和筛选适合的乡村人才</p>
        </div>
        
        <div class="search-form">
          <el-row :gutter="16" align="middle">
            <el-col :xs="24" :sm="12" :md="8">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索姓名、技能、地区"
                size="large"
                clearable
                @clear="debouncedSearch"
                @input="debouncedSearch"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :xs="12" :sm="6" :md="4">
              <el-input-number
                v-model="filterMinAge"
                :min="1"
                :max="150"
                placeholder="最小年龄"
                size="large"
                controls-position="right"
                clearable
                style="width: 100%"
                @change="debouncedSearch"
              />
            </el-col>
            <el-col :xs="12" :sm="6" :md="4">
              <el-input-number
                v-model="filterMaxAge"
                :min="1"
                :max="150"
                placeholder="最大年龄"
                size="large"
                controls-position="right"
                clearable
                style="width: 100%"
                @change="debouncedSearch"
              />
            </el-col>
            <el-col :xs="12" :sm="6" :md="4">
              <el-select 
                v-model="filterEducation" 
                placeholder="学历筛选" 
                size="large" 
                clearable
                style="width: 100%"
                @change="debouncedSearch"
                @clear="debouncedSearch"
              >
                <el-option label="高中及以下" value="高中及以下" />
                <el-option label="专科" value="专科" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士及以上" value="硕士及以上" />
              </el-select>
            </el-col>
            <el-col :xs="12" :sm="6" :md="4">
              <el-select 
                v-model="filterStatus" 
                placeholder="就业状态" 
                size="large" 
                clearable
                style="width: 100%"
                @change="debouncedSearch"
                @clear="debouncedSearch"
              >
                <el-option label="在岗" value="在岗" />
                <el-option label="求职中" value="求职中" />
                <el-option label="已退休" value="已退休" />
              </el-select>
            </el-col>
          </el-row>
          <el-row :gutter="16" align="middle" style="margin-top: 12px;">
            <el-col :xs="24" :sm="8">
              <el-input
                v-model="filterSkill"
                placeholder="技能关键词"
                size="large"
                clearable
                @clear="debouncedSearch"
                @input="debouncedSearch"
              >
                <template #prefix>
                  <el-icon><Star /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-input
                v-model="filterCrop"
                placeholder="作物筛选（如：水稻、小麦）"
                size="large"
                clearable
                @clear="debouncedSearch"
                @input="debouncedSearch"
              >
                <template #prefix>
                  <el-icon><Location /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :xs="24" :sm="8">
              <div class="search-buttons">
                <el-button type="primary" size="large" @click="handleSearch">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button size="large" @click="resetFilters">重置</el-button>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 人才列表 -->
      <el-card class="talents-card">
        <template #header>
          <div class="card-header">
            <span>
              <el-icon><User /></el-icon>
              人才信息 
              <el-tag type="info" size="small">共 {{ totalCount }} 人</el-tag>
            </span>
            <el-button type="text" @click="loadPersons">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <PersonTable
          :data="paginatedPersons"
          role="guest"
          :loading="loading"
          :total="totalCount"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[9, 18, 36, 72]"
          pagination-layout="total, sizes, prev, pager, next"
          @page-change="handleCurrentChange"
          @size-change="handleSizeChange"
          @row-click="viewTalentDetail"
        />
      </el-card>

      <!-- 登录提示卡片 - 只在游客模式下显示 -->
      <el-card class="login-prompt-card" v-if="!authStore.isAuthenticated">
        <div class="login-prompt">
          <el-icon class="prompt-icon"><Lock /></el-icon>
          <div class="prompt-content">
            <h3>想要了解更多？</h3>
            <p>登录后可以查看完整的联系方式，还可以添加和管理您自己的人才信息。</p>
            <el-button type="primary" @click="goToLogin">
              <el-icon><User /></el-icon>
              立即登录/注册
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 人才详情对话框 -->
    <PersonDetailDialog
      v-model="showDetailDialog"
      :person="selectedPerson"
      :is-guest-mode="true"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Search, 
  ArrowDown,
  Location,
  Star, 
  Lock, 
  Refresh 
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import PersonDetailDialog from '../components/PersonDetailDialog.vue'
import AuthDebugPanel from '../components/AuthDebugPanel.vue'
import PersonTable from '../components/person-table/PersonTable.vue'

export default {
  name: 'GuestView',
  components: {
    PersonDetailDialog,
    AuthDebugPanel,
    PersonTable,
    User,
    Search,
    ArrowDown,
    Location,
    Star,
    Lock,
    Refresh
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const contentRef = ref(null)
    
    // 响应式数据
    const loading = ref(false)
    const persons = ref([])
    const showDetailDialog = ref(false)
    const selectedPerson = ref(null)
    const globalStats = ref({ skills: 0, locations: 0 })
    
    // 搜索和筛选
    const searchKeyword = ref('')
    const filterEducation = ref('')
    const filterStatus = ref('')
    const filterMinAge = ref(undefined)
    const filterMaxAge = ref(undefined)
    const filterSkill = ref('')
    const filterCrop = ref('')
    // 分页
    const currentPage = ref(1)
    const pageSize = ref(9)
    const totalCount = ref(0)
    
    // 计算属性
    const totalPersons = computed(() => totalCount.value)
    
    const skillCategories = computed(() => {
      // 如果后端没有返回统计数据，就从当前列表计算
      if (globalStats.value.skills > 0) return globalStats.value.skills
      const skills = new Set()
      persons.value.forEach(person => {
        if (person.skills) {
          person.skills.split(/[,，、]/).forEach(skill => {
            skills.add(skill.trim())
          })
        }
      })
      return skills.size
    })
    
    const locations = computed(() => {
      if (globalStats.value.locations > 0) return globalStats.value.locations
      const locs = new Set()
      persons.value.forEach(person => {
        if (person.address) {
          locs.add(person.address)
        }
      })
      return locs.size
    })
    
    const paginatedPersons = computed(() => {
      return persons.value
    })
    
    // 方法
    const goToLogin = () => {
      router.push('/login')
    }
    
    const goToDashboard = () => {
      if (authStore.user?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/user')
      }
    }
    
    const scrollToContent = () => {
      contentRef.value?.scrollIntoView({ behavior: 'smooth' })
    }
    
    const loadPersons = async () => {
      loading.value = true
      try {
        // 构建搜索参数
        const params = {
          page: currentPage.value,
          limit: pageSize.value
        }
        if (searchKeyword.value) params.keyword = searchKeyword.value
        if (filterStatus.value) params.employment_status = filterStatus.value
        if (filterMinAge.value) params.minAge = filterMinAge.value
        if (filterMaxAge.value) params.maxAge = filterMaxAge.value
        if (filterEducation.value) {
          // 只传递精确匹配的学历
          if (['专科', '本科'].includes(filterEducation.value)) {
            params.education_level = filterEducation.value
          }
        }
        if (filterSkill.value) params.skill = filterSkill.value
        if (filterCrop.value) params.crop = filterCrop.value

        // 游客模式访问，会返回脱敏数据，使用搜索接口
        const response = await axios.get('/api/search', { params })
        const responseData = response.data || {}
        persons.value = responseData.data || []
        
        if (responseData.pagination) {
          totalCount.value = responseData.pagination.total
        } else {
          totalCount.value = responseData.total ?? responseData.totalCount ?? persons.value.length
        }
        
        try {
          const statsResponse = await axios.get('/api/statistics')
          if (statsResponse.data && statsResponse.data.data) {
            globalStats.value.skills = statsResponse.data.data.skillCategories || 0
            // locations 不是默认统计项，可以留空或尝试获取
          }
        } catch (e) {
          // guest might not have access to statistics, ignore silently
        }
      } catch (error) {
        ElMessage.error('加载人员列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 防抖函数
    let searchTimeout = null
    const debouncedSearch = () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      searchTimeout = setTimeout(() => {
        currentPage.value = 1
        loadPersons()
      }, 500)
    }

    const handleSearch = () => {
      currentPage.value = 1
       loadPersons()
    }
    
    const resetFilters = () => {
      searchKeyword.value = ''
      filterEducation.value = ''
      filterStatus.value = ''
      filterMinAge.value = undefined
      filterMaxAge.value = undefined
      filterSkill.value = ''
      filterCrop.value = ''
      currentPage.value = 1
      loadPersons()
    }
    
    const viewTalentDetail = (person) => {
      selectedPerson.value = person
      showDetailDialog.value = true
    }
    
    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1
      loadPersons()
    }
    
    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
      loadPersons()
    }
    
    // 生命周期
    onMounted(() => {
      loadPersons()
    })
    
    onUnmounted(() => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    })
    
    return {
      contentRef,
      loading,
      persons,
      showDetailDialog,
      selectedPerson,
      searchKeyword,
      filterEducation,
      filterStatus,
      filterMinAge,
      filterMaxAge,
      filterSkill,
      filterCrop,
      globalStats,
      currentPage,
      pageSize,
      totalCount,
      totalPersons,
      skillCategories,
      locations,
      paginatedPersons,
      goToLogin,
      goToDashboard,
      scrollToContent,
      loadPersons,
      handleSearch,
      debouncedSearch,
      resetFilters,
      viewTalentDetail,
      // 状态
      authStore,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
/* 优化容器宽度和布局，与其他界面保持一致 */
.guest-view {
  min-height: 100vh;
  width: 100%;
  /* 移除max-width限制，让它继承父容器的宽度控制 */
  margin: 0;
  padding: 0;
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #0d2137 0%, #1a5276 30%, #2e86c1 60%, #27ae60 100%);
  color: white;
  padding: 80px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
  background-size: 200% 200%;
  animation: gradientShift 10s ease infinite;
  margin: -24px -24px 0 -24px;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="white" opacity="0.05"/></svg>') repeat;
  background-size: 50px 50px;
}

.banner-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.banner-content h1 {
  font-size: 48px;
  margin-bottom: 16px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.banner-content p {
  font-size: 22px;
  margin-bottom: 40px;
  opacity: 0.95;
}

.banner-actions {
  margin-bottom: 40px;
}

.banner-actions .el-button {
  margin: 0 10px;
}

.banner-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 40px;
}

.stat-item {
  text-align: center;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px 30px;
  border: 1px solid rgba(255,255,255,0.2);
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

/* 主要内容 */
.main-content {
  padding: 40px 20px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.search-card {
  margin-bottom: 30px;
}

.search-header {
  text-align: center;
  margin-bottom: 30px;
}

.search-header h3 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #333;
}

.search-header p {
  color: #666;
  margin: 0;
}

.search-form {
  padding: 20px;
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  border-radius: 8px;
  border-left: 4px solid #2e86c1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.talents-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-prompt-card {
  margin-top: 40px;
  position: relative;
  overflow: hidden;
}

.login-prompt-card::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  background: linear-gradient(to bottom, #2e86c1, #27ae60);
}

.login-prompt {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  text-align: left;
}

.prompt-icon {
  font-size: 32px;
  color: #fff;
  background: linear-gradient(135deg, #2e86c1 0%, #27ae60 100%);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(46, 134, 193, 0.3);
}

.prompt-content h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.prompt-content p {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.5;
}

.prompt-content .el-button {
  background: linear-gradient(135deg, #2e86c1 0%, #27ae60 100%);
  border: none;
  padding: 12px 24px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(46, 134, 193, 0.2);
  transition: all 0.3s ease;
}

.prompt-content .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(46, 134, 193, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .banner-content h1 {
    font-size: 32px;
  }
  
  .banner-content p {
    font-size: 16px;
  }
  
  .banner-stats {
    gap: 30px;
  }
  
  .stat-number {
    font-size: 28px;
  }
  
  .login-prompt {
    flex-direction: column;
    text-align: center;
  }
}
</style>
