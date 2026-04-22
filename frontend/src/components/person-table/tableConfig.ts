export interface ColumnConfig {
  key: string
  label: string
  width?: number | string
  minWidth?: number | string
  sortable?: boolean
  visibleByDefault?: boolean
  roles: ('admin' | 'user' | 'guest')[]
  showOverflowTooltip?: boolean
  className?: string
  formatter?: (row: Record<string, unknown>) => string
}

const ALL_COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    label: '姓名',
    width: 100,
    minWidth: 80,
    sortable: true,
    visibleByDefault: true,
    roles: ['admin', 'user', 'guest']
  },
  {
    key: 'age',
    label: '年龄',
    width: 60,
    sortable: true,
    visibleByDefault: true,
    roles: ['admin', 'user', 'guest']
  },
  {
    key: 'gender',
    label: '性别',
    width: 60,
    visibleByDefault: true,
    roles: ['admin', 'user', 'guest']
  },
  {
    key: 'education_level',
    label: '学历',
    width: 100,
    sortable: true,
    visibleByDefault: true,
    roles: ['admin', 'user', 'guest'],
    className: 'hidden-xs-only'
  },
  {
    key: 'skills',
    label: '技能专长',
    minWidth: 120,
    visibleByDefault: true,
    roles: ['admin', 'user', 'guest'],
    showOverflowTooltip: true,
    className: 'hidden-sm-and-down'
  },
  {
    key: 'address',
    label: '所在地区',
    minWidth: 100,
    visibleByDefault: true,
    roles: ['admin', 'user', 'guest'],
    showOverflowTooltip: true,
    className: 'hidden-sm-only'
  },
  {
    key: 'phone',
    label: '联系电话',
    minWidth: 110,
    visibleByDefault: true,
    roles: ['admin', 'user'],
    showOverflowTooltip: true,
    className: 'hidden-md-only'
  },
  {
    key: 'email',
    label: '邮箱',
    minWidth: 150,
    visibleByDefault: true,
    roles: ['admin'],
    showOverflowTooltip: true,
    className: 'hidden-lg-only'
  },
  {
    key: 'employment_status',
    label: '就业状态',
    width: 90,
    visibleByDefault: true,
    roles: ['admin', 'user', 'guest'],
    className: 'hidden-xs-only'
  },
  {
    key: 'political_status',
    label: '政治面貌',
    width: 100,
    visibleByDefault: false,
    roles: ['admin']
  },
  {
    key: 'created_at',
    label: '创建时间',
    width: 160,
    sortable: true,
    visibleByDefault: true,
    roles: ['admin'],
    className: 'hidden-md-and-down'
  }
]

export type RoleType = 'admin' | 'user' | 'guest'

export function getColumnsForRole(role: RoleType): ColumnConfig[] {
  return ALL_COLUMNS.filter(col => col.roles.includes(role))
}

export function getDefaultVisibleKeys(role: RoleType): string[] {
  return getColumnsForRole(role)
    .filter(col => col.visibleByDefault)
    .map(col => col.key)
}

const STORAGE_PREFIX = 'table-columns-'

export function loadVisibleKeys(role: RoleType): string[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + role)
    if (stored) {
      return JSON.parse(stored) as string[]
    }
  } catch {
    // ignore parse errors
  }
  return null
}

export function saveVisibleKeys(role: RoleType, keys: string[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + role, JSON.stringify(keys))
  } catch {
    // ignore storage errors
  }
}

const DENSITY_STORAGE_KEY = 'table-density'

export type TableDensity = 'compact' | 'default' | 'comfortable'

export function loadDensity(): TableDensity {
  try {
    const stored = localStorage.getItem(DENSITY_STORAGE_KEY)
    if (stored === 'compact' || stored === 'default' || stored === 'comfortable') {
      return stored
    }
  } catch {
    // ignore
  }
  return 'default'
}

export function saveDensity(density: TableDensity): void {
  try {
    localStorage.setItem(DENSITY_STORAGE_KEY, density)
  } catch {
    // ignore
  }
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

export default ALL_COLUMNS
