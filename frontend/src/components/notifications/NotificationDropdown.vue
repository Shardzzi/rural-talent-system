<template>
  <el-popover
    placement="bottom-end"
    :width="380"
    trigger="click"
    :visible="dropdownVisible"
    @update:visible="dropdownVisible = $event"
  >
    <template #reference>
      <slot />
    </template>
    <div class="notification-dropdown">
      <div class="dropdown-header">
        <span class="dropdown-title">通知消息</span>
        <el-button
          v-if="notifications.length > 0"
          link
          type="primary"
          size="small"
          @click="handleMarkAllRead"
        >
          全部已读
        </el-button>
      </div>

      <div v-if="isLoading" class="dropdown-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="notifications.length === 0" class="dropdown-empty">
        <el-empty description="暂无通知" :image-size="60" />
      </div>

      <div v-else class="dropdown-list">
        <div
          v-for="item in notifications"
          :key="item.id"
          class="notification-item"
          :class="{ 'is-unread': !item.is_read }"
          @click="handleItemClick(item)"
        >
          <el-icon class="notification-icon" :class="getTypeClass(item.type)">
            <component :is="getTypeIcon(item.type)" />
          </el-icon>
          <div class="notification-content">
            <div class="notification-title">{{ item.title }}</div>
            <div class="notification-time">{{ formatTimeAgo(item.created_at) }}</div>
          </div>
          <span v-if="!item.is_read" class="unread-dot" />
        </div>
      </div>

      <div v-if="notifications.length > 0" class="dropdown-footer">
        <el-button link type="primary" @click="handleViewAll">
          查看全部
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  Star,
  Upload,
  Setting,
  InfoFilled,
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
  name: 'NotificationDropdown',
  components: { Bell, Star, Upload, Setting, InfoFilled, Loading },
  setup() {
    const router = useRouter()
    return { router }
  },
  data() {
    return {
      dropdownVisible: false,
      isLoading: false,
      notifications: [] as NotificationItem[]
    }
  },
  watch: {
    dropdownVisible(val: boolean) {
      if (val) {
        this.fetchNotifications()
      }
    }
  },
  methods: {
    async fetchNotifications() {
      this.isLoading = true
      try {
        const res = await personsApi.getNotifications({ page: 1, limit: 5 }) as {
          data?: NotificationItem[]
          notifications?: NotificationItem[]
        }
        this.notifications = res.data ?? res.notifications ?? []
      } catch {
        this.notifications = []
      } finally {
        this.isLoading = false
      }
    },
    getTypeIcon(type: string) {
      const iconMap: Record<string, string> = {
        system: 'Setting',
        favorite: 'Star',
        import: 'Upload',
        default: 'InfoFilled'
      }
      return iconMap[type] || iconMap.default
    },
    getTypeClass(type: string) {
      const classMap: Record<string, string> = {
        system: 'type-system',
        favorite: 'type-favorite',
        import: 'type-import'
      }
      return classMap[type] || 'type-default'
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
    async handleItemClick(item: NotificationItem) {
      if (!item.is_read) {
        try {
          await personsApi.markNotificationRead(item.id)
          item.is_read = true
        } catch {
          // silent
        }
      }
      this.dropdownVisible = false
    },
    async handleMarkAllRead() {
      try {
        await personsApi.markAllNotificationsRead()
        this.notifications.forEach(n => {
          n.is_read = true
        })
      } catch {
        // silent
      }
    },
    handleViewAll() {
      this.dropdownVisible = false
      this.router.push('/notifications')
    }
  }
})
</script>

<style scoped>
.notification-dropdown {
  padding: 0;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.dropdown-title {
  font-weight: 600;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.dropdown-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 24px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.dropdown-empty {
  padding: 12px 0;
}

.dropdown-list {
  max-height: 320px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.notification-item:hover {
  background-color: var(--color-bg-page);
}

.notification-item.is-unread {
  background-color: var(--color-primary-light-9);
}

.notification-item.is-unread:hover {
  background-color: var(--color-primary-light-7);
}

.notification-icon {
  flex-shrink: 0;
  font-size: 18px;
  margin-top: 2px;
}

.notification-icon.type-system {
  color: var(--color-info);
}

.notification-icon.type-favorite {
  color: var(--color-warning);
}

.notification-icon.type-import {
  color: var(--color-success);
}

.notification-icon.type-default {
  color: var(--color-text-secondary);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
  margin-top: 4px;
}

.unread-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  background-color: var(--color-danger);
  border-radius: var(--radius-round);
  margin-top: 6px;
}

.dropdown-footer {
  padding: 8px 16px;
  text-align: center;
  border-top: 1px solid var(--color-border-light);
}
</style>
