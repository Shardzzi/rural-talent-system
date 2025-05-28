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
          <el-row :gutter="20" align="middle">
            <el-col :span="8">
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
            <el-col :span="4">
              <el-select 
                v-model="filterEducation" 
                placeholder="学历筛选" 
                size="large" 
                clearable
                @change="debouncedSearch"
                @clear="debouncedSearch"
              >
                <el-option label="高中及以下" value="高中及以下" />
                <el-option label="专科" value="专科" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士及以上" value="硕士及以上" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select 
                v-model="filterStatus" 
                placeholder="就业状态" 
                size="large" 
                clearable
                @change="debouncedSearch"
                @clear="debouncedSearch"
              >
                <el-option label="在岗" value="在岗" />
                <el-option label="求职中" value="求职中" />
                <el-option label="已退休" value="已退休" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-button type="primary" size="large" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button size="large" @click="resetFilters">重置</el-button>
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
              <el-tag type="info" size="small">共 {{ filteredPersons.length }} 人</el-tag>
            </span>
            <el-button type="text" @click="loadPersons">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <div class="talents-grid" v-loading="loading">
          <div
            v-for="person in paginatedPersons"
            :key="person.id"
            class="talent-card"
            @click="viewTalentDetail(person)"
          >
            <div class="talent-header">
              <div class="talent-avatar">
                <el-icon><User /></el-icon>
              </div>
              <div class="talent-basic">
                <h4>{{ person.name }}</h4>
                <div class="talent-meta">
                  <span class="meta-item">{{ person.age }}岁</span>
                  <span class="meta-item">{{ person.gender }}</span>
                  <span class="meta-item education">{{ person.education_level || '未设置' }}</span>
                </div>
              </div>
              <el-tag 
                size="small" 
                :type="getStatusTagType(person.employment_status)"
                class="status-tag"
              >
                {{ person.employment_status || '未知' }}
              </el-tag>
            </div>
            
            <div class="talent-location">
              <el-icon><Location /></el-icon>
              <span>{{ person.address || '未设置地区' }}</span>
            </div>
            
            <div class="talent-skills" v-if="person.skills">
              <div class="skills-label">
                <el-icon><Star /></el-icon>
                <span>技能专长</span>
              </div>
              <div class="skills-tags">
                <el-tag
                  v-for="skill in getSkillsPreview(person.skills)"
                  :key="skill"
                  size="small"
                  type="primary"
                  effect="plain"
                  class="skill-tag"
                >
                  {{ skill }}
                </el-tag>
                <span v-if="getSkillsCount(person.skills) > 3" class="more-skills">
                  +{{ getSkillsCount(person.skills) - 3 }}
                </span>
              </div>
            </div>

            <div class="talent-footer">
              <span class="view-hint">点击查看详情</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && filteredPersons.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Search /></el-icon>
          <h3>暂无匹配结果</h3>
          <p v-if="hasActiveFilters">没有找到符合当前筛选条件的人才信息</p>
          <p v-else>暂时还没有人才信息</p>
          <div v-if="hasActiveFilters">
            <el-button type="primary" @click="resetFilters">清除筛选条件</el-button>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="filteredPersons.length > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[9, 18, 36, 72]"
            layout="total, sizes, prev, pager, next"
            :total="filteredPersons.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>

      <!-- 登录提示卡片 -->
      <el-card class="login-prompt-card">
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
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Search, 
  ArrowDown, 
  ArrowRight, 
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

export default {
  name: 'GuestView',
  components: {
    PersonDetailDialog,
    AuthDebugPanel,
    User,
    Search,
    ArrowDown,
    ArrowRight,
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
    
    // 搜索和筛选
    const searchKeyword = ref('')
    const filterEducation = ref('')
    const filterStatus = ref('')
    const searchTrigger = ref(0) // 用于手动触发搜索
    
    // 分页
    const currentPage = ref(1)
    const pageSize = ref(9)
    
    // 计算属性
    const totalPersons = computed(() => persons.value.length)
    
    const skillCategories = computed(() => {
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
      const locs = new Set()
      persons.value.forEach(person => {
        if (person.location) {
          locs.add(person.location)
        }
      })
      return locs.size
    })
    
    const filteredPersons = computed(() => {
      // 依赖searchTrigger来手动控制重新计算
      searchTrigger.value // 这行确保当searchTrigger变化时重新计算
      
      let result = persons.value
      
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        result = result.filter(person => 
          person.name?.toLowerCase().includes(keyword) ||
          person.skills?.toLowerCase().includes(keyword) ||
          person.address?.toLowerCase().includes(keyword)
        )
      }
      
      if (filterEducation.value) {
        result = result.filter(person => {
          const education = person.education_level
          if (filterEducation.value === '高中及以下') {
            return ['无', '小学', '初中', '高中'].includes(education)
          } else if (filterEducation.value === '专科') {
            return education === '专科'
          } else if (filterEducation.value === '本科') {
            return education === '本科'
          } else if (filterEducation.value === '硕士及以上') {
            return ['硕士', '博士'].includes(education)
          }
          return true
        })
      }
      
      if (filterStatus.value) {
        result = result.filter(person => person.employment_status === filterStatus.value)
      }
      
      return result
    })
    
    const paginatedPersons = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredPersons.value.slice(start, end)
    })
    
    const hasActiveFilters = computed(() => {
      return searchKeyword.value || filterEducation.value || filterStatus.value
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
        // 游客模式访问，会返回脱敏数据
        const response = await axios.get('/api/persons')
        persons.value = response.data.data || []
        console.log('✅ 游客模式加载人员列表成功:', persons.value.length, '条记录')
      } catch (error) {
        console.error('❌ 加载人员列表失败:', error)
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
        searchTrigger.value++
      }, 500)
    }
    
    const handleSearch = () => {
      currentPage.value = 1
      searchTrigger.value++
      console.log('🔍 游客搜索:', {
        keyword: searchKeyword.value,
        education: filterEducation.value,
        status: filterStatus.value
      })
    }
    
    const resetFilters = () => {
      searchKeyword.value = ''
      filterEducation.value = ''
      filterStatus.value = ''
      currentPage.value = 1
    }
    
    const viewTalentDetail = (person) => {
      selectedPerson.value = person
      showDetailDialog.value = true
    }
    
    const getStatusTagType = (status) => {
      switch (status) {
        case '在岗': return 'success'
        case '求职中': return 'warning'
        case '已退休': return 'info'
        default: return 'info'
      }
    }
    
    const getSkillsPreview = (skillsStr) => {
      if (!skillsStr) return []
      const skills = skillsStr.split(/[,，、]/).map(s => s.trim()).filter(s => s)
      return skills.slice(0, 3)
    }
    
    const getSkillsCount = (skillsStr) => {
      if (!skillsStr) return 0
      return skillsStr.split(/[,，、]/).map(s => s.trim()).filter(s => s).length
    }
    
    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1
    }
    
    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
    }
    
    // 生命周期
    onMounted(() => {
      loadPersons()
      // 调试：输出认证状态
      console.log('🔍 GuestView mounted - 认证状态:', {
        isAuthenticated: authStore.isAuthenticated,
        user: authStore.user,
        token: authStore.token ? '已设置' : '未设置'
      })
    })
    
    // 监听认证状态变化
    watch(() => authStore.isAuthenticated, (newValue, oldValue) => {
      console.log('🔄 GuestView - 认证状态变化:', {
        from: oldValue,
        to: newValue,
        user: authStore.user
      })
    }, { immediate: true })
    
    return {
      contentRef,
      loading,
      persons,
      showDetailDialog,
      selectedPerson,
      searchKeyword,
      filterEducation,
      filterStatus,
      currentPage,
      pageSize,
      totalPersons,
      skillCategories,
      locations,
      filteredPersons,
      paginatedPersons,
      hasActiveFilters,
      goToLogin,
      goToDashboard,
      scrollToContent,
      loadPersons,
      handleSearch,
      debouncedSearch,
      resetFilters,
      viewTalentDetail,
      getStatusTagType,
      // 状态
      authStore,
      getSkillsPreview,
      getSkillsCount,
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
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  color: white;
  padding: 60px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="white" opacity="0.1"/></svg>') repeat;
  background-size: 50px 50px;
}

.banner-content {
  position: relative;
  z-index: 1;
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 20px;
}

.banner-content h1 {
  font-size: 48px;
  margin-bottom: 16px;
  font-weight: bold;
}

.banner-content p {
  font-size: 20px;
  margin-bottom: 40px;
  opacity: 0.9;
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
  gap: 60px;
  margin-top: 40px;
}

.stat-item {
  text-align: center;
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
  max-width: 1300px;
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
  background-color: #f8f9fa;
  border-radius: 8px;
}

.talents-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.talents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 20px;
  min-height: 400px; /* 确保始终有最小高度 */
  width: 100%; /* 确保占满容器宽度 */
  align-items: start; /* 防止卡片被拉伸 */
  grid-auto-rows: min-content; /* 行高自适应内容 */
}

.talent-card {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
  position: relative;
  align-self: start; /* 防止卡片被拉伸 */
  min-height: 180px;
  max-height: 280px;
  height: auto;
  display: flex;
  flex-direction: column;
}

.talent-card:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.15);
  transform: translateY(-4px);
}

.talent-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.talent-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.talent-avatar .el-icon {
  font-size: 24px;
  color: white;
}

.talent-basic {
  flex: 1;
}

.talent-basic h4 {
  margin: 0 0 6px 0;
  color: #333;
  font-size: 18px;
  font-weight: bold;
}

.talent-meta {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.talent-meta span {
  padding: 2px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.meta-item.education {
  background-color: #e1f3ff;
  color: #409EFF;
  font-weight: 500;
}

.status-tag {
  margin-left: auto;
}

.talent-location {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  color: #666;
  font-size: 14px;
}

.talent-skills {
  margin-bottom: 16px;
}

.skills-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.skill-tag {
  margin: 0;
}

.more-skills {
  color: #666;
  font-size: 12px;
  margin-left: 4px;
}

.talent-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  color: #409EFF;
  font-size: 14px;
}

.view-hint {
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.login-prompt-card {
  margin-top: 40px;
}

.login-prompt {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  text-align: left;
}

.prompt-icon {
  font-size: 48px;
  color: #409EFF;
  flex-shrink: 0;
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

.pagination-wrapper {
  margin-top: 30px;
  text-align: center;
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
  
  .talents-grid {
    grid-template-columns: 1fr;
  }
  
  .login-prompt {
    flex-direction: column;
    text-align: center;
  }
}
</style>
