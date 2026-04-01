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
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="stats-card">
            <div class="stats-item">
              <div class="stats-number">{{ totalPersons }}</div>
              <div class="stats-label">总人数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="stats-card">
            <div class="stats-item">
              <div class="stats-number">{{ totalUsers }}</div>
              <div class="stats-label">注册用户</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
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
          <!-- 第一行：搜索框 -->
          <el-row :gutter="20" class="search-row">
            <el-col :xs="24" :sm="18" :md="12" :lg="8">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索姓名、技能、地区"
                clearable
                @clear="debouncedSearch"
                @input="debouncedSearch"
                @keyup.enter="handleSearch"
                size="default"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :xs="24" :sm="6" :md="12" :lg="16" class="action-col">
              <el-button type="primary" @click="handleSearch" :loading="loading" size="default">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="resetFilters" size="default" v-if="hasActiveFilters">
                重置
              </el-button>
            </el-col>
          </el-row>

          <!-- 第二行：筛选条件 -->
          <el-row :gutter="20" class="filter-row" v-show="showAdvancedFilters || hasActiveFilters">
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <el-select
                v-model="filterAge"
                placeholder="年龄范围"
                clearable
                @change="debouncedSearch"
                @clear="debouncedSearch"
                :teleported="false"
                size="default"
              >
                <el-option label="18-25岁" value="18-25" />
                <el-option label="26-35岁" value="26-35" />
                <el-option label="36-45岁" value="36-45" />
                <el-option label="46-55岁" value="46-55" />
                <el-option label="55岁以上" value="55+" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <el-select
                v-model="filterEducation"
                placeholder="学历"
                clearable
                @change="debouncedSearch"
                @clear="debouncedSearch"
                :teleported="false"
                size="default"
              >
                <el-option label="高中及以下" value="高中及以下" />
                <el-option label="专科" value="专科" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士及以上" value="硕士及以上" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <el-select
                v-model="filterStatus"
                placeholder="状态"
                clearable
                @change="debouncedSearch"
                @clear="debouncedSearch"
                :teleported="false"
                size="default"
              >
                <el-option label="在岗" value="在岗" />
                <el-option label="求职中" value="求职中" />
                <el-option label="已退休" value="已退休" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="24" :md="6" :lg="8" class="filter-action-col">
              <el-button
                type="success"
                @click="exportData"
                size="default"
                class="export-btn"
              >
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
              <el-button
                type="text"
                @click="showAdvancedFilters = !showAdvancedFilters"
                size="default"
                class="toggle-filters-btn"
              >
                {{ showAdvancedFilters ? '收起筛选' : '展开筛选' }}
                <el-icon>
                  <component :is="showAdvancedFilters ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
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
          :data="paginatedPersons"
          v-loading="loading"
          element-loading-text="正在加载..."
          style="width: 100%"
          :row-class-name="tableRowClassName"
          :default-sort="{ prop: 'created_at', order: 'descending' }"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-content">
                <div class="expand-row">
                  <span class="expand-label">邮箱:</span>
                  <span class="expand-value">{{ row.email || '未填写' }}</span>
                </div>
                <div class="expand-row">
                  <span class="expand-label">电话:</span>
                  <span class="expand-value">{{ row.phone || '未填写' }}</span>
                </div>
                <div class="expand-row">
                  <span class="expand-label">技能专长:</span>
                  <span class="expand-value">{{ row.skills || '未填写' }}</span>
                </div>
                <div class="expand-row">
                  <span class="expand-label">创建时间:</span>
                  <span class="expand-value">{{ formatDate(row.created_at) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" :width="60" />
          <el-table-column prop="name" label="姓名" min-width="80" :width="100" />
          <el-table-column prop="age" label="年龄" :width="60" />
          <el-table-column prop="gender" label="性别" :width="60" />
          <el-table-column prop="education_level" label="学历" :width="100" class-name="hidden-xs-only" />
          <el-table-column prop="skills" label="技能专长" min-width="120" show-overflow-tooltip class-name="hidden-sm-and-down" />
          <el-table-column prop="address" label="所在地区" min-width="100" show-overflow-tooltip class-name="hidden-sm-only" />
          <el-table-column prop="phone" label="联系电话" min-width="110" show-overflow-tooltip class-name="hidden-md-only" />
          <el-table-column prop="email" label="邮箱" min-width="150" show-overflow-tooltip class-name="hidden-lg-only" />
          <el-table-column prop="employment_status" label="就业状态" :width="90" class-name="hidden-xs-only" />
          <el-table-column prop="created_at" label="创建时间" :width="160" class-name="hidden-md-and-down">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" :width="isMobile ? 120 : 240" fixed="right">
            <template #default="scope">
              <div class="action-buttons">
                <!-- 移动端显示图标按钮 -->
                <template v-if="isMobile">
                  <el-dropdown trigger="click">
                    <el-button type="primary" size="small">
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="viewPerson(scope.row)">
                          <el-icon><ViewIcon /></el-icon>
                          详情
                        </el-dropdown-item>
                        <el-dropdown-item @click="editPerson(scope.row)">
                          <el-icon><Edit /></el-icon>
                          编辑
                        </el-dropdown-item>
                        <el-dropdown-item @click="confirmDelete(scope.row)" class="danger-item">
                          <el-icon><Delete /></el-icon>
                          删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
                <!-- 桌面端显示完整按钮 -->
                <template v-else>
                  <el-button type="info" size="small" @click="viewPerson(scope.row)">
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
                </template>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 无结果提示 -->
        <div v-if="!loading && paginatedPersons.length === 0" class="no-results">
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
            :total="filteredPersons.length"
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Download, Refresh, Edit, Delete, View as ViewIcon, DocumentRemove, MoreFilled } from '@element-plus/icons-vue'
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
    DocumentRemove,
    MoreFilled
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
    const showAdvancedFilters = ref(false) // 是否显示高级筛选
    
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

    // 响应式计算
    const isMobile = computed(() => {
      return window.innerWidth < 768
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
    
    const paginatedPersons = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredPersons.value.slice(start, end)
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
        totalCount.value = persons.value.length
      } catch (error) {
        ElMessage.error('加载人员列表失败')
      } finally {
        loading.value = false
      }
    }
    
    const loadStats = async () => {
      try {
        const response = await axios.get('/api/statistics')
        const data = response.data?.data || response.data || {}

        stats.totalPersons = data.totalTalents ?? 0
        stats.totalUsers = data.recentRegistrations?.total ?? 0
        stats.onlineToday = data.recentRegistrations?.last7Days ?? 0
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
      loading.value = true
      try {
        const response = await axios.get(`/api/persons/${person.id}/details`)
        currentPerson.value = response.data.data
        isEdit.value = true
        showAddDialog.value = true
      } catch (error) {
        currentPerson.value = { ...person }
        isEdit.value = true
        showAddDialog.value = true
        ElMessage.warning('无法获取完整信息，将使用基本信息编辑')
      } finally {
        loading.value = false
      }
    }
    
    const deletePerson = async (id) => {
      loading.value = true
      try {
        await axios.delete(`/api/persons/${id}`)
        ElMessage.success('删除成功')
        await loadPersons()
        await loadStats()
      } catch (error) {
        ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }
    
    const handlePersonSaved = () => {
      showAddDialog.value = false
      currentPerson.value = null
      isEdit.value = false
      loadPersons()
      loadStats()
    }
    
    const exportData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          ElMessage.warning('请先登录后再导出数据')
          return
        }

        // 构建导出参数，与当前筛选条件保持一致
        const params = {}
        if (searchKeyword.value) params.name = searchKeyword.value
        if (filterStatus.value) params.employment_status = filterStatus.value
        if (filterEducation.value) {
          // 只传递精确匹配的学历
          if (['专科', '本科'].includes(filterEducation.value)) {
            params.education_level = filterEducation.value
          }
        }
        if (filterAge.value) {
          if (filterAge.value === '18-25') { params.minAge = 18; params.maxAge = 25 }
          else if (filterAge.value === '26-35') { params.minAge = 26; params.maxAge = 35 }
          else if (filterAge.value === '36-45') { params.minAge = 36; params.maxAge = 45 }
          else if (filterAge.value === '46-55') { params.minAge = 46; params.maxAge = 55 }
          else if (filterAge.value === '55+') { params.minAge = 56 }
        }

        const response = await axios.get('/api/persons/export', {
          headers: { Authorization: `Bearer ${token}` },
          params: params,
          responseType: 'blob'
        })
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const contentDisposition = response.headers['content-disposition']
        let filename = '人才信息导出.csv'
        if (contentDisposition) {
          const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?(.+)/)
          if (match) {
            filename = decodeURIComponent(match[1].replace(/"/g, ''))
          }
        }
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        ElMessage.success('数据导出成功')
      } catch (error) {
        ElMessage.error('导出失败: ' + (error.response?.data?.message || error.message))
      }
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

    const confirmDelete = (person) => {
      ElMessageBox.confirm(`确定要删除人员 "${person.name}" 吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deletePerson(person.id)
      }).catch(() => {
        // 用户取消删除
      })
    }
    
    // 生命周期
    onMounted(() => {
      loadPersons()
      loadStats()
    })
    
    onUnmounted(() => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    })
    
    return {
      loading,
      persons,
      filteredPersons,
      paginatedPersons,
      hasActiveFilters,
      showAddDialog,
      showDetailDialog,
      currentPerson,
      isEdit,
      searchKeyword,
      filterAge,
      filterEducation,
      filterStatus,
      showAdvancedFilters,
      currentPage,
      pageSize,
      totalCount,
      isMobile,
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
      confirmDelete,
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

/* 移动端适配 */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 10px;
  }
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
  transition: transform 0.2s ease-in-out;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-item {
  padding: 20px;
}

.stats-number {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
  line-height: 1;
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

.search-row {
  margin-bottom: 10px;
}

.filter-row {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.action-col {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}

.filter-action-col {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}

.export-btn {
  margin-left: auto;
}

.toggle-filters-btn {
  color: #909399;
}

/* 响应式统计卡片 */
@media (max-width: 576px) {
  .stats-number {
    font-size: 24px;
  }

  .stats-label {
    font-size: 12px;
  }

  .stats-item {
    padding: 15px 10px;
  }
}

/* 搜索表单响应式 */
@media (max-width: 768px) {
  .action-col,
  .filter-action-col {
    justify-content: center;
    margin-top: 10px;
  }

  .search-row {
    margin-bottom: 15px;
  }

  .export-btn {
    margin-left: 0;
  }
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

/* 表格行样式 */
:deep(.even-row) {
  background-color: #fafafa;
}

:deep(.odd-row) {
  background-color: #ffffff;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
}

.action-buttons .el-button {
  margin: 0;
  min-width: auto;
}

/* 移动端表格样式 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .action-buttons {
    justify-content: center;
    gap: 5px;
  }

  :deep(.el-table) {
    font-size: 14px;
  }

  :deep(.el-table .cell) {
    padding: 8px 5px;
  }

  :deep(.el-table th) {
    padding: 8px 5px;
  }
}

/* 表格展开行样式 */
.expand-content {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin: 10px;
}

.expand-row {
  display: flex;
  margin-bottom: 8px;
  align-items: center;
}

.expand-row:last-child {
  margin-bottom: 0;
}

.expand-label {
  font-weight: bold;
  color: #606266;
  min-width: 80px;
  margin-right: 10px;
}

.expand-value {
  color: #303133;
  flex: 1;
}

/* 分页响应式 */
@media (max-width: 768px) {
  .pagination-wrapper {
    text-align: center;
  }

  :deep(.el-pagination) {
    justify-content: center;
  }

  :deep(.el-pagination .el-pagination__sizes),
  :deep(.el-pagination .el-pagination__jump) {
    display: none;
  }
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
