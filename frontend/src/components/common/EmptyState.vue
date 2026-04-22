<template>
  <div class="empty-state">
    <div class="empty-illustration" v-html="svgIllustration"></div>
    <h3 v-if="displayTitle" class="empty-title">{{ displayTitle }}</h3>
    <p v-if="displayDescription" class="empty-description">{{ displayDescription }}</p>
    <el-button
      v-if="actionText"
      type="primary"
      class="empty-action"
      @click="$emit('action')"
    >
      {{ actionText }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'

const DEFAULT_TITLES: Record<string, string> = {
  data: '暂无数据',
  search: '未找到结果',
  favorites: '暂无收藏',
  notifications: '暂无通知',
  custom: '',
}

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  data: '还没有相关数据，请稍后再来查看',
  search: '请尝试调整搜索条件或关键词',
  favorites: '您可以收藏感兴趣的人才信息',
  notifications: '暂无新的通知消息',
  custom: '',
}

const SVG_DATA: Record<string, string> = {
  data: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="none"/>
    <rect x="70" y="30" width="60" height="80" rx="6" fill="#E8F5E9" stroke="#2E7D32" stroke-width="2"/>
    <line x1="82" y1="50" x2="118" y2="50" stroke="#2E7D32" stroke-width="2" stroke-linecap="round"/>
    <line x1="82" y1="62" x2="118" y2="62" stroke="#2E7D32" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <line x1="82" y1="74" x2="108" y2="74" stroke="#2E7D32" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <line x1="82" y1="86" x2="100" y2="86" stroke="#2E7D32" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
    <rect x="76" y="34" width="8" height="8" rx="2" fill="#F57C00" opacity="0.8"/>
    <circle cx="78" cy="38" r="2" fill="#fff" opacity="0.6"/>
    <path d="M40 160 Q60 130 80 150 Q100 170 120 140 Q140 110 160 140" stroke="#2E7D32" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M50 170 Q70 145 90 160 Q110 175 130 150 Q145 130 155 150" stroke="#2E7D32" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.4"/>
    <path d="M160 140 Q165 125 168 135 L172 150 Q170 155 165 152 Z" fill="#F57C00" opacity="0.7"/>
    <path d="M80 150 Q85 135 88 145 L92 158 Q90 162 86 160 Z" fill="#F57C00" opacity="0.5"/>
    <path d="M40 160 Q45 148 47 155 L50 165 Q48 168 44 166 Z" fill="#F57C00" opacity="0.5"/>
  </svg>`,

  search: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="none"/>
    <circle cx="88" cy="85" r="35" fill="none" stroke="#2E7D32" stroke-width="3.5"/>
    <line x1="115" y1="112" x2="155" y2="152" stroke="#2E7D32" stroke-width="5" stroke-linecap="round"/>
    <circle cx="88" cy="85" r="28" fill="#E8F5E9"/>
    <path d="M60 165 Q70 140 85 155 Q95 165 105 145" stroke="#2E7D32" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>
    <path d="M75 170 Q80 158 88 165 Q95 172 100 158" stroke="#2E7D32" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.3"/>
    <circle cx="78" cy="75" r="3" fill="#F57C00" opacity="0.6"/>
    <circle cx="98" cy="82" r="2.5" fill="#F57C00" opacity="0.5"/>
    <circle cx="85" cy="95" r="2" fill="#F57C00" opacity="0.4"/>
  </svg>`,

  favorites: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="none"/>
    <path d="M100 170 L55 120 Q30 90 50 60 Q70 30 100 55 Q130 30 150 60 Q170 90 145 120 Z" fill="#E8F5E9" stroke="#2E7D32" stroke-width="3" stroke-linejoin="round"/>
    <path d="M100 155 L65 115 Q45 92 60 70 Q75 48 100 68 Q125 48 140 70 Q155 92 135 115 Z" fill="none" stroke="#2E7D32" stroke-width="1.5" opacity="0.4"/>
    <path d="M140 155 Q150 145 155 150 Q158 155 152 158 L148 165 Q146 168 142 165 Z" fill="#2E7D32" opacity="0.3"/>
    <path d="M50 160 Q42 155 38 148 Q35 142 40 145 L48 150 Q52 154 50 160 Z" fill="#F57C00" opacity="0.5"/>
    <path d="M95 90 Q100 85 105 90 L108 95 Q105 98 100 95 L95 98 Q92 95 95 90 Z" fill="#F57C00" opacity="0.6"/>
    <circle cx="100" cy="100" r="5" fill="#F57C00" opacity="0.4"/>
  </svg>`,

  notifications: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="none"/>
    <path d="M100 35 Q70 35 55 60 Q40 85 40 110 L40 120 Q40 130 50 135 L60 135 L65 150 Q68 160 80 160 L120 160 Q132 160 135 150 L140 135 L150 135 Q160 130 160 120 L160 110 Q160 85 145 60 Q130 35 100 35 Z" fill="#E8F5E9" stroke="#2E7D32" stroke-width="3" stroke-linejoin="round"/>
    <path d="M92 160 Q92 175 100 178 Q108 175 108 160" fill="none" stroke="#2E7D32" stroke-width="3" stroke-linecap="round"/>
    <path d="M100 50 L100 90" stroke="#F57C00" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
    <circle cx="100" cy="105" r="4" fill="#F57C00" opacity="0.6"/>
    <path d="M80 135 L80 110 Q80 85 100 75 Q120 85 120 110 L120 135" fill="none" stroke="#2E7D32" stroke-width="2" opacity="0.3"/>
    <path d="M155 55 Q165 50 170 58 Q172 65 165 68 L160 70 Q158 62 155 55 Z" fill="#F57C00" opacity="0.4"/>
  </svg>`,

  custom: '',
}

export default {
  name: 'EmptyState',
  props: {
    type: {
      type: String,
      default: 'data',
      validator: (val: string): boolean => ['data', 'search', 'favorites', 'notifications', 'custom'].includes(val),
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    actionText: {
      type: String,
      default: '',
    },
  },
  emits: ['action'],
  setup(props: { type: string; title: string; description: string; actionText: string }) {
    const svgIllustration = computed<string>(() => {
      return SVG_DATA[props.type] ?? SVG_DATA.data
    })

    const displayTitle = computed<string>(() => {
      return props.title || DEFAULT_TITLES[props.type] || ''
    })

    const displayDescription = computed<string>(() => {
      return props.description || DEFAULT_DESCRIPTIONS[props.type] || ''
    })

    return { svgIllustration, displayTitle, displayDescription }
  },
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl, 48px) var(--spacing-lg, 24px);
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

.empty-illustration {
  width: 160px;
  height: 160px;
  margin-bottom: var(--spacing-lg, 24px);
}

.empty-illustration :deep(svg) {
  width: 100%;
  height: 100%;
}

.empty-title {
  margin: 0 0 var(--spacing-sm, 8px);
  font-size: var(--font-size-lg, 18px);
  font-weight: 600;
  color: var(--color-text-primary, #1a1a1a);
  font-family: var(--font-family-display, "Noto Sans SC", sans-serif);
}

.empty-description {
  margin: 0 0 var(--spacing-lg, 24px);
  font-size: var(--font-size-base, 14px);
  color: var(--color-text-secondary, #666);
  line-height: var(--line-height-normal, 1.5);
  font-family: var(--font-family-display, "Noto Sans SC", sans-serif);
}

.empty-action {
  margin-top: var(--spacing-xs, 4px);
}
</style>
