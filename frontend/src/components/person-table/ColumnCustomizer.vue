<template>
  <el-popover placement="bottom-end" :width="220" trigger="click">
    <template #reference>
      <el-button :icon="Setting" circle size="small" />
    </template>
    <div class="column-customizer">
      <div class="customizer-title">显示列</div>
      <el-checkbox
        :model-value="isAllVisible"
        :indeterminate="isIndeterminate"
        @change="toggleAll"
      >
        全选
      </el-checkbox>
      <el-divider style="margin: 8px 0" />
      <el-scrollbar max-height="300px">
        <div
          v-for="col in availableColumns"
          :key="col.key"
          class="column-item"
        >
          <el-checkbox
            :model-value="isVisible(col.key)"
            @change="(val: boolean) => toggleColumn(col.key, val)"
          >
            {{ col.label }}
          </el-checkbox>
        </div>
      </el-scrollbar>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import type { ColumnConfig } from './tableConfig'

const props = defineProps<{
  availableColumns: ColumnConfig[]
  visibleKeys: string[]
}>()

const emit = defineEmits<{
  'update:visibleKeys': [keys: string[]]
}>()

function isVisible(key: string): boolean {
  return props.visibleKeys.includes(key)
}

const isAllVisible = computed(() => {
  return props.availableColumns.length > 0 && props.availableColumns.every(col => isVisible(col.key))
})

const isIndeterminate = computed(() => {
  const visibleCount = props.availableColumns.filter(col => isVisible(col.key)).length
  return visibleCount > 0 && visibleCount < props.availableColumns.length
})

function toggleColumn(key: string, checked: boolean): void {
  const next = checked
    ? [...props.visibleKeys, key]
    : props.visibleKeys.filter(k => k !== key)
  emit('update:visibleKeys', next)
}

function toggleAll(checked: boolean | string | number): void {
  if (checked) {
    emit('update:visibleKeys', props.availableColumns.map(col => col.key))
  } else {
    emit('update:visibleKeys', [])
  }
}
</script>

<style scoped>
.column-customizer {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.customizer-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: #303133;
}

.column-item {
  padding: 2px 0;
}
</style>
