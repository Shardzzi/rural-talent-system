<template>
  <div class="guest-view">
    <!-- 品牌主视觉 -->
    <section class="welcome-banner" aria-labelledby="hero-title">
      <div class="banner-content">
        <div class="hero-copy">
          <div class="hero-eyebrow">
            <span class="eyebrow-dot"></span>
            数字乡村人才协作网络
          </div>
          <h1 id="hero-title">让乡村的<em>一技之长</em><br>连接到更远的地方</h1>
          <p>汇聚懂农业、爱农村、有经验的实干人才，让每一份乡土智慧都有被看见、被需要的机会。</p>
          <div class="banner-actions">
            <el-button v-if="!authStore.isAuthenticated" type="primary" size="large" @click="goToLogin">
              <el-icon><User /></el-icon>
              登录 / 注册
            </el-button>
            <el-button v-if="authStore.isAuthenticated" type="primary" size="large" @click="goToDashboard">
              <el-icon><User /></el-icon>
              进入{{ authStore.user?.role === 'admin' ? '管理' : '用户' }}中心
            </el-button>
            <el-button class="browse-button" size="large" @click="scrollToContent">
              浏览人才名录
              <el-icon><ArrowDown /></el-icon>
            </el-button>
          </div>
          <div class="hero-topics" aria-label="平台人才方向">
            <span>农技推广</span>
            <span>返乡创业</span>
            <span>乡村治理</span>
            <span>合作对接</span>
          </div>
        </div>

        <aside class="hero-insight" aria-label="人才库概览">
          <div class="insight-header">
            <div>
              <span class="insight-kicker">TALENT ATLAS</span>
              <h2>乡村人才图谱</h2>
            </div>
            <span class="live-badge"><i></i>持续更新</span>
          </div>
          <div class="insight-focus">
            <span>平台已收录</span>
            <strong>{{ totalPersons }}</strong>
            <small>位乡村人才</small>
          </div>
          <div class="banner-stats">
            <div class="stat-item">
              <div class="stat-number">{{ skillCategories }}</div>
              <div class="stat-label">技能类别</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ locations }}</div>
              <div class="stat-label">覆盖地区</div>
            </div>
          </div>
          <div class="insight-note">
            <el-icon><Lock /></el-icon>
            公开信息已完成隐私脱敏
          </div>
        </aside>
      </div>
    </section>

    <!-- 主要内容区域 -->
    <div class="main-content" ref="contentRef">
      <!-- 搜索和筛选区域 -->
      <el-card class="search-card" shadow="never">
        <div class="search-header">
          <div class="section-heading">
            <span class="section-index">01</span>
            <div>
              <span class="section-kicker">TALENT DISCOVERY</span>
              <h2>发现合适的乡村人才</h2>
              <p>按专长、地区和从业情况组合筛选，快速找到合作伙伴。</p>
            </div>
          </div>
          <div class="filter-hint">
            <el-icon><Search /></el-icon>
            7 项组合条件
          </div>
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
      <el-card class="talents-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div class="list-title">
              <span class="section-index section-index--small">02</span>
              <div>
                <span class="section-kicker">TALENT DIRECTORY</span>
                <strong>人才名录</strong>
              </div>
              <el-tag type="info" effect="plain" round>共 {{ totalCount }} 人</el-tag>
            </div>
            <el-button link class="refresh-button" @click="loadPersons">
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
            <span class="prompt-kicker">MEMBER ACCESS</span>
            <h3>解锁更完整的人才协作体验</h3>
            <p>登录后可查看完整联系方式、收藏人才，并维护您自己的人才档案。</p>
          </div>
          <div class="prompt-action">
            <el-button type="primary" @click="goToLogin">
              立即登录 / 注册
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
import PersonTable from '../components/person-table/PersonTable.vue'

export default {
  name: 'GuestView',
  components: {
    PersonDetailDialog,
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
        
        if (authStore.isAuthenticated) {
          try {
            const statsResponse = await axios.get('/api/statistics')
            if (statsResponse.data && statsResponse.data.data) {
              globalStats.value.skills = statsResponse.data.data.skillCategories || 0
              // locations 不是默认统计项，可以留空或尝试获取
            }
          } catch (e) {
            // 统计接口异常不影响公开人才列表展示
          }
        }
      } catch (error) {
        ElMessage.error('加载失败，请稍后重试')
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
.guest-view {
  min-height: 100vh;
  width: calc(100% + 56px);
  margin: -28px;
  padding: 0;
}

.welcome-banner {
  color: #ffffff;
  padding: 64px 44px 58px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 8%, rgba(215, 161, 79, 0.18), transparent 22rem),
    radial-gradient(circle at 8% 100%, rgba(121, 161, 142, 0.15), transparent 28rem),
    var(--color-sidebar);
}

.welcome-banner::before {
  content: '';
  position: absolute;
  width: 420px;
  height: 420px;
  top: -185px;
  right: -120px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 44% 56% 58% 42%;
  box-shadow:
    0 0 0 44px rgba(255, 255, 255, 0.025),
    0 0 0 92px rgba(255, 255, 255, 0.018);
  transform: rotate(18deg);
}

.banner-content {
  position: relative;
  z-index: 1;
  max-width: var(--content-max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.65fr);
  align-items: center;
  gap: clamp(48px, 7vw, 112px);
}

.hero-copy {
  max-width: 760px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.eyebrow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 0 5px rgba(215, 161, 79, 0.14);
}

.banner-content h1 {
  max-width: 720px;
  margin: 0 0 22px;
  font-size: clamp(42px, 4.2vw, 68px);
  font-weight: 750;
  line-height: 1.16;
  letter-spacing: -0.045em;
}

.banner-content h1 em {
  color: #edc985;
  font-style: normal;
}

.hero-copy > p {
  max-width: 660px;
  margin: 0 0 32px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 17px;
  line-height: 1.85;
}

.banner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 30px;
}

.banner-actions .el-button {
  height: 48px;
  margin: 0;
  padding: 0 22px;
  border-radius: 12px;
}

.banner-actions :deep(.el-button--primary) {
  color: var(--color-sidebar-deep);
  background: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 12px 24px rgba(7, 26, 20, 0.24);
}

.banner-actions :deep(.el-button--primary:hover) {
  background: #e3b464;
  border-color: #e3b464;
}

.browse-button {
  color: rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
}

.browse-button:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.36);
}

.hero-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
}

.hero-topics span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.hero-topics span::before {
  content: '';
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-primary-light-5);
}

.hero-insight {
  padding: 26px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px 24px 24px 8px;
  background: rgba(255, 255, 255, 0.075);
  box-shadow: 0 24px 60px rgba(7, 26, 20, 0.25);
  backdrop-filter: blur(14px);
}

.insight-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.insight-kicker,
.section-kicker,
.prompt-kicker {
  display: block;
  color: var(--color-secondary);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.2em;
}

.insight-kicker {
  color: rgba(255, 255, 255, 0.42);
}

.insight-header h2 {
  margin: 5px 0 0;
  font-size: 18px;
  letter-spacing: 0.06em;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  color: rgba(255, 255, 255, 0.64);
  font-size: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.live-badge i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8fc5a6;
  box-shadow: 0 0 0 4px rgba(143, 197, 166, 0.12);
}

.insight-focus {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  padding: 24px 0;
}

.insight-focus span {
  grid-column: 1 / -1;
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
}

.insight-focus strong {
  margin-top: 4px;
  color: #ffffff;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(56px, 6vw, 78px);
  font-weight: 500;
  line-height: 0.95;
}

.insight-focus small {
  padding-bottom: 8px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
}

.banner-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  padding: 14px 16px;
  background: rgba(7, 26, 20, 0.16);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.stat-number {
  margin-bottom: 3px;
  color: #f1d69d;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 28px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.48);
  font-size: 11px;
}

.insight-note {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.38);
  font-size: 10px;
}

.main-content {
  padding: 42px 44px 56px;
  width: 100%;
  max-width: calc(var(--content-max-width) + 88px);
  margin: 0 auto;
}

.search-card {
  margin-bottom: 24px;
  border-radius: var(--radius-xl);
}

.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
}

.section-heading,
.list-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  color: var(--color-primary);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18px;
  border-radius: 14px 14px 14px 5px;
  background: var(--color-primary-light-9);
}

.section-index--small {
  width: 40px;
  height: 40px;
  flex-basis: 40px;
  font-size: 15px;
}

.section-heading h2 {
  margin: 3px 0 4px;
  color: var(--color-text-primary);
  font-size: 22px;
}

.search-header p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.filter-hint {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  color: var(--color-text-secondary);
  font-size: 12px;
  white-space: nowrap;
  border-radius: 999px;
  background: var(--color-surface-soft);
}

.search-form {
  padding: 22px;
  background: var(--color-surface-soft);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}

.search-form :deep(.el-input__wrapper),
.search-form :deep(.el-select__wrapper) {
  min-height: 44px;
  background: var(--color-surface);
}

.talents-card {
  margin-bottom: 24px;
  border-radius: var(--radius-xl);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title strong {
  display: block;
  margin-top: 3px;
  color: var(--color-text-primary);
  font-size: 17px;
}

.refresh-button {
  color: var(--color-primary);
}

.login-prompt-card {
  margin-top: 24px;
  position: relative;
  overflow: hidden;
  color: #ffffff;
  border: 0;
  border-radius: var(--radius-xl);
  background: var(--color-sidebar);
}

.login-prompt-card::before {
  content: '';
  position: absolute;
  width: 180px;
  height: 180px;
  right: -70px;
  bottom: -105px;
  border: 28px solid rgba(215, 161, 79, 0.12);
  border-radius: 50%;
}

.login-prompt {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 26px 28px;
  text-align: left;
}

.prompt-icon {
  width: 50px;
  height: 50px;
  padding: 14px;
  color: var(--color-sidebar-deep);
  background: var(--color-accent);
  border-radius: 14px 14px 14px 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.prompt-content h3 {
  margin: 4px 0 6px;
  color: #ffffff;
  font-size: 18px;
}

.prompt-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.56);
  line-height: 1.5;
}

.prompt-kicker {
  color: rgba(255, 255, 255, 0.38);
}

.prompt-action {
  margin-left: auto;
  position: relative;
  z-index: 1;
}

.prompt-action :deep(.el-button) {
  color: var(--color-sidebar-deep);
  background: var(--color-accent);
  border-color: var(--color-accent);
}

@media (max-width: 1100px) {
  .banner-content {
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 40px;
  }
}

@media (max-width: 768px) {
  .guest-view {
    width: calc(100% + 24px);
    margin: -12px;
  }

  .welcome-banner {
    padding: 46px 20px 34px;
  }

  .banner-content {
    grid-template-columns: 1fr;
    gap: 34px;
  }

  .banner-content h1 {
    font-size: clamp(36px, 11vw, 48px);
    letter-spacing: -0.055em;
  }
  
  .hero-copy > p {
    font-size: 15px;
  }

  .hero-topics {
    gap: 8px 14px;
  }

  .hero-insight {
    padding: 22px;
  }

  .main-content {
    padding: 24px 16px 40px;
  }

  .search-card,
  .talents-card {
    border-radius: var(--radius-lg);
  }

  .search-header {
    align-items: flex-start;
  }

  .filter-hint {
    display: none;
  }

  .section-heading {
    align-items: flex-start;
  }

  .section-heading h2 {
    font-size: 19px;
  }

  .section-index {
    width: 42px;
    height: 42px;
    flex-basis: 42px;
  }

  .search-form {
    padding: 16px;
  }

  .search-form :deep(.el-col) {
    margin-bottom: 10px;
  }

  .card-header,
  .list-title {
    align-items: flex-start;
  }

  .list-title {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .login-prompt {
    flex-direction: column;
    text-align: center;
  }

  .prompt-action {
    margin-left: 0;
  }
}
</style>
