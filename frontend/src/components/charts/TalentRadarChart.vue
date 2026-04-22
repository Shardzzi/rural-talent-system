<template>
  <div class="talent-radar-chart">
    <v-chart
      v-if="hasData"
      class="radar-chart"
      :option="radarOption"
      :autoresize="true"
    />
    <el-empty v-else description="暂无技能数据" :image-size="80" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import '@/utils/echarts'
import type { EChartsOption } from '@/utils/echarts'

interface SkillItem {
  skill_category: string
  skill_name: string
  proficiency_level: number
  experience_years?: number
}

const props = defineProps<{
  skills: SkillItem[]
}>()

const hasData = computed(() => props.skills && props.skills.length > 0)

const radarOption = computed<EChartsOption>(() => {
  const skills = props.skills ?? []

  // Aggregate proficiency by category
  const categoryMap = new Map<string, { total: number; count: number }>()
  for (const skill of skills) {
    const cat = skill.skill_category || '未分类'
    const existing = categoryMap.get(cat) ?? { total: 0, count: 0 }
    existing.total += skill.proficiency_level || 0
    existing.count += 1
    categoryMap.set(cat, existing)
  }

  const indicators = Array.from(categoryMap.entries()).map(([name, { total, count }]) => ({
    name,
    max: 5,
    value: Math.round((total / count) * 10) / 10,
  }))

  return {
    tooltip: {},
    radar: {
      indicator: indicators.map(i => ({ name: i.name, max: i.max })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: { color: '#666', fontSize: 12 },
      splitArea: {
        areaStyle: {
          color: ['rgba(46,125,50,0.02)', 'rgba(46,125,50,0.05)', 'rgba(46,125,50,0.08)', 'rgba(46,125,50,0.11)', 'rgba(46,125,50,0.14)'],
        },
      },
    },
    series: [{
      type: 'radar',
      data: [{
        value: indicators.map(i => i.value),
        name: '技能水平',
        areaStyle: {
          color: 'rgba(46,125,50,0.25)',
        },
        lineStyle: { color: '#2E7D32', width: 2 },
        itemStyle: { color: '#2E7D32' },
      }],
    }],
  }
})
</script>

<style scoped>
.talent-radar-chart {
  width: 100%;
}

.radar-chart {
  width: 100%;
  height: 280px;
}
</style>
