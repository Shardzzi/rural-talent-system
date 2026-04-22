<template>
  <div class="notification-center">
    <el-page-header @back="goBack" content="通知中心" />

    <div class="center-content">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="未读" name="unread" />
        <el-tab-pane label="系统" name="system" />
        <el-tab-pane label="收藏" name="favorite" />
        <el-tab-pane label="导入" name="import" />
      </el-tabs>

      <div v-if="isLoading" class="center-loading">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <el-empty v-else-if="filteredNotifications.length === 0" description="暂无通知" />

      <template v-else>
        <div class="notification-list">
          <div
            v-for="item in filteredNotifications"
            :key="item.id"
            class="notification-row"
            :class="{ 'is-unread': !item.is_read }"
            @click="handleClick(item)"
          >
            <el-icon class="row-icon" :class="getTypeClass(item.type)">
              <component :is="getTypeIcon(item.type)" />
            </el-icon>
            <div class="row-content">
              <div class="row-header">
                <span class="row-title">{{ item.title }}</span>
                <span class="row-time">{{ formatTimeAgo(item.created_at) }}</span>
              </div>
              <div v-if="item.content" class="row-body">{{ item.content }}</div>
            </div>
            <el-button
              link
              type="danger"
              size="small"
              class="row-delete"
              @click.stop="handleDelete(item.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <div v-if="total > pageSize" class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="fetchNotifications"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  Star,
  Upload,
  Setting,
  InfoFilled,
  Delete,
  Loading
} from '@element-plus/icons-vue'
import personsApi from '@/api/persons'

interface NotificationItem {
  id: number
  type: string
  title: string
  content?: string
  is_read: boolean
  created_at: string
}

export default defineComponent({
  name: 'NotificationCenter',
  components: {
    Bell,
    Star,
    Upload,
    Setting,
    InfoFilled,
    Delete,
    Loading
  },
  setup() {
    const router = useRouter()
    return { router }
  },
  data() {
    return {
      activeTab: 'all' as string,
      isLoading: false,
      notifications: [] as NotificationItem[],
      total: 0,
      currentPage: 1,
      pageSize: 10
    }
  },
  computed: {
    filteredNotifications(): NotificationItem[] {
      if (this.activeTab === 'all') return this.notifications
      if (this.activeTab === 'unread') return this.notifications.filter(n => !n.is_read)
      return this.notifications.filter(n => n.type === this.activeTab)
    }
  },
  mounted() {
    this.fetchNotifications()
  },
  methods: {
    goBack() {
      this.router.push('/')
    },
    async fetchNotifications() {
      this.isLoading = true
      try {
        const res = await personsApi.getNotifications({
          page: this.currentPage,
          limit: this.pageSize
        }) as {
          data?: NotificationItem[]
          notifications?: NotificationItem[]
          total?: number
          pagination?: { total: number }
        }
        const list = res.data ?? res.notifications ?? []
        this.notifications = Array.isArray(list) ? list : []
        this.total = res.total ?? res.pagination?.total ?? this.notifications.length
      } catch {
        this.notifications = []
        this.total = 0
      } finally {
        this.isLoading = false
      }
    },
    getTypeIcon(type: string): string {
      const map: Record<string, string> = {
        system: 'Setting',
        favorite: 'Star',
        import: 'Upload',
        default: 'InfoFilled'
      }
      return map[type] || map.default
    },
    getTypeClass(type: string): string {
      const map: Record<string, string> = {
        system: 'type-system',
        favorite: 'type-favorite',
        import: 'type-import'
      }
      return map[type] || 'type-default'
    },
    formatTimeAgo(dateStr: string): string {
      const now = Date.now()
      const then = new Date(dateStr).getTime()
      const diff = now - then
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}小时前`
      const days = Math.floor(hours / 24)
      if (days < 30) return `${days}天前`
      return new Date(dateStr).toLocaleDateString('zh-CN')
    },
    async handleClick(item: NotificationItem) {
      if (!item.is_read) {
        try {
          await personsApi.markNotificationRead(item.id)
          item.is_read = true
        } catch {
          // silent
        }
      }
    },
    async handleDelete(id: number) {
      try {
        await ElMessageBox.confirm('确定删除此通知吗？', '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        })
        await personsApi.deleteNotification(id)
        ElMessage.success('通知已删除')
        this.fetchNotifications()
      } catch {
        // cancelled or error
      }
    },
    handleTabChange() {
      this.currentPage = 1
    }
  }
})
</script>

<style scoped>
.notification-center {
  padding: var(--spacing-lg);
  max-width: 900px;
  margin: 0 auto;
}

.center-content {
  margin-top: var(--spacing-lg);
}

.center-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.notification-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: #ffffff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background-color var(--transition-fast), box-shadow var(--transition-fast);
}

.notification-row:hover {
  box-shadow: var(--shadow-sm);
  background-color: var(--color-bg-page);
}

.notification-row.is-unread {
  border-left: 3px solid var(--color-primary);
  background-color: var(--color-primary-light-9);
}

.row-icon {
  flex-shrink: 0;
  font-size: 20px;
  margin-top: 2px;
}

.row-icon.type-system {
  color: var(--color-info);
}

.row-icon.type-favorite {
  color: var(--color-warning);
}

.row-icon.type-import {
  color: var(--color-success);
}

.row-icon.type-default {
  color: var(--color-text-secondary);
}

.row-content {
  flex: 1;
  min-width: 0;
}

.row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.row-title {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.row-time {
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
}

.row-body {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
  line-height: var(--line-height-normal);
}

.row-delete {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.notification-row:hover .row-delete {
  opacity: 1;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg) 0;
}
</style>
