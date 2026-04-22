<template>
  <el-tooltip content="通知" placement="bottom" :hide-after="0">
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notification-badge">
      <el-button link class="bell-btn" @click="handleClick">
        <el-icon :size="20"><Bell /></el-icon>
      </el-button>
    </el-badge>
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import personsApi from '@/api/persons'

export default defineComponent({
  name: 'NotificationBell',
  components: { Bell },
  emits: ['open-center'],
  data() {
    return {
      unreadCount: 0,
      pollTimer: null as ReturnType<typeof setInterval> | null
    }
  },
  mounted() {
    this.fetchUnreadCount()
    this.pollTimer = setInterval(this.fetchUnreadCount, 30000)
  },
  beforeUnmount() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  },
  methods: {
    async fetchUnreadCount() {
      try {
        const res = await personsApi.getUnreadNotificationCount() as { count?: number }
        this.unreadCount = res.count ?? 0
      } catch {
        this.unreadCount = 0
      }
    },
    handleClick() {
      this.$emit('open-center')
    }
  }
})
</script>

<style scoped>
.bell-btn {
  color: var(--color-text-regular);
  padding: 4px;
}

.bell-btn:hover {
  color: var(--color-primary);
}

.notification-badge :deep(.el-badge__content) {
  top: 4px;
  right: 4px;
}
</style>
