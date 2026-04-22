<template>
  <el-dropdown trigger="click" @command="handleCommand" v-if="history.length">
    <el-button size="default" text type="info">
      <el-icon><Clock /></el-icon>
      搜索历史
    </el-button>
    <template #dropdown>
      <el-dropdown-menu class="history-menu">
        <el-dropdown-item
          v-for="(entry, index) in history"
          :key="index"
          :command="index"
        >
          <div class="history-item">
            <div class="history-info">
              <span class="history-query">{{ entry.query || '无关键词搜索' }}</span>
              <span class="history-time">{{ formatTime(entry.timestamp) }}</span>
            </div>
          </div>
        </el-dropdown-item>
        <el-dropdown-item divided command="clear">
          <span class="clear-text">清空历史记录</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { useSavedSearches } from '../../composables/useSavedSearches'
import type { HistoryEntry } from '../../composables/useSavedSearches'

const emit = defineEmits<{
  apply: [filters: Record<string, unknown>]
}>()

const { getSearchHistory, clearHistory } = useSavedSearches()

const history = ref<HistoryEntry[]>([])

onMounted(() => {
  refreshList()
})

function refreshList() {
  history.value = getSearchHistory()
}

function handleCommand(command: number | string) {
  if (command === 'clear') {
    clearHistory()
    history.value = []
    return
  }
  const index = command as number
  if (history.value[index]) {
    emit('apply', { ...history.value[index].filters })
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  return date.toLocaleDateString('zh-CN')
}

defineExpose({ refreshList })
</script>

<style scoped>
.history-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-query {
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.history-time {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
}

.clear-text {
  color: #f56c6c;
  font-size: 13px;
}
</style>
