<template>
  <div class="person-card-list" ref="listRef">
    <div
      v-for="person in data"
      :key="String(person.id)"
      class="person-card"
      @click="$emit('row-click', person)"
    >
      <div class="card-header">
        <span class="card-name">{{ person.name }}</span>
        <span class="card-info">{{ person.gender }} · {{ person.age }}岁</span>
      </div>
      <div class="card-body">
        <div v-if="getSkillsPreview(person).length" class="card-skills">
          <el-tag
            v-for="skill in getSkillsPreview(person)"
            :key="skill"
            size="small"
            type="success"
          >{{ skill }}</el-tag>
        </div>
        <div v-if="person.education_level" class="card-field">
          <span class="field-label">学历</span>
          <span class="field-value">{{ person.education_level }}</span>
        </div>
        <div v-if="person.employment_status" class="card-field">
          <span class="field-label">状态</span>
          <span class="field-value">{{ person.employment_status }}</span>
        </div>
      </div>
      <div v-if="person.address" class="card-footer">
        <span class="card-address">{{ truncateAddress(person.address) }}</span>
      </div>
      <div class="card-actions" @click.stop>
        <el-button size="small" type="primary" link @click="$emit('row-click', person)">
          查看
        </el-button>
        <el-button
          v-if="role !== 'guest'"
          size="small"
          type="primary"
          link
          @click="$emit('edit', person)"
        >
          编辑
        </el-button>
      </div>
    </div>
    <div v-if="loading" class="card-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-if="!loading && data.length === 0" class="empty-cards">
      <el-icon class="empty-icon"><DocumentRemove /></el-icon>
      <p>暂无数据</p>
    </div>
    <div ref="sentinelRef" class="scroll-sentinel" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DocumentRemove, Loading } from '@element-plus/icons-vue'
import type { RoleType } from './tableConfig'

defineProps<{
  data: Record<string, unknown>[]
  role: RoleType
  loading?: boolean
}>()

defineEmits<{
  'row-click': [row: Record<string, unknown>]
  'edit': [row: Record<string, unknown>]
}>()

const listRef = ref<HTMLElement | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)

function getSkillsPreview(person: Record<string, unknown>): string[] {
  if (!person.skills) return []
  try {
    let raw = person.skills
    if (typeof raw === 'string') {
      raw = JSON.parse(raw)
    }
    if (Array.isArray(raw)) {
      const skills = raw.slice(0, 3) as Array<Record<string, unknown>>
      return skills
        .map(s => (s.skill_name || s.name || '') as string)
        .filter(Boolean)
    }
    if (typeof raw === 'string') {
      return [raw].slice(0, 3)
    }
  } catch {
    if (typeof person.skills === 'string') {
      return [person.skills].slice(0, 3)
    }
  }
  return []
}

function truncateAddress(address: unknown): string {
  if (!address || typeof address !== 'string') return ''
  return address.length > 20 ? address.slice(0, 20) + '...' : address
}

defineExpose({
  listRef,
  sentinelRef
})
</script>

<style scoped>
.person-card-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 12px);
}

.person-card {
  background: var(--el-bg-color, #fff);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-md, 16px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08));
  border: 1px solid var(--color-border-light, #e4e7ed);
  transition: box-shadow var(--transition-fast, 150ms ease);
  cursor: pointer;
}

.person-card:active {
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm, 8px);
}

.card-name {
  font-size: var(--font-size-md, 16px);
  font-weight: 600;
  color: var(--color-text-primary, #1a1a1a);
}

.card-info {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-secondary, #666);
}

.card-body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm, 8px);
  margin-bottom: var(--spacing-sm, 8px);
}

.card-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  width: 100%;
}

.card-field {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-sm, 13px);
}

.field-label {
  color: var(--color-text-placeholder, #999);
}

.field-value {
  color: var(--color-text-regular, #333);
}

.card-footer {
  margin-bottom: var(--spacing-sm, 8px);
}

.card-address {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-secondary, #666);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs, 4px);
  padding-top: var(--spacing-sm, 8px);
  border-top: 1px solid var(--color-border-light, #e4e7ed);
}

.card-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm, 8px);
  padding: var(--spacing-lg, 24px);
  color: var(--color-text-placeholder, #999);
  font-size: var(--font-size-sm, 13px);
}

.empty-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl, 48px) 0;
  color: var(--color-text-placeholder, #999);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md, 16px);
  color: var(--color-border, #dcdfe6);
}

.empty-cards p {
  font-size: var(--font-size-base, 14px);
}

.scroll-sentinel {
  height: 1px;
  width: 100%;
}
</style>
