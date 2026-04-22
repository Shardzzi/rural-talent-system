<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <el-button size="default" :type="savedSearches.length ? 'primary' : 'default'" plain>
      <el-icon><Collection /></el-icon>
      已保存搜索
      <el-badge v-if="savedSearches.length" :value="savedSearches.length" class="saved-badge" />
    </el-button>
    <template #dropdown>
      <el-dropdown-menu class="saved-searches-menu">
        <el-dropdown-item v-if="savedSearches.length === 0" disabled>
          <span class="empty-text">暂无已保存的搜索</span>
        </el-dropdown-item>
        <el-dropdown-item
          v-for="search in savedSearches"
          :key="search.id"
          :command="'apply:' + search.id"
        >
          <div class="search-item">
            <span class="search-name">{{ search.name }}</span>
            <el-button
              type="danger"
              size="small"
              text
              @click.stop="$emit('delete', search.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </el-dropdown-item>
        <el-dropdown-item divided command="save">
          <el-icon><FolderAdd /></el-icon>
          保存当前搜索条件
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>

  <el-dialog v-model="showSaveDialog" title="保存搜索条件" width="400px" :append-to-body="true">
    <el-input
      v-model="saveName"
      placeholder="请输入搜索名称"
      maxlength="30"
      show-word-limit
      @keyup.enter="confirmSave"
    />
    <template #footer>
      <el-button @click="showSaveDialog = false">取消</el-button>
      <el-button type="primary" @click="confirmSave" :disabled="!saveName.trim()">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Collection, Delete, FolderAdd } from '@element-plus/icons-vue'
import { useSavedSearches } from '../../composables/useSavedSearches'
import type { SavedSearch } from '../../composables/useSavedSearches'

defineProps<{
  currentFilters: Record<string, unknown>
}>()

const emit = defineEmits<{
  apply: [filters: Record<string, unknown>]
  delete: [id: string]
  save: [name: string]
}>()

const { getSavedSearches } = useSavedSearches()

const savedSearches = ref<SavedSearch[]>([])
const showSaveDialog = ref(false)
const saveName = ref('')

onMounted(() => {
  refreshList()
})

function refreshList() {
  savedSearches.value = getSavedSearches()
}

function handleCommand(command: string) {
  if (command === 'save') {
    saveName.value = ''
    showSaveDialog.value = true
    return
  }
  if (command.startsWith('apply:')) {
    const id = command.substring(6)
    const { applySavedSearch } = useSavedSearches()
    const filters = applySavedSearch(id)
    if (filters) {
      emit('apply', filters)
    }
  }
}

function confirmSave() {
  const name = saveName.value.trim()
  if (!name) return
  emit('save', name)
  showSaveDialog.value = false
  ElMessage.success(`已保存搜索"${name}"`)
  refreshList()
}

defineExpose({ refreshList })
</script>

<style scoped>
.saved-badge {
  margin-left: 4px;
}

.search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.search-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-text {
  color: #909399;
  font-size: 13px;
}
</style>
