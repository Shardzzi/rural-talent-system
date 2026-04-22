<template>
  <div class="comparison-radar-chart">
    <v-chart
      v-if="persons.length > 0"
      class="radar-chart"
      :option="radarOption"
      :autoresize="true"
    />
    <el-empty v-else description="请添加人才进行对比" :image-size="80" />
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import '@/utils/echarts'
import type { EChartsOption } from '@/utils/echarts'

const PALETTE = ['#2E7D32', '#F57C00', '#1976D2', '#7B1FA2']

const EDUCATION_MAP: Record<string, number> = {
  '高中及以下': 20,
  '高中': 20,
  '专科': 40,
  '大专': 40,
  '本科': 60,
  '硕士': 80,
  '硕士及以上': 80,
  '博士': 100,
}

interface ComparisonPerson {
  id: number
  name: string
  age: number
  education: string
  skills: string
  rural_profile: Record<string, unknown> | null
  talent_skills: Record<string, unknown>[] | null
  cooperation_intentions: Record<string, unknown> | null
}

export default {
  name: 'ComparisonRadarChart',
  components: { VChart },
  props: {
    persons: {
      type: Array as () => ComparisonPerson[],
      default: () => [],
    },
  },
  setup(props: { persons: ComparisonPerson[] }) {
    const normalize = (value: number, max: number): number => {
      return Math.min(Math.round((value / max) * 100), 100)
    }

    const getFarmingYears = (person: ComparisonPerson): number => {
      const profile = person.rural_profile
      if (!profile) return 0
      return Number(profile.farming_years ?? profile.planting_years ?? 0) || 0
    }

    const getSkillCount = (person: ComparisonPerson): number => {
      const skills = person.talent_skills
      return Array.isArray(skills) ? skills.length : 0
    }

    const getEducationScore = (person: ComparisonPerson): number => {
      const edu = person.education || ''
      return EDUCATION_MAP[edu] ?? 30
    }

    const getCooperationScore = (person: ComparisonPerson): number => {
      const coop = person.cooperation_intentions
      if (!coop) return 25
      const willingness = String(coop.cooperation_willingness ?? coop.willingness ?? '').toLowerCase()
      if (willingness === 'strong' || willingness === '强') return 100
      if (willingness === 'moderate' || willingness === '中') return 60
      if (willingness === 'weak' || willingness === '弱') return 25
      return 50
    }

    const getTrainingScore = (person: ComparisonPerson): number => {
      const profile = person.rural_profile
      if (!profile) return 0
      const trainings = Array.isArray(profile.trainings) ? profile.trainings.length : Number(profile.training_count ?? 0)
      return normalize(trainings, 10)
    }

    const getInvestmentScore = (person: ComparisonPerson): number => {
      const coop = person.cooperation_intentions
      if (!coop) return 0
      const capacity = Number(coop.investment_capacity ?? coop.investment_budget ?? 0)
      return normalize(capacity, 500000)
    }

    const radarOption = computed<EChartsOption>(() => {
      const persons = props.persons ?? []

      const indicators = [
        { name: '种植经验', max: 100 },
        { name: '技能数量', max: 100 },
        { name: '学历水平', max: 100 },
        { name: '合作意愿', max: 100 },
        { name: '培训完成度', max: 100 },
        { name: '投资能力', max: 100 },
      ]

      const series = persons.map((person, index) => {
        const color = PALETTE[index % PALETTE.length]
        return {
          value: [
            getFarmingYears(person),
            getSkillCount(person),
            getEducationScore(person),
            getCooperationScore(person),
            getTrainingScore(person),
            getInvestmentScore(person),
          ].map(v => normalize(v, 100)),
          name: person.name,
          areaStyle: { color: color + '30' },
          lineStyle: { color, width: 2 },
          itemStyle: { color },
        }
      })

      return {
        tooltip: { trigger: 'item' },
        legend: {
          data: persons.map(p => p.name),
          bottom: 0,
          textStyle: { color: '#666' },
        },
        radar: {
          indicator: indicators,
          shape: 'polygon',
          splitNumber: 5,
          axisName: { color: '#666', fontSize: 12 },
          splitArea: {
            areaStyle: {
              color: [
                'rgba(46,125,50,0.02)', 'rgba(46,125,50,0.04)',
                'rgba(46,125,50,0.06)', 'rgba(46,125,50,0.08)',
                'rgba(46,125,50,0.10)',
              ],
            },
          },
          splitLine: { lineStyle: { color: '#ddd' } },
          axisLine: { lineStyle: { color: '#ccc' } },
        },
        series: [{
          type: 'radar',
          data: series,
        }],
      }
    })

    return { radarOption }
  },
}
</script>

<style scoped>
.comparison-radar-chart {
  width: 100%;
}

.radar-chart {
  width: 100%;
  height: 400px;
}
</style>
