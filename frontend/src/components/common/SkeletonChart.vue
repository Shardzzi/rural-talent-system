<template>
  <div class="skeleton-chart">
    <div class="skeleton-chart-area skeleton-shimmer" />
    <div class="skeleton-chart-axis-x skeleton-shimmer" />
    <div class="skeleton-chart-axis-y skeleton-shimmer" />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.skeleton-chart {
  position: relative;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  height: 300px;
}

.skeleton-chart-area {
  position: absolute;
  top: 20px;
  left: 50px;
  right: 20px;
  bottom: 40px;
  border-radius: 4px;
}

.skeleton-chart-axis-x {
  position: absolute;
  bottom: 20px;
  left: 50px;
  right: 20px;
  height: 20px;
  border-radius: 4px;
}

.skeleton-chart-axis-y {
  position: absolute;
  top: 20px;
  left: 20px;
  bottom: 20px;
  width: 30px;
  border-radius: 4px;
}
</style>
