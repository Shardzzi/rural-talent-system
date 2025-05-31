<template>
  <div class="admin-dashboard">
    <el-page-header @back="goBack" content="管理员控制台">
      <template #extra>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加人员
        </el-button>
      </template>
    </el-page-header>

    <div class="dashboard-content">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="8">
          <el-card class="stats-card">
            <div class="stats-item">
              <div class="stats-number">{{ totalPersons }}</div>
              <div class="stats-label">总人数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stats-card">
            <div class="stats-item">
              <div class="stats-number">{{ totalUsers }}</div>
              <div class="stats-label">注册用户</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stats-card">
            <div class="stats-item">
              <div class="stats-number">{{ onlineToday }}</div>
              <div class="stats-label">今日活跃</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 搜索和筛选 -->
      <el-card class="search-card">
        <div class="search-form">
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
            <el-col :span="4">
              <el-select 
                v-model="filterAge" 
                placeholder="年龄范围" 
                clearable
                @change="debouncedSearch"
                @clear="debouncedSearch"
                :teleported="false"
              >
                <el-option label="18-25岁" value="18-25" />
                <el-option label="26-35岁" value="26-35" />
                <el-option label="36-45岁" value="36-45" />
                <el-option label="46-55岁" value="46-55" />
                <el-option label="55岁以上" value="55+" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select 
                v-model="filterEducation" 
                placeholder="学历" 
                clearable 
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
            <el-col :span="4">
              <el-select 
                v-model="filterStatus" 
                placeholder="状态" 
                clearable
                @change="debouncedSearch"
                @clear="debouncedSearch"
                :teleported="false"
              >
                <el-option label="在岗" value="在岗" />
                <el-option label="求职中" value="求职中" />
                <el-option label="已退休" value="已退休" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="resetFilters">重置</el-button>
              <el-button type="success" @click="exportData">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 人员列表 -->
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <span>人员信息列表</span>
            <el-button type="text" @click="loadPersons">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <el-table
          :data="filteredPersons"
          v-loading="loading"
          element-loading-text="正在加载..."
          style="width: 100%"
          :row-class-name="tableRowClassName"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="age" label="年龄" width="80" />
          <el-table-column prop="gender" label="性别" width="80" />
          <el-table-column prop="education_level" label="学历" width="120" />
          <el-table-column prop="skills" label="技能专长" min-width="150" show-overflow-tooltip />
          <el-table-column prop="address" label="所在地区" width="120" />
          <el-table-column prop="phone" label="联系电话" width="130" />
          <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
          <el-table-column prop="employment_status" label="就业状态" width="100" />
          <el-table-column prop="created_at" label="创建时间" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="scope">
              <div class="action-buttons">              <el-button type="info" size="small" @click="viewPerson(scope.row)">
                <el-icon><ViewIcon /></el-icon>
                详情
              </el-button>
                <el-button type="primary" size="small" @click="editPerson(scope.row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-popconfirm
                  title="确定删除这条记录吗？"
                  @confirm="deletePerson(scope.row.id)"
                >
                  <template #reference>
                    <el-button type="danger" size="small">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 无结果提示 -->
        <div v-if="!loading && filteredPersons.length === 0" class="no-results">
          <div class="no-results-content">
            <el-icon class="no-results-icon"><DocumentRemove /></el-icon>
            <h3>暂无匹配结果</h3>
            <p v-if="hasActiveFilters">没有找到符合当前筛选条件的人员信息</p>
            <p v-else>暂时还没有人员信息</p>
            <div class="no-results-actions" v-if="hasActiveFilters">
              <el-button type="primary" @click="resetFilters">
                <el-icon><Refresh /></el-icon>
                清空筛选条件
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalCount"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑人员对话框 -->
    <PersonFormDialog
      v-model="showAddDialog"
      :person="currentPerson"
      :is-edit="isEdit"
      @saved="handlePersonSaved"
    />

    <!-- 人员详情对话框 -->
    <PersonDetailDialog
      v-model="showDetailDialog"
      :person="currentPerson"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Download, Refresh, Edit, Delete, View as ViewIcon, DocumentRemove } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import PersonFormDialog from '../components/PersonFormDialog.vue'
import PersonDetailDialog from '../components/PersonDetailDialog.vue'

export default {
  name: 'AdminDashboard',
  components: {
    PersonFormDialog,
    PersonDetailDialog,
    Plus,
    Search,
    Download,
    Refresh,
    Edit,
    Delete,
    ViewIcon,
    DocumentRemove
  },
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const loading = ref(false)
    const persons = ref([])
    const showAddDialog = ref(false)
    const showDetailDialog = ref(false)
    const currentPerson = ref(null)
    const isEdit = ref(false)
    
    // 搜索和筛选
    const searchKeyword = ref('')
    const filterAge = ref('')
    const filterEducation = ref('')
    const filterStatus = ref('')
    const searchTrigger = ref(0) // 用于手动触发搜索
    
    // 分页
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalCount = ref(0)
    
    // 统计数据
    const stats = reactive({
      totalPersons: 0,
      totalUsers: 0,
      onlineToday: 0
    })
    
    // 计算属性
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
      
      if (filterAge.value) {
        result = result.filter(person => {
          const age = person.age
          if (filterAge.value === '18-25') return age >= 18 && age <= 25
          if (filterAge.value === '26-35') return age >= 26 && age <= 35
          if (filterAge.value === '36-45') return age >= 36 && age <= 45
          if (filterAge.value === '46-55') return age >= 46 && age <= 55
          if (filterAge.value === '55+') return age > 55
          return true
        })
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
    
    const hasActiveFilters = computed(() => {
      return searchKeyword.value || filterAge.value || filterEducation.value || filterStatus.value
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
        stats.totalPersons = persons.value.length
        totalCount.value = persons.value.length
        console.log('✅ 加载人员列表成功:', persons.value.length, '条记录')
      } catch (error) {
        console.error('❌ 加载人员列表失败:', error)
        ElMessage.error('加载人员列表失败')
      } finally {
        loading.value = false
      }
    }
    
    const loadStats = async () => {
      try {
        // TODO: 实现统计API
        stats.totalUsers = 25
        stats.onlineToday = 12
      } catch (error) {
        console.error('加载统计数据失败:', error)
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
      console.log('🔍 搜索条件:', {
        keyword: searchKeyword.value,
        age: filterAge.value,
        education: filterEducation.value,
        status: filterStatus.value
      })
    }
    
    const resetFilters = () => {
      searchKeyword.value = ''
      filterAge.value = ''
      filterEducation.value = ''
      filterStatus.value = ''
      currentPage.value = 1
    }

    const viewPerson = (person) => {
      currentPerson.value = { ...person }
      showDetailDialog.value = true
    }

    const editPerson = async (person) => {
      try {
        // 获取完整的人员详细信息，包括扩展数据
        const response = await axios.get(`/api/persons/${person.id}/details`)
        currentPerson.value = response.data.data
        isEdit.value = true
        showAddDialog.value = true
        console.log('✅ 获取完整人员信息成功:', currentPerson.value)
      } catch (error) {
        console.error('❌ 获取人员详细信息失败:', error)
        // 如果获取详细信息失败，降级使用基本信息
        currentPerson.value = { ...person }
        isEdit.value = true
        showAddDialog.value = true
        ElMessage.warning('无法获取完整信息，将使用基本信息编辑')
      }
    }
    
    const deletePerson = async (id) => {
      try {
        await axios.delete(`/api/persons/${id}`)
        ElMessage.success('删除成功')
        loadPersons()
      } catch (error) {
        console.error('删除失败:', error)
        ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
      }
    }
    
    const handlePersonSaved = () => {
      showAddDialog.value = false
      currentPerson.value = null
      isEdit.value = false
      loadPersons()
    }
    
    const exportData = () => {
      // TODO: 实现数据导出功能
      ElMessage.info('导出功能开发中...')
    }
    
    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1
    }
    
    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
    }
    
    const tableRowClassName = ({ rowIndex }) => {
      return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleString('zh-CN')
    }
    
    // 生命周期
    onMounted(() => {
      loadPersons()
      loadStats()
    })
    
    return {
      loading,
      persons,
      filteredPersons,
      hasActiveFilters,
      showAddDialog,
      showDetailDialog,
      currentPerson,
      isEdit,
      searchKeyword,
      filterAge,
      filterEducation,
      filterStatus,
      currentPage,
      pageSize,
      totalCount,
      totalPersons: computed(() => stats.totalPersons),
      totalUsers: computed(() => stats.totalUsers),
      onlineToday: computed(() => stats.onlineToday),
      goBack,
      loadPersons,
      handleSearch,
      debouncedSearch,
      resetFilters,
      viewPerson,
      editPerson,
      deletePerson,
      handlePersonSaved,
      exportData,
      handleSizeChange,
      handleCurrentChange,
      tableRowClassName,
      formatDate
    }
  }
}
</script>

<style scoped>
/* 优化容器宽度和布局，与用户界面保持一致 */
.admin-dashboard {
  width: 100%;
  max-width: 1400px; /* 限制最大宽度 */
  margin: 0 auto; /* 居中对齐 */
  padding: 20px;
}

.dashboard-content {
  width: 100%;
  margin-top: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-item {
  padding: 20px;
}

.stats-number {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  padding: 10px 0;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

:deep(.even-row) {
  background-color: #fafafa;
}

:deep(.odd-row) {
  background-color: #ffffff;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
}

.action-buttons .el-button {
  margin: 0;
}

/* 无结果提示样式 */
.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 20px;
  margin: 20px 0;
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
