<template>
  <div class="skeleton-card-list">
    <div v-for="i in count" :key="i" class="skeleton-card card-hover">
      <div class="skeleton-card-header">
        <div class="skeleton-avatar skeleton-shimmer" />
        <div class="skeleton-card-title-group">
          <div class="skeleton-line skeleton-shimmer" style="width: 60%" />
          <div class="skeleton-line skeleton-shimmer short" style="width: 40%" />
        </div>
      </div>
      <div class="skeleton-card-body">
        <div class="skeleton-line skeleton-shimmer" />
        <div class="skeleton-line skeleton-shimmer short" />
      </div>
      <div class="skeleton-card-footer">
        <div class="skeleton-tag skeleton-shimmer" />
        <div class="skeleton-tag skeleton-shimmer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count?: number
}>()
</script>

<style scoped>
.skeleton-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.skeleton-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #ebeef5;
}

.skeleton-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-card-title-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-card-body {
  margin-bottom: 12px;
}

.skeleton-line {
  height: 16px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.skeleton-line.short {
  height: 12px;
}

.skeleton-card-footer {
  display: flex;
  gap: 8px;
}

.skeleton-tag {
  height: 24px;
  width: 64px;
  border-radius: 4px;
}
</style>
