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
          <el-row :gutter="20" align="middle">
            <el-col :span="6">
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
            <el-col :span="5">
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
            <el-col :span="5">
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
            <el-col :span="8">
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
        <div class="persons-grid" v-loading="loading">
          <!-- 无结果提示 -->
          <div v-if="!loading && filteredPersons.length === 0" class="no-results">
            <div class="no-results-content">
              <el-icon class="no-results-icon"><DocumentRemove /></el-icon>
              <h3>暂无匹配结果</h3>
              <p v-if="hasActiveFilters">没有找到符合当前筛选条件的人员信息</p>
              <p v-else>暂时还没有其他人员信息</p>
              <div class="no-results-actions" v-if="hasActiveFilters">
                <el-button type="primary" @click="resetFilters">
                  <el-icon><Refresh /></el-icon>
                  清空筛选条件
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 人员卡片列表 -->
          <div
            v-for="person in paginatedPersons"
            :key="person.id"
            class="person-card"
            @click="viewPersonDetail(person)"
          >
            <div class="person-header">
              <h4>{{ person.name }}</h4>
              <el-tag size="small" :type="getStatusTagType(person.employment_status)">
                {{ person.employment_status || '未知' }}
              </el-tag>
            </div>
            
            <div class="person-info">
              <p><strong>年龄：</strong>{{ person.age }}岁 | <strong>性别：</strong>{{ person.gender }}</p>
              <p><strong>学历：</strong>{{ person.education_level || '未设置' }}</p>
              <p><strong>地区：</strong>{{ person.address || '未设置地区' }}</p>
              <p v-if="person.phone"><strong>电话：</strong>{{ person.phone }}</p>
            </div>
            
            <div class="person-skills" v-if="person.skills">
              <p><strong>技能：</strong></p>
              <div class="skills-preview">
                <el-tag
                  v-for="skill in getSkillsPreview(person.skills)"
                  :key="skill"
                  size="small"
                  type="info"
                  style="margin-right: 4px; margin-bottom: 2px;"
                >
                  {{ skill }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="filteredPersons.length > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[6, 12, 24, 48]"
            layout="total, sizes, prev, pager, next"
            :total="filteredPersons.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑个人信息对话框 -->
    <PersonFormDialog
      v-model="showAddDialog"
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
import { Plus, Edit, User, Search, Refresh, DocumentRemove } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import PersonFormDialog from '../components/PersonFormDialog.vue'
import PersonDetailDialog from '../components/PersonDetailDialog.vue'

export default {
  name: 'UserDashboard',
  components: {
    PersonFormDialog,
    PersonDetailDialog,
    Plus,
    Edit,
    User,
    Search,
    Refresh,
    DocumentRemove
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
    const searchTrigger = ref(0) // 用于手动触发搜索
    
    // 分页
    const currentPage = ref(1)
    const pageSize = ref(12)
    
    // 计算属性
    const skillsArray = computed(() => {
      if (!userPerson.value?.skills) return []
      return userPerson.value.skills.split(/[,，、]/).map(s => s.trim()).filter(s => s)
    })
    
    const filteredPersons = computed(() => {
      // 依赖searchTrigger来手动控制重新计算
      searchTrigger.value // 这行确保当searchTrigger变化时重新计算
      
      let result = persons.value.filter(person => 
        // 过滤掉自己的信息，避免重复显示
        person.id !== userPerson.value?.id
      )
      
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
    const goBack = () => {
      router.push('/')
    }
    
    const loadPersons = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/persons')
        persons.value = response.data.data || []
        console.log('✅ 加载人员列表成功:', persons.value.length, '条记录')
      } catch (error) {
        console.error('❌ 加载人员列表失败:', error)
        ElMessage.error('加载人员列表失败')
      } finally {
        loading.value = false
      }
    }
    
    const loadUserPerson = async () => {
      // 检查用户是否有关联的个人信息ID（兼容两种字段名）
      const personId = authStore.user?.personId || authStore.user?.person_id
      if (!personId) {
        console.log('👤 用户还没有关联的个人信息')
        return
      }
      
      try {
        const response = await axios.get(`/api/persons/${personId}`)
        userPerson.value = response.data.data
        console.log('✅ 加载用户个人信息成功:', userPerson.value)
      } catch (error) {
        console.error('❌ 加载用户个人信息失败:', error)
        // 如果404，说明用户还没有关联的person记录，这是正常的
        if (error.response?.status !== 404) {
          ElMessage.error('加载个人信息失败')
        }
      }
    }
    
    const editMyInfo = () => {
      currentPerson.value = { ...userPerson.value }
      isEdit.value = true
      showAddDialog.value = true
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
      console.log('🔍 用户搜索:', {
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
    
    const handlePersonSaved = () => {
      showAddDialog.value = false
      currentPerson.value = null
      isEdit.value = false
      loadUserPerson()
      loadPersons()
      ElMessage.success(isEdit.value ? '信息更新成功' : '信息添加成功')
    }
    
    const viewPersonDetail = (person) => {
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
      return skills.slice(0, 3) // 只显示前3个技能
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
      filteredPersons,
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
      getStatusTagType,
      getSkillsPreview,
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
  max-width: 1400px; /* 限制最大宽度 */
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  font-size: 16px;
  font-weight: 500;
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
  margin-bottom: 20px;
}

.welcome-content {
  text-align: center;
  padding: 40px 20px;
}

.welcome-icon {
  font-size: 64px;
  color: #409EFF;
  margin-bottom: 20px;
}

.welcome-content h3 {
  color: #333;
  margin-bottom: 16px;
}

.welcome-content p {
  color: #666;
  margin-bottom: 30px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.browse-card {
  margin-bottom: 20px;
  width: 100%;
}

.search-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  width: 100%; /* 确保搜索区域占满宽度 */
  box-sizing: border-box; /* 包含padding在宽度计算内 */
}

.persons-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 20px;
  min-height: 400px; /* 确保始终有最小高度 */
  width: 100%; /* 确保占满容器宽度 */
  align-items: start; /* 防止卡片被拉伸 */
  grid-auto-rows: min-content; /* 行高自适应内容 */
}

/* 确保移动端适配 */
@media screen and (max-width: 1200px) {
  .persons-grid {
    grid-template-columns: repeat(2, minmax(280px, 1fr));
  }
}

@media screen and (max-width: 768px) {
  .persons-grid {
    grid-template-columns: minmax(250px, 1fr);
  }
}

.person-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
  align-self: start;
  min-height: 140px;
  max-height: 200px;
  height: auto;
  display: flex;
  flex-direction: column;
}

.person-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.person-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.person-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.person-info {
  margin-bottom: 12px;
}

.person-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.person-skills {
  margin-top: 12px;
}

.person-skills p {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.skills-preview {
  min-height: 24px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.search-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-buttons .el-button {
  margin: 0;
}

/* 无结果提示样式 */
.no-results {
  grid-column: 1 / -1; /* 占满整个网格宽度 */
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 20px;
}

.no-results-content {
  text-align: center;
  max-width: 400px;
}

.no-results-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 20px;
}

.no-results h3 {
  color: #606266;
  margin-bottom: 12px;
  font-size: 18px;
}

.no-results p {
  color: #909399;
  margin-bottom: 20px;
  line-height: 1.5;
}

.no-results-actions {
  margin-top: 20px;
}
</style>
