<template>
  <div class="talent-comparison">
    <el-page-header @back="goBack" content="人才对比">
      <template #extra>
        <el-button
          type="primary"
          @click="showAddDialog = true"
          :disabled="persons.length >= 4"
        >
          <el-icon><Plus /></el-icon>
          添加人才 ({{ persons.length }}/4)
        </el-button>
      </template>
    </el-page-header>

    <div v-if="loading" class="loading-wrapper">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="persons.length === 0" class="empty-wrapper">
      <EmptyState
        type="data"
        title="暂无对比数据"
        description="请通过URL参数 ?ids=1,2,3 添加或点击上方按钮选择人才进行对比"
      />
    </div>

    <div v-else class="comparison-content">
      <!-- 对比表格 -->
      <el-card class="table-card" shadow="hover">
        <template #header>
          <span class="card-title">信息对比</span>
        </template>
        <div class="table-scroll">
          <table class="comparison-table">
            <thead>
              <tr>
                <th class="field-col">对比项</th>
                <th
                  v-for="person in persons"
                  :key="person.id"
                  class="person-col"
                >
                  <div class="person-header">
                    <span class="person-name">{{ person.name }}</span>
                    <el-button
                      type="danger"
                      text
                      size="small"
                      @click="removePerson(person.id)"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 基本信息 -->
              <tr class="category-row">
                <td colspan="99">基本信息</td>
              </tr>
              <tr>
                <td class="field-label">姓名</td>
                <td v-for="person in persons" :key="'name-' + person.id">
                  {{ person.name }}
                </td>
              </tr>
              <tr>
                <td class="field-label">年龄</td>
                <td v-for="person in persons" :key="'age-' + person.id">
                  {{ person.age }}岁
                </td>
              </tr>
              <tr>
                <td class="field-label">性别</td>
                <td v-for="person in persons" :key="'gender-' + person.id">
                  {{ person.gender || '-' }}
                </td>
              </tr>
              <tr>
                <td class="field-label">学历</td>
                <td v-for="person in persons" :key="'edu-' + person.id">
                  {{ person.education || '-' }}
                </td>
              </tr>
              <tr>
                <td class="field-label">联系方式</td>
                <td v-for="person in persons" :key="'phone-' + person.id">
                  {{ person.phone || '-' }}
                </td>
              </tr>
              <tr>
                <td class="field-label">地址</td>
                <td v-for="person in persons" :key="'addr-' + person.id">
                  {{ person.address || '-' }}
                </td>
              </tr>

              <!-- 农村画像 -->
              <tr class="category-row">
                <td colspan="99">农村画像</td>
              </tr>
              <tr>
                <td class="field-label">种植年限</td>
                <td v-for="person in persons" :key="'farm-' + person.id">
                  {{ getRuralField(person, 'farming_years') }}年
                </td>
              </tr>
              <tr>
                <td class="field-label">主要作物</td>
                <td v-for="person in persons" :key="'crop-' + person.id">
                  {{ getRuralField(person, 'main_crops') }}
                </td>
              </tr>
              <tr>
                <td class="field-label">种植规模</td>
                <td v-for="person in persons" :key="'scale-' + person.id">
                  {{ getRuralField(person, 'planting_scale') }}
                </td>
              </tr>

              <!-- 技能特长 -->
              <tr class="category-row">
                <td colspan="99">技能特长</td>
              </tr>
              <tr>
                <td class="field-label">技能数量</td>
                <td v-for="person in persons" :key="'skcount-' + person.id">
                  {{ getSkillCount(person) }}
                </td>
              </tr>
              <tr>
                <td class="field-label">技能列表</td>
                <td v-for="person in persons" :key="'skills-' + person.id">
                  {{ formatSkills(person) }}
                </td>
              </tr>

              <!-- 合作意向 -->
              <tr class="category-row">
                <td colspan="99">合作意向</td>
              </tr>
              <tr>
                <td class="field-label">合作意愿</td>
                <td v-for="person in persons" :key="'coop-' + person.id">
                  {{ getCoopField(person, 'cooperation_willingness') }}
                </td>
              </tr>
              <tr>
                <td class="field-label">合作类型</td>
                <td v-for="person in persons" :key="'ctype-' + person.id">
                  {{ getCoopField(person, 'cooperation_type') }}
                </td>
              </tr>
              <tr>
                <td class="field-label">投资能力</td>
                <td v-for="person in persons" :key="'invest-' + person.id">
                  {{ getCoopField(person, 'investment_capacity') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-card>

      <!-- 雷达图对比 -->
      <el-card class="radar-card" shadow="hover">
        <template #header>
          <span class="card-title">能力雷达图</span>
        </template>
        <ComparisonRadarChart :persons="persons" />
      </el-card>
    </div>

    <!-- 添加人才对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="选择对比人才"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="searchKeyword"
        placeholder="搜索姓名、技能"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div class="person-list">
        <div
          v-for="person in filteredAllPersons"
          :key="person.id"
          class="person-list-item"
          :class="{ disabled: isPersonSelected(person.id) }"
          @click="addPerson(person)"
        >
          <div class="person-list-name">{{ person.name }}</div>
          <div class="person-list-info">
            {{ person.age }}岁 · {{ person.education || '未知学历' }} · {{ person.skills || '无技能' }}
          </div>
          <el-tag v-if="isPersonSelected(person.id)" type="info" size="small">已添加</el-tag>
        </div>
        <el-empty
          v-if="filteredAllPersons.length === 0"
          description="未找到匹配的人才"
          :image-size="60"
        />
      </div>
      <template #footer>
        <el-button @click="showAddDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Close, Search } from '@element-plus/icons-vue'
import axios from 'axios'
import EmptyState from '../common/EmptyState.vue'
import ComparisonRadarChart from './ComparisonRadarChart.vue'

interface ComparisonPerson {
  id: number
  name: string
  age: number
  gender: string
  education: string
  phone: string
  address: string
  skills: string
  rural_profile: Record<string, unknown> | null
  talent_skills: Record<string, unknown>[] | null
  cooperation_intentions: Record<string, unknown> | null
}

interface PersonListItem {
  id: number
  name: string
  age: number
  education: string
  skills: string
}

export default {
  name: 'TalentComparison',
  components: {
    EmptyState,
    ComparisonRadarChart,
    Plus,
    Close,
    Search,
  },
  setup() {
    const route = useRoute()
    const router = useRouter()

    const loading = ref(true)
    const persons = ref<ComparisonPerson[]>([])
    const showAddDialog = ref(false)
    const searchKeyword = ref('')
    const allPersons = ref<PersonListItem[]>([])

    const goBack = () => {
      router.push('/')
    }

    const getRuralField = (person: ComparisonPerson, field: string): string => {
      const profile = person.rural_profile
      if (!profile) return '-'
      return String(profile[field] ?? '-')
    }

    const getCoopField = (person: ComparisonPerson, field: string): string => {
      const coop = person.cooperation_intentions
      if (!coop) return '-'
      return String(coop[field] ?? '-')
    }

    const getSkillCount = (person: ComparisonPerson): number => {
      const skills = person.talent_skills
      return Array.isArray(skills) ? skills.length : 0
    }

    const formatSkills = (person: ComparisonPerson): string => {
      const skills = person.talent_skills
      if (!Array.isArray(skills) || skills.length === 0) return '-'
      return skills.map(s => String(s.skill_name ?? s.name ?? '')).filter(Boolean).join('、')
    }

    const isPersonSelected = (id: number): boolean => {
      return persons.value.some(p => p.id === id)
    }

    const addPerson = (person: PersonListItem): void => {
      if (isPersonSelected(person.id)) return
      if (persons.value.length >= 4) {
        ElMessage.warning('最多对比4位人才')
        return
      }
      fetchPersonDetails(person.id)
      showAddDialog.value = false
      searchKeyword.value = ''
    }

    const removePerson = (id: number): void => {
      persons.value = persons.value.filter(p => p.id !== id)
    }

    const fetchPersonDetails = async (id: number): Promise<void> => {
      if (isPersonSelected(id)) return
      try {
        const response = await axios.get(`/api/persons/${id}/details`)
        const data = response.data?.data ?? response.data
        if (data && data.id) {
          persons.value.push({
            id: data.id,
            name: data.name || '未知',
            age: data.age || 0,
            gender: data.gender || '-',
            education: data.education || data.education_level || '-',
            phone: data.phone || '-',
            address: data.address || '-',
            skills: data.skills || '-',
            rural_profile: data.rural_profile ?? null,
            talent_skills: Array.isArray(data.talent_skills) ? data.talent_skills : null,
            cooperation_intentions: data.cooperation_intentions ?? null,
          })
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '获取失败'
        ElMessage.error(`获取人才 #${id} 详情失败: ${msg}`)
      }
    }

    const fetchAllPersons = async (): Promise<void> => {
      try {
        const response = await axios.get('/api/persons')
        const data = response.data?.data ?? response.data ?? []
        allPersons.value = Array.isArray(data)
          ? data.map((p: Record<string, unknown>) => ({
              id: Number(p.id),
              name: String(p.name ?? '未知'),
              age: Number(p.age ?? 0),
              education: String(p.education ?? p.education_level ?? ''),
              skills: String(p.skills ?? ''),
            }))
          : []
      } catch {
        allPersons.value = []
      }
    }

    const filteredAllPersons = computed<PersonListItem[]>(() => {
      const keyword = searchKeyword.value.trim().toLowerCase()
      if (!keyword) return allPersons.value
      return allPersons.value.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.skills.toLowerCase().includes(keyword)
      )
    })

    const handleSearch = (): void => {
      // Computed handles filtering reactively
    }

    const loadFromUrl = async (): Promise<void> => {
      const idsParam = route.query.ids as string | undefined
      if (!idsParam) return
      const ids = idsParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
      if (ids.length === 0) return
      const uniqueIds = [...new Set(ids)].slice(0, 4)
      await Promise.all(uniqueIds.map(id => fetchPersonDetails(id)))
    }

    watch(() => route.query.ids, () => {
      loadFromUrl()
    })

    onMounted(async () => {
      loading.value = true
      try {
        await Promise.all([loadFromUrl(), fetchAllPersons()])
      } finally {
        loading.value = false
      }
    })

    return {
      loading,
      persons,
      showAddDialog,
      searchKeyword,
      filteredAllPersons,
      goBack,
      getRuralField,
      getCoopField,
      getSkillCount,
      formatSkills,
      isPersonSelected,
      addPerson,
      removePerson,
      handleSearch,
    }
  },
}
</script>

<style scoped>
.talent-comparison {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.loading-wrapper {
  padding: 40px;
}

.empty-wrapper {
  padding: 80px 0;
  display: flex;
  justify-content: center;
}

.comparison-content {
  margin-top: 20px;
}

.table-card,
.radar-card {
  margin-bottom: 20px;
  border-radius: var(--radius-md, 8px);
}

.card-title {
  font-size: var(--font-size-md, 16px);
  font-weight: 600;
  color: var(--color-text-primary, #1a1a1a);
}

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.comparison-table th,
.comparison-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--color-border-light, #e4e7ed);
  font-size: var(--font-size-base, 14px);
}

.field-col {
  width: 140px;
  min-width: 120px;
  background: var(--color-primary-light-9, #e8f5e9);
}

.person-col {
  min-width: 180px;
}

.category-row td {
  background: var(--color-primary-light-9, #e8f5e9);
  font-weight: 600;
  color: var(--color-primary-dark-2, #1b5e20);
  font-size: var(--font-size-sm, 13px);
}

.field-label {
  color: var(--color-text-secondary, #666);
  font-weight: 500;
}

.person-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.person-name {
  font-weight: 600;
  color: var(--color-primary, #2e7d32);
}

.person-list {
  max-height: 400px;
  overflow-y: auto;
  margin-top: 16px;
}

.person-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  transition: background var(--transition-fast, 150ms ease);
}

.person-list-item:hover {
  background: var(--color-primary-light-9, #e8f5e9);
}

.person-list-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.person-list-name {
  font-weight: 500;
  min-width: 60px;
}

.person-list-info {
  flex: 1;
  color: var(--color-text-secondary, #666);
  font-size: var(--font-size-sm, 13px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .talent-comparison {
    padding: 10px;
  }
}
</style>
