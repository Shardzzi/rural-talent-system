<template>
  <div class="quick-filter-tags" v-if="filters.length">
    <el-tag
      v-for="filter in filters"
      :key="filter.id"
      :type="isActive(filter) ? '' : 'info'"
      :effect="isActive(filter) ? 'dark' : 'plain'"
      class="filter-tag"
      @click="$emit('apply', filter.filters)"
    >
      {{ filter.label }}
    </el-tag>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSavedSearches } from '../../composables/useSavedSearches'
import type { QuickFilter } from '../../composables/useSavedSearches'

const props = defineProps<{
  currentFilters: Record<string, unknown>
}>()

defineEmits<{
  apply: [filters: Record<string, unknown>]
}>()

const { getQuickFilters } = useSavedSearches()

const filters = computed(() => getQuickFilters())

function isActive(filter: QuickFilter): boolean {
  return JSON.stringify(filter.filters) === JSON.stringify(props.currentFilters)
}
</script>

<style scoped>
.quick-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-tag {
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.filter-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>
