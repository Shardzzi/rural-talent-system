<template>
  <div class="user-dashboard">
    <el-page-header @back="goBack" content="用户中心">
      <template #extra>
        <el-button v-if="!userPerson" type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          完善我的信息
        </el-button>
        <el-button v-else type="warning" @click="editMyInfo">
          <el-icon><Edit /></el-icon>
          编辑我的信息
        </el-button>
      </template>
    </el-page-header>

    <div class="dashboard-content">
      <!-- 个人信息卡片 -->
      <el-card class="profile-card" v-if="userPerson">
        <template #header>
          <div class="card-header">
            <span>我的个人信息</span>
            <el-tag :type="userPerson.employment_status === '在岗' ? 'success' : 'info'">
              {{ userPerson.employment_status || '未设置' }}
            </el-tag>
          </div>
        </template>
        
        <el-row :gutter="30">
          <el-col :span="8">
            <div class="profile-item">
              <label>姓名：</label>
              <span>{{ userPerson.name }}</span>
            </div>
            <div class="profile-item">
              <label>年龄：</label>
              <span>{{ userPerson.age }}岁</span>
            </div>
            <div class="profile-item">
              <label>性别：</label>
              <span>{{ userPerson.gender }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="profile-item">
              <label>学历：</label>
              <span>{{ userPerson.education_level || '未设置' }}</span>
            </div>
            <div class="profile-item">
              <label>联系电话：</label>
              <span>{{ userPerson.phone }}</span>
            </div>
            <div class="profile-item">
              <label>邮箱：</label>
              <span>{{ userPerson.email }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="profile-item">
              <label>所在地区：</label>
              <span>{{ userPerson.address || '未设置' }}</span>
            </div>
            <div class="profile-item">
              <label>就业状态：</label>
              <span>{{ userPerson.employment_status }}</span>
            </div>
          </el-col>
        </el-row>
        
        <div class="profile-item full-width" v-if="userPerson.skills">
          <label>技能专长：</label>
          <div class="skills-tags">
            <el-tag
              v-for="skill in skillsArray"
              :key="skill"
              type="primary"
              size="small"
              style="margin-right: 8px; margin-bottom: 4px;"
            >
              {{ skill }}
            </el-tag>
          </div>
        </div>
        
        <div class="profile-item full-width" v-if="userPerson.experience">
          <label>工作经验：</label>
          <p class="experience-text">{{ userPerson.experience }}</p>
        </div>
      </el-card>

      <!-- 提示卡片 - 当用户还没有个人信息时 -->
      <el-card class="welcome-card" v-else>
        <div class="welcome-content">
          <el-icon class="welcome-icon"><User /></el-icon>
          <h3>欢迎来到数字乡村人才信息系统</h3>
          <p>您还没有完善个人信息，点击下方按钮开始录入您的信息，让更多人了解您的专业技能。</p>
          <el-button type="primary" size="large" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            开始录入个人信息
          </el-button>
        </div>
      </el-card>

      <!-- 人才信息浏览 -->
      <el-card class="browse-card">
        <template #header>
          <div class="card-header">
            <span>浏览人才信息</span>
            <el-button type="text" @click="loadPersons">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <!-- 搜索栏 -->
        <div class="search-section">
          <el-row :gutter="16" align="middle">
            <el-col :xs="24" :sm="12" :md="8">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索姓名、技能、地区"
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
              <el-select 
                v-model="filterEducation" 
                placeholder="学历筛选" 
                clearable 
                style="width: 100%"
                @change="debouncedSearch"
                @clear="debouncedSearch"
                :teleported="false"
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
                clearable 
                style="width: 100%"
                @change="debouncedSearch"
                @clear="debouncedSearch"
                :teleported="false"
              >
                <el-option label="在岗" value="在岗" />
                <el-option label="求职中" value="求职中" />
                <el-option label="已退休" value="已退休" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8">
              <div class="search-buttons">
                <el-button type="primary" @click="handleSearch">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="resetFilters">重置</el-button>
                <el-button type="success" @click="loadPersons">
                  <el-icon><Refresh /></el-icon>
                  刷新列表
                </el-button>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 人员列表 -->
        <PersonTable
          :data="paginatedPersons"
          role="user"
          :loading="loading"
          :total="totalCount"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[6, 12, 24, 48]"
          pagination-layout="total, sizes, prev, pager, next"
          @page-change="handleCurrentChange"
          @size-change="handleSizeChange"
          @row-click="viewPersonDetail"
        />
      </el-card>
    </div>

    <!-- 添加/编辑个人信息对话框 -->
    <PersonFormWizard
      :visible="showAddDialog"
      @update:visible="showAddDialog = $event"
      :person="currentPerson"
      :is-edit="isEdit"
      :is-user-mode="true"
      @saved="handlePersonSaved"
    />

    <!-- 人员详情对话框 -->
    <PersonDetailDialog
      v-model="showDetailDialog"
      :person="selectedPerson"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Edit, User, Search, Refresh } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import PersonFormWizard from '../components/person-form/PersonFormWizard.vue'
import PersonDetailDialog from '../components/PersonDetailDialog.vue'
import PersonTable from '../components/person-table/PersonTable.vue'

export default {
  name: 'UserDashboard',
  components: {
    PersonFormWizard,
    PersonDetailDialog,
    PersonTable,
    Plus,
    Edit,
    User,
    Search,
    Refresh
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    // 响应式数据
    const loading = ref(false)
    const persons = ref([])
    const userPerson = ref(null)
    const showAddDialog = ref(false)
    const showDetailDialog = ref(false)
    const currentPerson = ref(null)
    const selectedPerson = ref(null)
    const isEdit = ref(false)
    
    // 搜索和筛选
    const searchKeyword = ref('')
    const filterEducation = ref('')
    const filterStatus = ref('')
    
    // 分页
    const currentPage = ref(1)
    const pageSize = ref(12)
    const totalCount = ref(0)
    
    // 计算属性
    const skillsArray = computed(() => {
      if (!userPerson.value?.skills) return []
      return userPerson.value.skills.split(/[,，、]/).map(s => s.trim()).filter(s => s)
    })
    
    const hasActiveFilters = computed(() => {
      return searchKeyword.value || filterEducation.value || filterStatus.value
    })
    
    const paginatedPersons = computed(() => {
      return persons.value.filter(person => person.id !== userPerson.value?.id)
    })
    
    // 方法
    const goBack = () => {
      router.push('/')
    }
    
    const loadPersons = async () => {
      loading.value = true
      try {
        let response
        if (hasActiveFilters.value) {
          const params = {
            page: currentPage.value,
            limit: pageSize.value,
          }
          if (searchKeyword.value) params.keyword = searchKeyword.value
          if (filterStatus.value) params.employment_status = filterStatus.value
          if (filterEducation.value) {
            if (['专科', '本科'].includes(filterEducation.value)) {
              params.education_level = filterEducation.value
            }
          }
          response = await axios.get('/api/search', { params })
        } else {
          response = await axios.get('/api/persons', {
            params: {
              page: currentPage.value,
              limit: pageSize.value,
              sortBy: 'created_at',
              sortOrder: 'desc'
            }
          })
        }
        
        const responseData = response.data || {}
        persons.value = responseData.data || []
        
        if (responseData.pagination) {
          totalCount.value = responseData.pagination.total
        } else {
          totalCount.value = responseData.total ?? responseData.totalCount ?? persons.value.length
        }
      } catch (error) {
        ElMessage.error('加载人员列表失败')
      } finally {
        loading.value = false
      }
    }
    
    const loadUserPerson = async () => {
      // 检查用户是否有关联的个人信息ID（兼容两种字段名）
      const personId = authStore.user?.personId || authStore.user?.person_id
      if (!personId) {
        return
      }
      
      try {
        const response = await axios.get(`/api/persons/${personId}`)
        userPerson.value = response.data.data
      } catch (error) {
        if (error.response?.status !== 404) {
          ElMessage.error('加载个人信息失败')
        }
      }
    }
    
    const editMyInfo = async () => {
      try {
        // 获取完整的人员详细信息，包括扩展数据
        const response = await axios.get(`/api/persons/${userPerson.value.id}/details`)
        currentPerson.value = response.data.data
        isEdit.value = true
        showAddDialog.value = true
      } catch (error) {
        currentPerson.value = { ...userPerson.value }
        isEdit.value = true
        showAddDialog.value = true
        ElMessage.warning('无法获取完整信息，将使用基本信息编辑')
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
      currentPage.value = 1
      loadPersons()
    }
    
    const handlePersonSaved = () => {
      showAddDialog.value = false
      currentPerson.value = null
      isEdit.value = false
      loadUserPerson()
      loadPersons()
      // 移除重复的成功消息，因为PersonFormWizard组件内部已经显示了
    }
    
    const viewPersonDetail = (person) => {
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
      loadUserPerson()
    })
    
    return {
      loading,
      persons,
      userPerson,
      showAddDialog,
      showDetailDialog,
      currentPerson,
      selectedPerson,
      isEdit,
      searchKeyword,
      filterEducation,
      filterStatus,
      currentPage,
      pageSize,
      skillsArray,
      paginatedPersons,
      hasActiveFilters,
      goBack,
      loadPersons,
      editMyInfo,
      handleSearch,
      debouncedSearch,
      resetFilters,
      handlePersonSaved,
      viewPersonDetail,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
/* 优化容器宽度和布局 */
.user-dashboard {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto; /* 居中对齐 */
}

.dashboard-content {
  width: 100%;
  margin-top: 20px;
}

.browse-card {
  margin-bottom: 20px;
  width: 100%;
  /* 确保卡片容器有固定宽度约束 */
  min-width: 0; /* 防止内容溢出 */
}

.profile-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border-left: 4px solid #67C23A;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.profile-card :deep(.el-card__header) {
  padding: 0;
  border-bottom: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  font-size: 16px;
  font-weight: 500;
}

.profile-card .card-header {
  padding: 16px 20px;
  background: linear-gradient(to right, #f0f9eb, #ffffff);
  border-bottom: 1px solid #e1f3d8;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.profile-item {
  margin-bottom: 14px;
  line-height: 1.5;
}

.profile-item label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  display: inline-block;
  min-width: 70px;
}

.profile-item span {
  color: #333;
}

.profile-item.full-width {
  flex-direction: column;
  margin-top: 20px;
}

.profile-item.full-width label {
  margin-bottom: 8px;
}

.skills-tags {
  margin-top: 8px;
}

.experience-text {
  color: #606266;
  white-space: pre-line;
  line-height: 1.6;
  margin-top: 8px;
}

.welcome-card {
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.welcome-content {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f9eb 100%);
  position: relative;
}

.welcome-icon {
  font-size: 56px;
  color: #409EFF;
  margin-bottom: 24px;
  background: #fff;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
  transition: transform 0.3s ease;
}

.welcome-icon:hover {
  transform: scale(1.05);
}

.welcome-content h3 {
  color: #303133;
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 600;
}

.welcome-content p {
  color: #606266;
  margin-bottom: 32px;
  max-width: 540px;
  margin-left: auto;
  margin-right: auto;
  font-size: 16px;
  line-height: 1.6;
}

.welcome-content .el-button {
  padding: 12px 32px;
  font-size: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.welcome-content .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.browse-card {
  margin-bottom: 20px;
  width: 100%;
}

.search-section {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  border-radius: 8px;
  border: 1px solid #ebeef5;
  border-left: 4px solid #409EFF;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.search-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.search-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.search-buttons .el-button {
  margin: 0;
}
</style>
