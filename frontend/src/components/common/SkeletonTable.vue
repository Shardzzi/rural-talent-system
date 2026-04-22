<template>
  <div class="skeleton-table">
    <div class="skeleton-table-header">
      <div v-for="c in columns" :key="'h' + c" class="skeleton-cell header skeleton-shimmer" />
    </div>
    <div v-for="r in rows" :key="'r' + r" class="skeleton-table-row">
      <div v-for="c in columns" :key="'c' + r + '-' + c" class="skeleton-cell skeleton-shimmer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  rows?: number
  columns?: number
}>()
</script>

<style scoped>
.skeleton-table {
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-table-header {
  display: flex;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.skeleton-table-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-table-row:last-child {
  border-bottom: none;
}

.skeleton-cell {
  flex: 1;
  height: 44px;
  padding: 12px 16px;
  box-sizing: border-box;
}

.skeleton-cell.header {
  height: 48px;
}
</style>
