<template>
  <div class="statistics-dashboard">
    <div class="dashboard-header">
      <h2>数据统计分析</h2>
      <p class="subtitle">人才系统数据概览</p>
    </div>

    <!-- Summary Cards -->
    <el-row :gutter="20" class="summary-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-value">{{ stats.totalTalents }}</div>
          <div class="summary-label">人才总数</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-value">{{ stats.avgAge }}</div>
          <div class="summary-label">平均年龄</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-value">{{ stats.totalSkills }}</div>
          <div class="summary-label">技能总数</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-value">{{ stats.recentRegistrations?.last30Days ?? 0 }}</div>
          <div class="summary-label">近30天新增</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Grid -->
    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="chart-title">学历分布</span>
          </template>
          <v-chart class="chart" :option="educationOption" :autoresize="true" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="chart-title">年龄分布</span>
          </template>
          <v-chart class="chart" :option="ageOption" :autoresize="true" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="chart-title">技能类别分布</span>
          </template>
          <v-chart class="chart" :option="skillCategoryOption" :autoresize="true" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="chart-title">性别分布</span>
          </template>
          <v-chart class="chart" :option="genderOption" :autoresize="true" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="chart-title">热门技能 TOP10</span>
          </template>
          <v-chart class="chart" :option="topSkillsOption" :autoresize="true" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="chart-title">合作意愿分布</span>
          </template>
          <v-chart class="chart" :option="cooperationOption" :autoresize="true" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import '@/utils/echarts'
import type { EChartsOption } from '@/utils/echarts'

// Design token colors
const COLORS = {
  primary: '#2E7D32',
  primaryLight3: '#4CAF50',
  primaryLight5: '#81C784',
  primaryLight7: '#C8E6C9',
  primaryDark: '#1B5E20',
  secondary: '#F57C00',
  secondaryLight: '#FFB74D',
  info: '#1976D2',
  warning: '#FFB300',
  danger: '#D32F2F',
}

const PALETTE = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.info,
  COLORS.warning,
  COLORS.primaryLight3,
  COLORS.secondaryLight,
  '#7E57C2',
  '#26A69A',
  '#EC407A',
  '#5C6BC0',
]

interface Statistics {
  totalTalents: number
  avgAge: number
  totalSkills: number
  education: Array<{ education_level: string; count: number }>
  ageDistribution: Array<{ age_range: string; count: number }>
  genderDistribution: Array<{ gender: string; count: number }>
  topSkills: Array<{ skill_name: string; count: number }>
  skillsCategory: Array<{ category: string; count: number }>
  cooperation: { strong: number; moderate: number; weak: number; total: number }
  recentRegistrations: { last7Days: number; last30Days: number; total: number }
}

const stats = ref<Partial<Statistics>>({})
const loading = ref(true)

const educationOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: (stats.value.education ?? []).map(e => e.education_level),
    axisLabel: { rotate: 20 },
  },
  yAxis: { type: 'value', name: '人数' },
  series: [{
    type: 'bar',
    data: (stats.value.education ?? []).map(e => e.count),
    itemStyle: {
      color: PALETTE[0],
      borderRadius: [4, 4, 0, 0],
    },
    barWidth: '40%',
  }],
}))

const ageOption = computed<EChartsOption>(() => {
  const dist = stats.value.ageDistribution ?? []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dist.map(a => a.age_range),
      boundaryGap: false,
    },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      type: 'line',
      data: dist.map(a => a.count),
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: COLORS.primaryLight7 },
            { offset: 1, color: 'rgba(200,230,201,0.1)' },
          ],
        },
      },
      lineStyle: { color: COLORS.primary, width: 2 },
      itemStyle: { color: COLORS.primary },
    }],
  }
})

const skillCategoryOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { type: 'scroll', bottom: 0, textStyle: { fontSize: 12 } },
  series: [{
    type: 'pie',
    radius: ['35%', '65%'],
    center: ['50%', '45%'],
    label: { show: true, formatter: '{b}\n{d}%' },
    data: (stats.value.skillsCategory ?? []).map((s: { category: string; count: number }, i: number) => ({
      name: s.category,
      value: s.count,
      itemStyle: { color: PALETTE[i % PALETTE.length] },
    })),
  }],
}))

const genderOption = computed<EChartsOption>(() => {
  const dist = stats.value.genderDistribution ?? []
  const genderMap: Record<string, string> = { '男': '男', '女': '女', '其他': '其他' }
  const genderColors: Record<string, string> = { '男': COLORS.info, '女': '#EC407A', '其他': COLORS.warning }
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: true,
      label: { show: true, formatter: '{b}\n{d}%' },
      data: dist.map(g => ({
        name: genderMap[g.gender] || g.gender,
        value: g.count,
        itemStyle: { color: genderColors[g.gender] || PALETTE[0] },
      })),
    }],
  }
})

const topSkillsOption = computed<EChartsOption>(() => {
  const skills = (stats.value.topSkills ?? []).slice(0, 10).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', name: '人数' },
    yAxis: {
      type: 'category',
      data: skills.map(s => s.skill_name),
      axisLabel: { width: 80, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      data: skills.map(s => ({
        value: s.count,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: COLORS.primaryLight5 },
              { offset: 1, color: COLORS.primary },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
      })),
      barWidth: '50%',
    }],
  }
})

const cooperationOption = computed<EChartsOption>(() => {
  const coop = stats.value.cooperation ?? { strong: 0, moderate: 0, weak: 0 }
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '42%'],
      label: { show: true, formatter: '{b}\n{c}人' },
      data: [
        { name: '强烈意愿', value: coop.strong, itemStyle: { color: COLORS.primary } },
        { name: '中等意愿', value: coop.moderate, itemStyle: { color: COLORS.warning } },
        { name: '意愿较弱', value: coop.weak, itemStyle: { color: COLORS.primaryLight7 } },
      ],
    }],
  }
})

onMounted(async () => {
  try {
    const { default: personService } = await import('@/api/persons')
    const data = await personService.getStatistics()
    stats.value = data
  } catch (err) {
    console.error('Failed to load statistics:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.statistics-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: var(--spacing-lg);
}

.dashboard-header h2 {
  margin: 0 0 4px;
  color: var(--color-text-primary);
  font-size: var(--font-size-xxl);
}

.subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.summary-row {
  margin-bottom: var(--spacing-lg);
}

.summary-card {
  text-align: center;
  margin-bottom: var(--spacing-md);
}

.summary-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.2;
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.chart-card {
  margin-bottom: var(--spacing-lg);
}

.chart-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.chart {
  width: 100%;
  height: 320px;
}
</style>
