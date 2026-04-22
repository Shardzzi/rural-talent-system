<template>
  <div class="favorite-list">
    <div v-if="isLoading" class="list-loading">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <el-empty v-else-if="favorites.length === 0" description="暂无收藏">
      <template #image>
        <el-icon :size="48" color="var(--color-text-placeholder)"><Star /></el-icon>
      </template>
    </el-empty>

    <template v-else>
      <el-row :gutter="16">
        <el-col v-for="item in favorites" :key="item.person_id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="favorite-card" shadow="hover">
            <div class="card-header">
              <el-icon class="card-star" color="var(--color-warning)"><StarFilled /></el-icon>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleRemove(item.person_id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <div class="card-name">{{ item.person_name }}</div>
            <div class="card-info">
              <span v-if="item.person_skill" class="info-tag">
                <el-icon><Opportunity /></el-icon>
                {{ item.person_skill }}
              </span>
              <span v-if="item.person_address" class="info-tag">
                <el-icon><Location /></el-icon>
                {{ item.person_address }}
              </span>
            </div>
            <div v-if="item.notes" class="card-notes">
              <el-icon><EditPen /></el-icon>
              <span>{{ truncate(item.notes, 60) }}</span>
            </div>
            <div class="card-footer">
              <el-button link type="primary" size="small" @click="handleEditNotes(item)">
                <el-icon><EditPen /></el-icon>
                编辑备注
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div v-if="total > pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchFavorites"
        />
      </div>
    </template>

    <FavoriteNotesDialog
      :visible="notesDialogVisible"
      :person-id="editingPersonId"
      :notes="editingNotes"
      @update:visible="notesDialogVisible = $event"
      @save="handleSaveNotes"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Star,
  StarFilled,
  Delete,
  EditPen,
  Opportunity,
  Location,
  Loading
} from '@element-plus/icons-vue'
import FavoriteNotesDialog from './FavoriteNotesDialog.vue'
import personsApi from '@/api/persons'

interface FavoriteItem {
  person_id: number
  person_name: string
  person_skill?: string
  person_address?: string
  notes?: string
  created_at: string
}

export default defineComponent({
  name: 'FavoriteList',
  components: {
    Star,
    StarFilled,
    Delete,
    EditPen,
    Opportunity,
    Location,
    Loading,
    FavoriteNotesDialog
  },
  data() {
    return {
      isLoading: false,
      favorites: [] as FavoriteItem[],
      total: 0,
      currentPage: 1,
      pageSize: 12,
      notesDialogVisible: false,
      editingPersonId: 0,
      editingNotes: ''
    }
  },
  mounted() {
    this.fetchFavorites()
  },
  methods: {
    async fetchFavorites() {
      this.isLoading = true
      try {
        const res = await personsApi.getFavorites() as {
          data?: FavoriteItem[]
          favorites?: FavoriteItem[]
          total?: number
          pagination?: { total: number }
        }
        const list = res.data ?? res.favorites ?? []
        this.favorites = Array.isArray(list) ? list : []
        this.total = res.total ?? res.pagination?.total ?? this.favorites.length
      } catch {
        this.favorites = []
        this.total = 0
      } finally {
        this.isLoading = false
      }
    },
    async handleRemove(personId: number) {
      try {
        await ElMessageBox.confirm('确定取消收藏吗？', '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        })
        await personsApi.removeFavorite(personId)
        ElMessage.success('已取消收藏')
        this.fetchFavorites()
      } catch {
        // cancelled or error
      }
    },
    handleEditNotes(item: FavoriteItem) {
      this.editingPersonId = item.person_id
      this.editingNotes = item.notes ?? ''
      this.notesDialogVisible = true
    },
    async handleSaveNotes(notes: string) {
      try {
        await personsApi.updateFavoriteNotes(this.editingPersonId, notes)
        ElMessage.success('备注已更新')
        this.fetchFavorites()
      } catch {
        ElMessage.error('保存失败')
      }
    },
    truncate(str: string, max: number): string {
      return str.length > max ? str.slice(0, max) + '...' : str
    }
  }
})
</script>

<style scoped>
.favorite-list {
  width: 100%;
}

.list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.favorite-card {
  margin-bottom: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: box-shadow var(--transition-normal);
}

.favorite-card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.card-star {
  font-size: 16px;
}

.card-name {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--spacing-sm);
}

.info-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.card-notes {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
  background-color: var(--color-bg-page);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-sm);
  line-height: var(--line-height-normal);
}

.card-footer {
  text-align: right;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg) 0;
}
</style>
