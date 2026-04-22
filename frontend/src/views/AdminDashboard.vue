<template>
  <div class="admin-dashboard">
    <el-page-header @back="goBack" content="管理员控制台">
      <template #extra>
        <el-button type="success" @click="showImportDialog = true">
          <el-icon><Upload /></el-icon>
          导入数据
        </el-button>
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
          <el-card class="stats-card stats-blue">
            <el-icon class="bg-icon"><User /></el-icon>
            <div class="stats-item">
              <el-icon class="stats-icon"><User /></el-icon>
              <div class="stats-info">
                <div class="stats-number">{{ totalPersons }}</div>
                <div class="stats-label">总人数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="stats-card stats-green">
            <el-icon class="bg-icon"><UserFilled /></el-icon>
            <div class="stats-item">
              <el-icon class="stats-icon"><UserFilled /></el-icon>
              <div class="stats-info">
                <div class="stats-number">{{ totalUsers }}</div>
                <div class="stats-label">注册用户</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="stats-card stats-orange">
            <el-icon class="bg-icon"><Timer /></el-icon>
            <div class="stats-item">
              <el-icon class="stats-icon"><Timer /></el-icon>
              <div class="stats-info">
                <div class="stats-number">{{ onlineToday }}</div>
                <div class="stats-label">今日活跃</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 搜索和筛选 -->
      <el-card class="search-card">
        <div class="search-form">
          <!-- 快捷筛选标签 -->
          <QuickFilterTags
            :current-filters="currentFilterState"
            @apply="applyFilters"
          />

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
              <SavedSearches
                ref="savedSearchesRef"
                :current-filters="currentFilterState"
                @apply="applyFilters"
                @delete="handleDeleteSavedSearch"
                @save="handleSaveSearch"
              />
              <SearchHistory
                ref="searchHistoryRef"
                @apply="applyFilters"
              />
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

        <BatchActionBar
          :selected-count="selectedRows.length"
          @batch-delete="handleBatchDelete"
          @batch-update="handleBatchUpdate"
          @export-selected="exportData"
        />

        <PersonTable
          :data="paginatedPersons"
          role="admin"
          :loading="loading"
          :total="totalCount"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          show-expand
          show-selection
          @page-change="handleCurrentChange"
          @size-change="handleSizeChange"
          @row-click="viewPerson"
          @selection-change="handleSelectionChange"
        >
          <template #actions>
            <el-table-column label="操作" :width="isMobile ? 120 : 240" fixed="right">
              <template #default="scope">
                <div class="action-buttons">
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
          </template>
        </PersonTable>
      </el-card>
    </div>

    <!-- 添加/编辑人员对话框 -->
    <PersonFormWizard
      :visible="showAddDialog"
      @update:visible="showAddDialog = $event"
      :person="currentPerson"
      :is-edit="isEdit"
      @saved="handlePersonSaved"
    />

    <!-- 人员详情对话框 -->
    <PersonDetailDialog
      v-model="showDetailDialog"
      :person="currentPerson"
    />

    <ImportDialog
      :visible="showImportDialog"
      @update:visible="showImportDialog = $event"
      @imported="handleImportDone"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Download, Refresh, Edit, Delete, View as ViewIcon, MoreFilled, User, UserFilled, Timer, Upload } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import PersonFormWizard from '../components/person-form/PersonFormWizard.vue'
import PersonDetailDialog from '../components/PersonDetailDialog.vue'
import PersonTable from '../components/person-table/PersonTable.vue'
import BatchActionBar from '../components/batch/BatchActionBar.vue'
import ImportDialog from '../components/batch/ImportDialog.vue'
import QuickFilterTags from '../components/search/QuickFilterTags.vue'
import SavedSearches from '../components/search/SavedSearches.vue'
import SearchHistory from '../components/search/SearchHistory.vue'
import { useSavedSearches } from '../composables/useSavedSearches'
import { useStatePreservation } from '../composables/useStatePreservation'

export default {
  name: 'AdminDashboard',
  components: {
    PersonFormWizard,
    PersonDetailDialog,
    PersonTable,
    BatchActionBar,
    ImportDialog,
    Plus,
    Search,
    Download,
    Refresh,
    Edit,
    Delete,
    ViewIcon,
    MoreFilled,
    User,
    UserFilled,
    Timer,
    Upload
  },
  setup() {
    const router = useRouter()
    const { saveState, restoreState, clearSectionState } = useStatePreservation()
    
    // 响应式数据
    const loading = ref(false)
    const persons = ref([])
    const showAddDialog = ref(false)
    const showDetailDialog = ref(false)
    const showImportDialog = ref(false)
    const currentPerson = ref(null)
    const isEdit = ref(false)
    const selectedRows = ref([])
    
    // 搜索和筛选
    const searchKeyword = ref('')
    const filterAge = ref('')
    const filterEducation = ref('')
    const filterStatus = ref('')
    const showAdvancedFilters = ref(false) // 是否显示高级筛选

    // 搜索辅助功能
    const { saveSearch, deleteSavedSearch, addToHistory } = useSavedSearches()
    const savedSearchesRef = ref(null)
    const searchHistoryRef = ref(null)

    const currentFilterState = computed(() => ({
      searchKeyword: searchKeyword.value,
      filterAge: filterAge.value,
      filterEducation: filterEducation.value,
      filterStatus: filterStatus.value,
    }))
    
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
    const hasActiveFilters = computed(() => {
      return searchKeyword.value || filterAge.value || filterEducation.value || filterStatus.value
    })
    
    const paginatedPersons = computed(() => {
      return persons.value
    })

    const buildPreservedState = () => ({
      searchKeyword: searchKeyword.value,
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      filters: {
        age: filterAge.value,
        education: filterEducation.value,
        status: filterStatus.value,
        advancedFiltersVisible: showAdvancedFilters.value
      },
      scrollY: window.scrollY
    })

    const restorePreservedState = () => {
      const saved = restoreState()
      if (!saved) return false

      searchKeyword.value = saved.searchKeyword ?? ''
      currentPage.value = saved.currentPage ?? 1
      pageSize.value = saved.pageSize ?? 20

      const filters = saved.filters || {}
      filterAge.value = String(filters.age || '')
      filterEducation.value = String(filters.education || '')
      filterStatus.value = String(filters.status || '')
      showAdvancedFilters.value = Boolean(filters.advancedFiltersVisible)

      loadPersons()

      if (typeof saved.scrollY === 'number') {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: saved.scrollY, behavior: 'auto' })
        })
      }

      return true
    }
    
    // 方法
    const goBack = () => {
      router.push('/')
    }
    
    const loadPersons = async () => {
      loading.value = true
      try {
        let response
        if (hasActiveFilters.value) {
          // 构建搜索参数
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
          if (filterAge.value) {
            if (filterAge.value === '18-25') { params.minAge = 18; params.maxAge = 25 }
            else if (filterAge.value === '26-35') { params.minAge = 26; params.maxAge = 35 }
            else if (filterAge.value === '36-45') { params.minAge = 36; params.maxAge = 45 }
            else if (filterAge.value === '46-55') { params.minAge = 46; params.maxAge = 55 }
            else if (filterAge.value === '55+') { params.minAge = 56 }
          }
          response = await axios.get('/api/search', { params })
        } else {
          // 获取所有人
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
        currentPage.value = 1
        loadPersons()
      }, 500)
    }
    
    const handleSearch = () => {
      currentPage.value = 1
      loadPersons()
      if (hasActiveFilters.value) {
        recordSearchHistory()
      }
    }
    
    const resetFilters = () => {
      searchKeyword.value = ''
      filterAge.value = ''
      filterEducation.value = ''
      filterStatus.value = ''
      currentPage.value = 1
      loadPersons()
    }

    onBeforeRouteLeave((to, from, next) => {
      saveState(buildPreservedState())

      if (from.name !== to.name) {
        clearSectionState()
      }

      next()
    })

    const applyFilters = (filters) => {
      searchKeyword.value = String(filters.searchKeyword || '')
      filterAge.value = String(filters.filterAge || '')
      filterEducation.value = String(filters.filterEducation || '')
      filterStatus.value = String(filters.filterStatus || '')
      currentPage.value = 1
      loadPersons()
    }

    const handleDeleteSavedSearch = (id) => {
      deleteSavedSearch(id)
      if (savedSearchesRef.value) {
        savedSearchesRef.value.refreshList()
      }
    }

    const handleSaveSearch = (name) => {
      saveSearch(name, {
        searchKeyword: searchKeyword.value,
        filterAge: filterAge.value,
        filterEducation: filterEducation.value,
        filterStatus: filterStatus.value,
      })
      if (savedSearchesRef.value) {
        savedSearchesRef.value.refreshList()
      }
    }

    const recordSearchHistory = () => {
      addToHistory(searchKeyword.value, {
        searchKeyword: searchKeyword.value,
        filterAge: filterAge.value,
        filterEducation: filterEducation.value,
        filterStatus: filterStatus.value,
      })
      if (searchHistoryRef.value) {
        searchHistoryRef.value.refreshList()
      }
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
      loadPersons()
    }
    
    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
      loadPersons()
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

    const handleSelectionChange = (rows) => {
      selectedRows.value = rows
    }

    const handleBatchDelete = async () => {
      const ids = selectedRows.value.map(r => r.id)
      loading.value = true
      try {
        await axios.post('/api/batch/delete', { ids })
        ElMessage.success(`成功删除 ${ids.length} 条记录`)
        selectedRows.value = []
        await loadPersons()
        await loadStats()
      } catch (error) {
        ElMessage.error('批量删除失败: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }

    const handleBatchUpdate = async (updates) => {
      const ids = selectedRows.value.map(r => r.id)
      loading.value = true
      try {
        const response = await axios.put('/api/batch/update', { ids, updates })
        ElMessage.success(response.data.message || `成功更新 ${ids.length} 条记录`)
        selectedRows.value = []
        await loadPersons()
      } catch (error) {
        ElMessage.error('批量更新失败: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }

    const handleImportDone = () => {
      showImportDialog.value = false
      loadPersons()
      loadStats()
    }
    
    // 生命周期
    onMounted(() => {
      const restored = restorePreservedState()
      if (!restored) {
        loadPersons()
      }
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
      paginatedPersons,
      hasActiveFilters,
      showAddDialog,
      showDetailDialog,
      showImportDialog,
      currentPerson,
      isEdit,
      selectedRows,
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
      applyFilters,
      handleDeleteSavedSearch,
      handleSaveSearch,
      currentFilterState,
      savedSearchesRef,
      searchHistoryRef,
      viewPerson,
      editPerson,
      deletePerson,
      confirmDelete,
      handlePersonSaved,
      exportData,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      handleBatchDelete,
      handleBatchUpdate,
      handleImportDone
    }
  }
}
</script>

<style scoped>
/* 优化容器宽度和布局，与用户界面保持一致 */
.admin-dashboard {
  width: 100%;
  max-width: 1400px;
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
  text-align: left;
  transition: all 0.3s ease-in-out;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stats-blue { border-left: 4px solid #409EFF; }
.stats-green { border-left: 4px solid #67C23A; }
.stats-orange { border-left: 4px solid #E6A23C; }

.stats-item {
  padding: 16px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.stats-icon {
  font-size: 48px;
  margin-right: 16px;
  opacity: 0.9;
}

.stats-blue .stats-icon { color: #409EFF; }
.stats-green .stats-icon { color: #67C23A; }
.stats-orange .stats-icon { color: #E6A23C; }

.stats-info {
  display: flex;
  flex-direction: column;
}

.stats-number {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 4px;
  line-height: 1;
}

.stats-blue .stats-number { color: #409EFF; }
.stats-green .stats-number { color: #67C23A; }
.stats-orange .stats-number { color: #E6A23C; }

.stats-label {
  font-size: 15px;
  color: #606266;
  font-weight: 500;
}

.bg-icon {
  position: absolute;
  right: -20px;
  bottom: -20px;
  font-size: 140px;
  opacity: 0.05;
  z-index: 0;
  transform: rotate(-15deg);
  pointer-events: none;
}

.stats-blue .bg-icon { color: #409EFF; }
.stats-green .bg-icon { color: #67C23A; }
.stats-orange .bg-icon { color: #E6A23C; }

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
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
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.table-card :deep(.el-card__header) {
  background-color: #fcfcfd;
  border-bottom: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
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
}
</style>
