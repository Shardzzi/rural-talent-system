<template>
  <div class="bigscreen" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 顶部标题栏 -->
    <header class="bigscreen-header">
      <h1 class="header-title">数字乡村人才信息大数据平台</h1>
      <div class="header-right">
        <span class="header-time">{{ currentTime }}</span>
        <el-button
          class="fullscreen-btn"
          text
          @click="toggleFullscreen"
        >
          <el-icon :size="18">
            <FullScreen />
          </el-icon>
        </el-button>
      </div>
    </header>

    <!-- KPI 卡片 -->
    <div class="kpi-row">
      <div
        v-for="(kpi, index) in kpiCards"
        :key="kpi.label"
        class="kpi-card"
        :class="{ active: activeKpiIndex === index }"
      >
        <div class="kpi-value">{{ kpi.displayValue }}</div>
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-bar"></div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 学历分布 - 柱状图 -->
      <div class="chart-cell chart-cell-wide">
        <div class="chart-title">学历分布</div>
        <v-chart
          v-if="stats"
          class="bigscreen-chart"
          :option="educationOption"
          :autoresize="true"
        />
      </div>

      <!-- 技能类别 - 饼图 -->
      <div class="chart-cell">
        <div class="chart-title">技能类别分布</div>
        <v-chart
          v-if="stats"
          class="bigscreen-chart"
          :option="skillCategoryOption"
          :autoresize="true"
        />
      </div>

      <!-- 年龄分布 - 折线图 -->
      <div class="chart-cell chart-cell-wide">
        <div class="chart-title">年龄分布</div>
        <v-chart
          v-if="stats"
          class="bigscreen-chart"
          :option="ageOption"
          :autoresize="true"
        />
      </div>

      <!-- 热门技能 TOP10 - 横向柱状图 -->
      <div class="chart-cell">
        <div class="chart-title">热门技能 TOP10</div>
        <v-chart
          v-if="stats"
          class="bigscreen-chart"
          :option="topSkillsOption"
          :autoresize="true"
        />
      </div>
    </div>

    <!-- 数据刷新提示 -->
    <div v-if="refreshing" class="refresh-indicator">
      <el-icon class="is-loading"><Loading /></el-icon>
      数据刷新中...
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VChart from 'vue-echarts'
import '@/utils/echarts'
import type { EChartsOption } from '@/utils/echarts'
import { FullScreen, Loading } from '@element-plus/icons-vue'
import axios from 'axios'

const SERIES_COLORS = ['#2E7D32', '#F57C00', '#1976D2', '#7B1FA2', '#C62828', '#00838F']

interface Statistics {
  totalTalents: number
  avgAge: number
  totalSkills: number
  cooperation: { strong: number; moderate: number; weak: number; total: number }
  skillsCategory: Array<{ category: string; count: number }>
  topSkills: Array<{ skill_name: string; count: number }>
  education: Array<{ education_level: string; count: number }>
  ageDistribution: Array<{ age_range: string; count: number }>
}

interface KpiCard {
  label: string
  rawValue: number
  displayValue: string
}

export default {
  name: 'BigScreenView',
  components: { VChart, FullScreen, Loading },
  setup() {
    const stats = ref<Statistics | null>(null)
    const currentTime = ref('')
    const isFullscreen = ref(false)
    const refreshing = ref(false)
    const activeKpiIndex = ref(0)

    let clockTimer: ReturnType<typeof setInterval> | null = null
    let kpiCycleTimer: ReturnType<typeof setInterval> | null = null
    let refreshTimer: ReturnType<typeof setInterval> | null = null
    let counterAnimations: Array<{ id: number; target: number; current: number; key: string }> = []

    const updateClock = (): void => {
      const now = new Date()
      const pad = (n: number): string => String(n).padStart(2, '0')
      currentTime.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    }

    const animateCounter = (entry: { id: number; target: number; current: number; key: string }): void => {
      const duration = 1500
      const start = entry.current
      const startTime = performance.now()
      const id = entry.id

      const step = (timestamp: number): void => {
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const entryRef = counterAnimations.find(a => a.id === id)
        if (!entryRef) return
        entryRef.current = start + (entryRef.target - start) * eased
        if (progress < 1) {
          requestAnimationFrame(step)
        }
      }
      requestAnimationFrame(step)
    }

    const formatNumber = (n: number): string => {
      return Math.round(n).toLocaleString('zh-CN')
    }

    const kpiCards = computed<KpiCard[]>(() => {
      const s = stats.value
      if (!s) {
        return [
          { label: '人才总量', rawValue: 0, displayValue: '0' },
          { label: '平均年龄', rawValue: 0, displayValue: '0' },
          { label: '技能总数', rawValue: 0, displayValue: '0' },
          { label: '合作意向率', rawValue: 0, displayValue: '0%' },
        ]
      }

      const total = s.totalTalents
      const totalEntry = counterAnimations.find(a => a.key === 'totalTalents')
      const avgEntry = counterAnimations.find(a => a.key === 'avgAge')
      const skillsEntry = counterAnimations.find(a => a.key === 'totalSkills')
      const coopEntry = counterAnimations.find(a => a.key === 'coopRate')

      const coopRate = s.cooperation?.total > 0
        ? Math.round(((s.cooperation.strong + s.cooperation.moderate) / s.cooperation.total) * 100)
        : 0

      return [
        {
          label: '人才总量',
          rawValue: total,
          displayValue: formatNumber(totalEntry ? totalEntry.current : total),
        },
        {
          label: '平均年龄',
          rawValue: s.avgAge,
          displayValue: formatNumber(avgEntry ? avgEntry.current : s.avgAge),
        },
        {
          label: '技能总数',
          rawValue: s.totalSkills,
          displayValue: formatNumber(skillsEntry ? skillsEntry.current : s.totalSkills),
        },
        {
          label: '合作意向率',
          rawValue: coopRate,
          displayValue: formatNumber(coopEntry ? coopEntry.current : coopRate) + '%',
        },
      ]
    })

    const fetchStats = async (): Promise<void> => {
      refreshing.value = true
      try {
        const response = await axios.get('/api/statistics')
        const data = response.data?.data ?? response.data
        if (data) {
          stats.value = data as Statistics

          const newAnimations: Array<{ id: number; target: number; current: number; key: string }> = [
            { id: 1, target: data.totalTalents ?? 0, current: 0, key: 'totalTalents' },
            { id: 2, target: data.avgAge ?? 0, current: 0, key: 'avgAge' },
            { id: 3, target: data.totalSkills ?? 0, current: 0, key: 'totalSkills' },
          ]

          const coopRate = data.cooperation?.total > 0
            ? Math.round(((data.cooperation.strong + data.cooperation.moderate) / data.cooperation.total) * 100)
            : 0
          newAnimations.push({ id: 4, target: coopRate, current: 0, key: 'coopRate' })

          // Continue from previous value for smooth transition
          for (const newAnim of newAnimations) {
            const prev = counterAnimations.find(a => a.key === newAnim.key)
            if (prev) {
              newAnim.current = prev.current
            }
          }

          counterAnimations = newAnimations
          for (const anim of counterAnimations) {
            animateCounter(anim)
          }
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      } finally {
        refreshing.value = false
      }
    }

    const toggleFullscreen = (): void => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          isFullscreen.value = true
        }).catch(() => {
          // Fullscreen not supported or denied
        })
      } else {
        document.exitFullscreen().then(() => {
          isFullscreen.value = false
        }).catch(() => {
          // Exit failed
        })
      }
    }

    const onFullscreenChange = (): void => {
      isFullscreen.value = !!document.fullscreenElement
    }

    const educationOption = computed<EChartsOption>(() => {
      const edu = stats.value?.education ?? []
      return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', textStyle: { color: '#e0e0e0' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: edu.map(e => e.education_level),
          axisLabel: { color: '#e0e0e0', rotate: 20 },
          axisLine: { lineStyle: { color: '#333' } },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#e0e0e0' },
          axisLine: { lineStyle: { color: '#333' } },
          splitLine: { lineStyle: { color: '#1a3a5c' } },
        },
        series: [{
          type: 'bar',
          data: edu.map(e => e.count),
          itemStyle: { color: SERIES_COLORS[0], borderRadius: [4, 4, 0, 0] },
          barWidth: '40%',
        }],
      }
    })

    const skillCategoryOption = computed<EChartsOption>(() => {
      const cats = stats.value?.skillsCategory ?? []
      return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', textStyle: { color: '#e0e0e0' } },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'middle',
          textStyle: { color: '#e0e0e0', fontSize: 12 },
        },
        series: [{
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['40%', '50%'],
          data: cats.map((c, i) => ({
            name: c.category,
            value: c.count,
            itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] },
          })),
          label: { color: '#e0e0e0' },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
          },
        }],
      }
    })

    const ageOption = computed<EChartsOption>(() => {
      const dist = stats.value?.ageDistribution ?? []
      return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', textStyle: { color: '#e0e0e0' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: dist.map(a => a.age_range),
          boundaryGap: false,
          axisLabel: { color: '#e0e0e0' },
          axisLine: { lineStyle: { color: '#333' } },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#e0e0e0' },
          axisLine: { lineStyle: { color: '#333' } },
          splitLine: { lineStyle: { color: '#1a3a5c' } },
        },
        series: [{
          type: 'line',
          data: dist.map(a => a.count),
          smooth: true,
          areaStyle: { color: 'rgba(46,125,50,0.25)' },
          lineStyle: { color: SERIES_COLORS[0], width: 2 },
          itemStyle: { color: SERIES_COLORS[0] },
        }],
      }
    })

    const topSkillsOption = computed<EChartsOption>(() => {
      const top = (stats.value?.topSkills ?? []).slice(0, 10).reverse()
      return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', textStyle: { color: '#e0e0e0' }, axisPointer: { type: 'shadow' } },
        grid: { left: '25%', right: '10%', bottom: '3%', top: '5%', containLabel: false },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#e0e0e0' },
          axisLine: { lineStyle: { color: '#333' } },
          splitLine: { lineStyle: { color: '#1a3a5c' } },
        },
        yAxis: {
          type: 'category',
          data: top.map(t => t.skill_name),
          axisLabel: { color: '#e0e0e0', fontSize: 12 },
          axisLine: { lineStyle: { color: '#333' } },
          splitLine: { show: false },
        },
        series: [{
          type: 'bar',
          data: top.map((t, i) => ({
            value: t.count,
            itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] },
          })),
          barWidth: '50%',
        }],
      }
    })

    onMounted(async () => {
      updateClock()
      clockTimer = setInterval(updateClock, 1000)
      kpiCycleTimer = setInterval(() => {
        activeKpiIndex.value = (activeKpiIndex.value + 1) % 4
      }, 5000)
      await fetchStats()
      refreshTimer = setInterval(fetchStats, 30000)
      document.addEventListener('fullscreenchange', onFullscreenChange)
    })

    onUnmounted(() => {
      if (clockTimer) clearInterval(clockTimer)
      if (kpiCycleTimer) clearInterval(kpiCycleTimer)
      if (refreshTimer) clearInterval(refreshTimer)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    })

    return {
      stats,
      currentTime,
      isFullscreen,
      refreshing,
      activeKpiIndex,
      kpiCards,
      toggleFullscreen,
      educationOption,
      skillCategoryOption,
      ageOption,
      topSkillsOption,
    }
  },
}
</script>

<style scoped>
.bigscreen {
  width: 100vw;
  min-height: 100vh;
  background: #0a1929;
  color: #e0e0e0;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部 */
.bigscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: linear-gradient(180deg, rgba(26, 58, 92, 0.8) 0%, rgba(10, 25, 41, 0.5) 100%);
  border-bottom: 1px solid #1a3a5c;
  flex-shrink: 0;
}

.header-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #e0e0e0;
  background: linear-gradient(90deg, #2E7D32, #81C784);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-time {
  font-size: 16px;
  color: #b0b0b0;
  font-variant-numeric: tabular-nums;
}

.fullscreen-btn {
  color: #b0b0b0 !important;
  padding: 8px !important;
}

.fullscreen-btn:hover {
  color: #e0e0e0 !important;
}

/* KPI 卡片 */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px 32px;
  flex-shrink: 0;
}

.kpi-card {
  background: linear-gradient(135deg, rgba(26, 58, 92, 0.6) 0%, rgba(26, 58, 92, 0.3) 100%);
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  padding: 20px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.5s ease;
}

.kpi-card.active {
  border-color: #2E7D32;
  box-shadow: 0 0 20px rgba(46, 125, 50, 0.2);
}

.kpi-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #1a3a5c;
  transition: background 0.5s ease;
}

.kpi-card.active .kpi-bar {
  background: #2E7D32;
}

.kpi-value {
  font-size: 36px;
  font-weight: 700;
  color: #e0e0e0;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.kpi-card.active .kpi-value {
  color: #81C784;
}

.kpi-label {
  font-size: 14px;
  color: #909090;
  margin-top: 4px;
}

/* 图表区域 */
.charts-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
  padding: 0 32px 24px;
  min-height: 0;
}

.chart-cell {
  background: linear-gradient(135deg, rgba(26, 58, 92, 0.4) 0%, rgba(26, 58, 92, 0.15) 100%);
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #b0b0b0;
  margin-bottom: 8px;
  flex-shrink: 0;
  padding-left: 8px;
  border-left: 3px solid #2E7D32;
}

.bigscreen-chart {
  flex: 1;
  min-height: 0;
}

/* 刷新提示 */
.refresh-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(26, 58, 92, 0.9);
  color: #b0b0b0;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #1a3a5c;
  z-index: 100;
}

/* 响应式 */
@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
    padding: 16px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    padding: 0 16px 16px;
  }

  .bigscreen-header {
    padding: 12px 16px;
  }

  .header-title {
    font-size: 18px;
    letter-spacing: 2px;
  }
}
</style>
