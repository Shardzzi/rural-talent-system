<template>
  <transition name="batch-bar">
    <div v-if="selectedCount > 0" class="batch-action-bar">
      <div class="batch-info">
        <el-icon class="batch-icon"><Select /></el-icon>
        <span>已选 <strong>{{ selectedCount }}</strong> 人</span>
      </div>
      <div class="batch-actions">
        <el-button type="primary" size="small" @click="emit('export-selected')">
          <el-icon><Download /></el-icon>
          批量导出
        </el-button>
        <el-button type="warning" size="small" @click="showBatchEditDialog = true">
          <el-icon><Edit /></el-icon>
          批量修改
        </el-button>
        <el-popconfirm
          :title="`确定要删除选中的 ${selectedCount} 条记录吗？此操作不可恢复。`"
          confirm-button-text="确定删除"
          cancel-button-text="取消"
          confirm-button-type="danger"
          @confirm="emit('batch-delete')"
        >
          <template #reference>
            <el-button type="danger" size="small">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>
  </transition>

  <el-dialog
    v-model="showBatchEditDialog"
    title="批量修改"
    width="500px"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form label-width="100px">
      <el-form-item label="学历">
        <el-select v-model="batchEditForm.education_level" placeholder="选择学历" clearable>
          <el-option label="高中及以下" value="高中及以下" />
          <el-option label="专科" value="专科" />
          <el-option label="本科" value="本科" />
          <el-option label="硕士及以上" value="硕士及以上" />
        </el-select>
      </el-form-item>
      <el-form-item label="就业状态">
        <el-select v-model="batchEditForm.employment_status" placeholder="选择状态" clearable>
          <el-option label="在岗" value="在岗" />
          <el-option label="求职中" value="求职中" />
          <el-option label="已退休" value="已退休" />
        </el-select>
      </el-form-item>
      <el-form-item label="政治面貌">
        <el-select v-model="batchEditForm.political_status" placeholder="选择政治面貌" clearable>
          <el-option label="群众" value="群众" />
          <el-option label="共青团员" value="共青团员" />
          <el-option label="党员" value="党员" />
        </el-select>
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="batchEditForm.address" placeholder="输入新地址" clearable />
      </el-form-item>
      <el-form-item label="电话">
        <el-input v-model="batchEditForm.phone" placeholder="输入新电话" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showBatchEditDialog = false">取消</el-button>
      <el-button type="primary" @click="handleBatchUpdate" :disabled="!hasBatchUpdateFields">
        确认修改
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Select, Download, Edit, Delete } from '@element-plus/icons-vue'

defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  'batch-delete': []
  'batch-update': [updates: Record<string, unknown>]
  'export-selected': []
}>()

const showBatchEditDialog = ref(false)
const batchEditForm = ref<Record<string, string>>({
  education_level: '',
  employment_status: '',
  political_status: '',
  address: '',
  phone: ''
})

const hasBatchUpdateFields = computed(() => {
  return Object.values(batchEditForm.value).some(v => v !== '')
})

function handleBatchUpdate(): void {
  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(batchEditForm.value)) {
    if (value !== '') {
      updates[key] = value
    }
  }
  if (Object.keys(updates).length > 0) {
    emit('batch-update', updates)
    showBatchEditDialog.value = false
    batchEditForm.value = {
      education_level: '',
      employment_status: '',
      political_status: '',
      address: '',
      phone: ''
    }
  }
}
</script>

<style scoped>
.batch-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  margin-bottom: 16px;
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 12px;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-size: 14px;
}

.batch-icon {
  font-size: 20px;
}

.batch-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.batch-bar-enter-active,
.batch-bar-leave-active {
  transition: all 0.3s ease;
}

.batch-bar-enter-from,
.batch-bar-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .batch-action-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .batch-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
