<template>
  <div class="person-table-wrapper" :class="'density-' + density">
    <div class="table-toolbar">
      <slot name="toolbar-left" />
      <div class="toolbar-right">
        <el-tooltip :content="densityLabel" placement="top">
          <el-button circle size="small" @click="cycleDensity">
            <el-icon><component :is="currentDensityIcon" /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="虚拟滚动" placement="top">
          <el-button
            circle
            size="small"
            :type="virtualScrollEnabled ? 'primary' : 'default'"
            @click="toggleVirtualScroll"
          >
            <el-icon><List /></el-icon>
          </el-button>
        </el-tooltip>
        <ColumnCustomizer
          v-if="!isMobile"
          :available-columns="availableColumns"
          :visible-keys="visibleKeys"
          @update:visible-keys="handleVisibleKeysChange"
        />
      </div>
    </div>

    <PersonCardList
      v-if="isMobile"
      ref="cardListRef"
      :data="data"
      :role="role"
      :loading="loading"
      @row-click="(row: Record<string, unknown>) => emit('row-click', row)"
      @edit="(row: Record<string, unknown>) => emit('edit', row)"
    />

    <template v-else>
      <div :class="{ 'virtual-scroll-wrapper': virtualScrollEnabled && !isMobile && data.length > 50 }">
        <el-table
        ref="tableRef"
        :data="data"
        v-loading="loading"
        element-loading-text="正在加载..."
        style="width: 100%"
        :row-class-name="tableRowClassName"
        :default-sort="defaultSort"
        :row-key="rowKey"
        @sort-change="(sort: any) => emit('sort-change', sort)"
        @selection-change="(rows: any) => emit('selection-change', rows)"
        @row-click="(row: any) => emit('row-click', row)"
      >
        <el-table-column
          v-if="showSelection"
          type="selection"
          width="55"
        />
        <el-table-column
          v-if="showIndex"
          type="index"
          label="序号"
          :width="60"
        />

        <el-table-column type="expand" v-if="showExpand">
          <template #default="{ row }">
            <div class="expand-content">
              <div class="expand-row">
                <span class="expand-label">邮箱:</span>
                <span class="expand-value">{{ row.email || '未填写' }}</span>
              </div>
              <div class="expand-row">
                <span class="expand-label">电话:</span>
                <span class="expand-value">{{ row.phone || '未填写' }}</span>
              </div>
              <div class="expand-row">
                <span class="expand-label">技能专长:</span>
                <span class="expand-value">{{ row.skills || '未填写' }}</span>
              </div>
              <div class="expand-row">
                <span class="expand-label">创建时间:</span>
                <span class="expand-value">{{ formatDate(row.created_at as string) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          v-for="col in visibleColumns"
          :key="col.key"
          :prop="col.key"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :sortable="col.sortable ? 'custom' : false"
          :show-overflow-tooltip="col.showOverflowTooltip"
          :class-name="col.className"
        >
          <template v-if="col.key === 'created_at'" #default="scope">
            {{ formatDate(scope.row.created_at as string) }}
          </template>
        </el-table-column>

        <slot name="actions" />
      </el-table>
      </div>

      <div v-if="!loading && data.length === 0" class="no-results">
        <div class="no-results-content">
          <el-icon class="no-results-icon"><DocumentRemove /></el-icon>
          <h3>暂无匹配结果</h3>
          <p>暂时还没有人员信息</p>
        </div>
      </div>
    </template>

    <div v-if="showPagination" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="internalCurrentPage"
        v-model:page-size="internalPageSize"
        :page-sizes="pageSizes"
        :layout="isMobile ? 'prev, pager, next' : paginationLayout"
        :total="total"
        :small="isMobile"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type Component } from 'vue'
import { DocumentRemove, Minus, Grid, FullScreen, List } from '@element-plus/icons-vue'
import ColumnCustomizer from './ColumnCustomizer.vue'
import PersonCardList from './PersonCardList.vue'
import {
  type RoleType,
  type TableDensity,
  getColumnsForRole,
  getDefaultVisibleKeys,
  loadVisibleKeys,
  saveVisibleKeys,
  loadDensity,
  saveDensity,
  formatDate
} from './tableConfig'

const props = withDefaults(defineProps<{
  data: Record<string, unknown>[]
  role: RoleType
  loading?: boolean
  total?: number
  currentPage?: number
  pageSize?: number
  pageSizes?: number[]
  paginationLayout?: string
  showSelection?: boolean
  showIndex?: boolean
  showExpand?: boolean
  showPagination?: boolean
  rowKey?: string
  defaultSort?: { prop: string; order: string }
}>(), {
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  pageSizes: () => [10, 20, 50, 100],
  paginationLayout: 'total, sizes, prev, pager, next, jumper',
  showSelection: false,
  showIndex: true,
  showExpand: false,
  showPagination: true,
  rowKey: 'id',
  defaultSort: () => ({ prop: 'created_at', order: 'descending' })
})

const emit = defineEmits<{
  'page-change': [page: number]
  'size-change': [size: number]
  'row-click': [row: Record<string, unknown>]
  'sort-change': [sort: { prop: string; order: string }]
  'selection-change': [rows: Record<string, unknown>[]]
  'edit': [row: Record<string, unknown>]
}>()

const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

function handleMobileChange(e: MediaQueryListEvent | MediaQueryList): void {
  isMobile.value = e.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px)')
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleMobileChange)
})

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleMobileChange)
  }
})

const availableColumns = computed(() => getColumnsForRole(props.role))

const density = ref<TableDensity>(loadDensity())

const DENSITY_ICONS: Record<TableDensity, Component> = {
  compact: Minus,
  default: Grid,
  comfortable: FullScreen
}

const DENSITY_LABELS: Record<TableDensity, string> = {
  compact: '紧凑模式',
  default: '默认模式',
  comfortable: '舒适模式'
}

const currentDensityIcon = computed(() => DENSITY_ICONS[density.value])
const densityLabel = computed(() => DENSITY_LABELS[density.value])

function cycleDensity(): void {
  const cycle: TableDensity[] = ['default', 'compact', 'comfortable']
  const idx = cycle.indexOf(density.value)
  density.value = cycle[(idx + 1) % cycle.length]
  saveDensity(density.value)
}

const storedKeys = loadVisibleKeys(props.role)
const visibleKeys = ref<string[]>(
  storedKeys ?? getDefaultVisibleKeys(props.role)
)

watch(() => props.role, (newRole) => {
  const stored = loadVisibleKeys(newRole)
  visibleKeys.value = stored ?? getDefaultVisibleKeys(newRole)
})

function handleVisibleKeysChange(keys: string[]): void {
  visibleKeys.value = keys
  saveVisibleKeys(props.role, keys)
}

const visibleColumns = computed(() => {
  const keySet = new Set(visibleKeys.value)
  return availableColumns.value.filter(col => keySet.has(col.key))
})

const internalCurrentPage = computed({
  get: () => props.currentPage,
  set: () => {}
})

const internalPageSize = computed({
  get: () => props.pageSize,
  set: () => {}
})

function handleSizeChange(size: number): void {
  emit('size-change', size)
}

function handleCurrentChange(page: number): void {
  emit('page-change', page)
}

function tableRowClassName({ rowIndex }: { rowIndex: number }): string {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

const VIRTUAL_SCROLL_KEY = 'person-table-virtual-scroll'

const virtualScrollEnabled = ref(loadVirtualScroll())

function loadVirtualScroll(): boolean {
  try {
    return localStorage.getItem(VIRTUAL_SCROLL_KEY) === 'true'
  } catch {
    return false
  }
}

function toggleVirtualScroll(): void {
  virtualScrollEnabled.value = !virtualScrollEnabled.value
  try {
    localStorage.setItem(VIRTUAL_SCROLL_KEY, String(virtualScrollEnabled.value))
  } catch { /* ignore */ }
}

const tableRef = ref<Component | null>(null)
const cardListRef = ref<{ listRef: HTMLElement | null; sentinelRef: HTMLElement | null } | null>(null)

defineExpose({
  density,
  visibleKeys,
  visibleColumns,
  tableRef,
  cardListRef,
  isMobile
})
</script>

<style scoped>
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.expand-content {
  padding: 16px 20px;
  background-color: #f8fbff;
  border-radius: 4px;
  margin: 12px;
  border-left: 4px solid #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);
}

.expand-row {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
}

.expand-row:last-child {
  margin-bottom: 0;
}

.expand-label {
  font-weight: bold;
  color: #606266;
  min-width: 80px;
  margin-right: 10px;
}

.expand-value {
  color: #303133;
  flex: 1;
}

.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
  padding: 40px 20px;
  margin: 20px 0;
}

.no-results-content {
  text-align: center;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.no-results-icon {
  font-size: 64px;
  color: #a0cfff;
  margin-bottom: 24px;
  background: #f4f9ff;
  width: 120px;
  height: 120px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.no-results h3 {
  color: #303133;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 600;
}

.no-results p {
  color: #909399;
  margin-bottom: 24px;
  line-height: 1.6;
  font-size: 15px;
}

:deep(.even-row) {
  background-color: #fafafa;
}

:deep(.odd-row) {
  background-color: #ffffff;
}

:deep(.el-table__body tr:hover > td.el-table__cell) {
  background-color: #ecf5ff !important;
}

.density-compact :deep(.el-table .el-table__cell) {
  padding: 4px 0;
}

.density-compact :deep(.el-table .cell) {
  font-size: 13px;
}

.density-default :deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

.density-comfortable :deep(.el-table .el-table__cell) {
  padding: 14px 0;
}

.density-comfortable :deep(.el-table .cell) {
  font-size: 15px;
}

.virtual-scroll-wrapper {
  max-height: 600px;
  overflow-y: auto;
}

.virtual-scroll-wrapper :deep(.el-table) {
  height: 100%;
}

@media (max-width: 768px) {
  .pagination-wrapper {
    text-align: center;
  }

  :deep(.el-pagination) {
    justify-content: center;
  }

  :deep(.el-pagination .el-pagination__sizes),
  :deep(.el-pagination .el-pagination__jump) {
    display: none;
  }
}
</style>
