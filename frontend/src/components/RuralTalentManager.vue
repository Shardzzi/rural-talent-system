<template>
  <div class="rural-talent-manager">
    <!-- 顶部操作栏 -->
    <div class="header-actions">
      <el-row :gutter="20" align="middle" justify="space-between">
        <el-col :span="12">
          <el-input
            v-model="searchQuery"
            placeholder="搜索人才（姓名、技能、作物、年龄）"
            clearable
            @input="handleSearch"
            class="search-input">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="12" class="text-right">
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增人才档案
          </el-button>
          <el-button :icon="Download" @click="handleExport">
            导出数据
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalTalents }}</div>
              <div class="stat-label">总人才数</div>
            </div>
            <el-icon class="stat-icon"><User /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ stats.avgFarmingYears }}</div>
              <div class="stat-label">平均农业经验(年)</div>
            </div>
            <el-icon class="stat-icon"><Calendar /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalSkills }}</div>
              <div class="stat-label">技能总数</div>
            </div>
            <el-icon class="stat-icon"><Trophy /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ stats.cooperationIntentions }}</div>
              <div class="stat-label">合作意向</div>
            </div>
            <el-icon class="stat-icon"><Connection /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 人才列表 -->
    <el-card shadow="never" class="talent-list-card">
      <template #header>
        <div class="card-header">
          <span>人才档案列表</span>
          <el-dropdown @command="handleFilterCommand">
            <el-button type="text">
              筛选 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="all">全部人才</el-dropdown-item>
                <el-dropdown-item command="planting">种植人才</el-dropdown-item>
                <el-dropdown-item command="breeding">养殖人才</el-dropdown-item>
                <el-dropdown-item command="processing">加工人才</el-dropdown-item>
                <el-dropdown-item command="marketing">营销人才</el-dropdown-item>
                <el-dropdown-item command="management">管理人才</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>

      <el-table 
        :data="filteredTalents" 
        :loading="loading"
        @sort-change="handleSortChange"
        style="width: 100%"
        size="default">
        
        <el-table-column prop="name" label="姓名" width="100" fixed="left" />
        <el-table-column prop="age" label="年龄" width="60" sortable="custom" />
        <el-table-column prop="farming_years" label="农业经验" width="90" sortable="custom">
          <template #default="scope">
            {{ scope.row.rural_profile?.farming_years || 0 }}年
          </template>
        </el-table-column>
        <el-table-column prop="main_crops" label="主要作物" width="150">
          <template #default="scope">
            <el-tag 
              v-for="crop in getJSONArray(scope.row.rural_profile?.main_crops).slice(0, 2)" 
              :key="crop"
              size="small"
              style="margin-right: 4px; margin-bottom: 2px;">
              {{ crop }}
            </el-tag>
            <span v-if="getJSONArray(scope.row.rural_profile?.main_crops).length > 2" 
                  class="more-items">
              +{{ getJSONArray(scope.row.rural_profile?.main_crops).length - 2 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="skills" label="主要技能" width="120">
          <template #default="scope">
            <el-tag 
              v-for="skill in scope.row.skills?.slice(0, 1)" 
              :key="skill.id"
              :type="getSkillTagType(skill.category)"
              size="small"
              style="margin-right: 4px; margin-bottom: 2px;">
              {{ skill.skill_name }}
            </el-tag>
            <span v-if="scope.row.skills?.length > 1" class="more-items">
              +{{ scope.row.skills.length - 1 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cooperation_willingness" label="合作意愿" width="90">
          <template #default="scope">
            <el-tag 
              :type="getCooperationTagType(scope.row.rural_profile?.cooperation_willingness)"
              size="small">
              {{ getCooperationDisplay(scope.row.rural_profile?.cooperation_willingness) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleView(scope.row)">
                查看详情
              </el-button>
              <el-button size="small" @click="handleEdit(scope.row)">
                编辑
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="handleDelete(scope.row)"
                :loading="scope.row.deleting">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="total > pageSize"
        style="margin-top: 20px; justify-content: center;"
        background
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 人才档案表单 -->
    <RuralTalentForm
      v-model:visible="dialogVisible"
      :person-data="currentPerson"
      :is-edit="isEdit"
      :submitting="submitting"
      @submit="handleSubmit"
      @cancel="closeDialog"
    />

    <!-- 详情查看对话框 -->
    <el-dialog 
      v-model="viewDialogVisible" 
      title="人才档案详情" 
      width="70%"
      max-height="80vh">
      <TalentDetailView 
        v-if="viewDialogVisible" 
        :person-data="viewPersonData" 
      />
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Plus, Download, User, Calendar, Trophy, Connection, 
  ArrowDown 
} from '@element-plus/icons-vue'
import RuralTalentForm from './RuralTalentForm.vue'
import TalentDetailView from './TalentDetailView.vue'
import personService from '../api/persons.js'

export default {
  name: 'RuralTalentManager',
  components: {
    RuralTalentForm,
    TalentDetailView
  },
  setup() {
    // 响应式数据
    const talents = ref([])
    const loading = ref(false)
    const submitting = ref(false)
    const searchQuery = ref('')
    const filterType = ref('all')
    
    // 分页
    const total = ref(0)
    const pageSize = ref(10)
    const currentPage = ref(1)
    const sortBy = ref('id')
    const sortOrder = ref('ascending')
    
    // 表单状态
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const currentPerson = ref({})
    
    // 详情查看
    const viewDialogVisible = ref(false)
    const viewPersonData = ref({})
    
    // 统计数据
    const stats = reactive({
      totalTalents: 0,
      avgFarmingYears: 0,
      totalSkills: 0,
      cooperationIntentions: 0
    })

    // 计算属性
    const filteredTalents = computed(() => {
      let result = talents.value
      
      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(talent => 
          talent.name.toLowerCase().includes(query) ||
          talent.skills?.some(skill => 
            skill.skill_name.toLowerCase().includes(query)
          ) ||
          talent.rural_profile?.main_crops?.toLowerCase().includes(query) ||
          talent.age.toString().includes(query)
        )
      }
      
      // 技能类型过滤
      if (filterType.value !== 'all') {
        result = result.filter(talent => 
          talent.skills?.some(skill => 
            skill.category === filterType.value
          )
        )
      }
      
      return result
    })

    // 方法
    const fetchTalents = async () => {
      console.log('📋 开始获取人才数据...')
      loading.value = true
      try {
        console.log('🔄 调用 personService.getPersons()')
        const data = await personService.getPersons()
        console.log('✅ 获取到基础人才数据:', data)
        
        // 获取每个人才的详细信息
        console.log('🔍 开始获取详细信息...')
        const detailedTalents = await Promise.all(
          data.map(async (person) => {
            try {
              console.log(`📝 获取人员 ${person.name} (ID: ${person.id}) 的详细信息`)
              const detailsResponse = await personService.getPersonDetails(person.id)
              console.log(`✅ 获取到详细信息响应:`, detailsResponse)
              
              // 正确提取数据：API返回 {success: true, data: {...}}
              const details = detailsResponse.data || detailsResponse
              console.log(`📊 处理后的详细信息:`, details)
              
              return { 
                ...person, 
                rural_profile: details.ruralProfile,
                skills: details.skills,
                cooperation: details.cooperation
              }
            } catch (error) {
              console.warn(`❌ 获取人员 ${person.id} 详细信息失败:`, error)
              return person
            }
          })
        )
        
        console.log('📊 处理完成的详细人才数据:', detailedTalents)
        talents.value = detailedTalents
        total.value = detailedTalents.length
        updateStats(detailedTalents)
        
        // 加载统计数据
        console.log('📈 开始加载统计数据...')
        await loadStatistics()
      } catch (error) {
        console.error('❌ 获取人才数据失败:', error)
        ElMessage.error('获取人才数据失败')
      } finally {
        loading.value = false
        console.log('🏁 fetchTalents 完成')
      }
    }

    const updateStats = (talentData) => {
      // 本地计算统计数据（作为后备）
      stats.totalTalents = talentData.length
      
      const farmingYears = talentData
        .map(t => t.rural_profile?.farming_years || 0)
        .filter(y => y > 0)
      stats.avgFarmingYears = farmingYears.length > 0 
        ? Math.round(farmingYears.reduce((a, b) => a + b, 0) / farmingYears.length)
        : 0
      
      stats.totalSkills = talentData.reduce((sum, t) => sum + (t.skills?.length || 0), 0)
      
      stats.cooperationIntentions = talentData.filter(t => 
        t.rural_profile?.cooperation_willingness === '强烈'
      ).length
    }

    // 从API加载统计数据
    const loadStatistics = async () => {
      console.log('📊 开始加载统计数据...')
      try {
        console.log('🔄 调用 personService.getStatistics()')
        const statisticsData = await personService.getStatistics()
        console.log('✅ 获取到统计数据:', statisticsData)
        
        // 更新统计卡片数据
        stats.totalTalents = statisticsData.totalTalents || 0
        stats.avgFarmingYears = statisticsData.agriculture?.avgFarmingYears || 0
        stats.totalSkills = statisticsData.totalSkills || 0
        stats.cooperationIntentions = statisticsData.cooperation?.strong || 0
        
        console.log('📈 更新后的统计数据:', {
          totalTalents: stats.totalTalents,
          avgFarmingYears: stats.avgFarmingYears,
          totalSkills: stats.totalSkills,
          cooperationIntentions: stats.cooperationIntentions
        })
      } catch (error) {
        console.error('❌ 加载统计数据失败:', error)
        ElMessage.warning('统计数据加载失败，使用默认数据')
      }
    }

    const handleSearch = () => {
      // 搜索逻辑已在计算属性中处理
    }

    const handleAdd = () => {
      currentPerson.value = {}
      isEdit.value = false
      dialogVisible.value = true
    }

    const handleEdit = (person) => {
      currentPerson.value = { ...person }
      isEdit.value = true
      dialogVisible.value = true
    }

    const handleView = async (person) => {
      try {
        console.log('👁️ 查看人员详情:', person.name)
        loading.value = true
        const detailsResponse = await personService.getPersonDetails(person.id)
        console.log('📝 获取到详情响应:', detailsResponse)
        
        // 正确提取数据
        const details = detailsResponse.data || detailsResponse
        viewPersonData.value = { 
          ...person, 
          rural_profile: details.ruralProfile,
          skills: details.skills,
          cooperation: details.cooperation
        }
        console.log('📊 设置查看数据:', viewPersonData.value)
        viewDialogVisible.value = true
      } catch (error) {
        console.error('❌ 获取人才详情失败:', error)
        ElMessage.error('获取人才详情失败')
      } finally {
        loading.value = false
      }
    }

    const handleDelete = async (person) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除人才 "${person.name}" 的档案吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        
        person.deleting = true
        await personService.deletePerson(person.id)
        ElMessage.success('删除成功')
        fetchTalents()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Failed to delete person:', error)
          ElMessage.error('删除失败')
        }
      } finally {
        person.deleting = false
      }
    }

    const handleSubmit = async (formData) => {
      submitting.value = true
      try {
        if (isEdit.value) {
          await personService.updatePerson(currentPerson.value.id, formData)
          ElMessage.success('更新成功')
        } else {
          await personService.createPerson(formData)
          ElMessage.success('添加成功')
        }
        closeDialog()
        fetchTalents()
      } catch (error) {
        console.error('Failed to save person:', error)
        ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
      } finally {
        submitting.value = false
      }
    }

    const closeDialog = () => {
      dialogVisible.value = false
      currentPerson.value = {}
    }

    const handleFilterCommand = (command) => {
      filterType.value = command
    }

    const handleSortChange = ({ prop, order }) => {
      sortBy.value = prop
      sortOrder.value = order
      // 可以在这里添加服务器端排序逻辑
    }

    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1
    }

    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
    }

    const handleExport = () => {
      // 导出功能留待后续实现
      ElMessage.info('导出功能正在开发中')
    }

    const getSkillTagType = (category) => {
      const typeMap = {
        planting: 'success',
        breeding: 'warning',
        processing: 'info',
        marketing: 'danger',
        management: 'primary'
      }
      return typeMap[category] || ''
    }

    // 处理JSON数组数据的通用方法
    const getJSONArray = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [data];
        } catch (e) {
          // 如果解析失败，按逗号分隔处理（兼容旧数据）
          return data.split(',').map(item => item.trim()).filter(item => item);
        }
      }
      return [data];
    }

    // 获取合作意愿标签类型
    const getCooperationTagType = (cooperation) => {
      if (!cooperation) return 'info'
      
      const values = getJSONArray(cooperation);
      const firstValue = values[0];
      if (firstValue === '强烈') return 'success'
      if (firstValue === '一般') return 'warning'
      return 'info'
    }

    // 获取合作意愿显示文本
    const getCooperationDisplay = (cooperation) => {
      if (!cooperation) return '未知'
      
      const values = getJSONArray(cooperation);
      if (values.length === 1) {
        return values[0]
      } else {
        return `${values[0]}+${values.length - 1}`
      }
    }

    // 生命周期
    onMounted(() => {
      console.log('🚀 RuralTalentManager 组件已挂载，开始初始化数据')
      console.log('🌐 当前环境:', {
        baseURL: 'http://localhost:8083',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      })
      fetchTalents()
    })

    return {
      // 图标
      Search, Plus, Download, User, Calendar, Trophy, Connection, ArrowDown,
      
      // 数据
      talents,
      filteredTalents,
      loading,
      submitting,
      searchQuery,
      stats,
      total,
      pageSize,
      currentPage,
      
      // 表单状态
      dialogVisible,
      isEdit,
      currentPerson,
      
      // 详情查看
      viewDialogVisible,
      viewPersonData,
      
      // 方法
      handleSearch,
      handleAdd,
      handleEdit,
      handleView,
      handleDelete,
      handleSubmit,
      closeDialog,
      handleFilterCommand,
      handleSortChange,
      handleSizeChange,
      handleCurrentChange,
      handleExport,
      getSkillTagType,
      getJSONArray,
      getCooperationTagType,
      getCooperationDisplay
    }
  }
}
</script>

<style scoped>
.rural-talent-manager {
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  margin-bottom: 20px;
}

.search-input {
  max-width: 400px;
}

.text-right {
  text-align: right;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  position: relative;
  z-index: 2;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40px;
  color: #409EFF;
  opacity: 0.3;
}

.talent-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mr-1 {
  margin-right: 4px;
  margin-bottom: 4px;
}

.more-skills {
  color: #999;
  font-size: 12px;
}

.more-items {
  color: #999;
  font-size: 12px;
  font-weight: normal;
}

/* 操作按钮样式优化 */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-start;
  align-items: center;
}

.action-buttons .el-button {
  margin: 0;
  padding: 5px 8px;
  font-size: 12px;
  min-width: 45px;
}

.action-buttons .el-button + .el-button {
  margin-left: 0;
}

/* 表格优化 */
.el-table .cell {
  padding-left: 8px;
  padding-right: 8px;
}

.el-table th > .cell {
  font-weight: 600;
}

/* 标签间距优化 */
.el-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-actions .el-col {
    margin-bottom: 10px;
  }
  
  .stats-cards .el-col {
    margin-bottom: 10px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  /* 移动端隐藏次要列 */
  .el-table .mobile-hidden {
    display: none;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }
  
  .action-buttons .el-button {
    width: 100%;
    min-width: auto;
  }
}

.stat-icon {
  font-size: 30px;
}
</style>
