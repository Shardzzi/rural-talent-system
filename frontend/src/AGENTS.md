# FRONTEND KNOWLEDGE BASE

**Scope:** Vue 3 SPA  
**Tech:** Vue 3 (Options API) + TypeScript + Element Plus + Pinia + Vite  
**Port:** 8081

## STRUCTURE

```
frontend/src/
├── main.ts                # Entry - Vue 3 createApp, Element Plus register, axios interceptors, error handlers
├── App.vue                # Root component (layout shell with header/sidebar/main)
├── router/index.ts        # Vue Router (13 lazy-loaded routes, auth guards, breadcrumbs)
├── stores/auth.ts         # Pinia store (token, refreshToken, user, login/register/logout/refresh)
│
├── views/                 # 6 page-level components
│   ├── AdminDashboard.vue       # Admin panel (878 lines) — CRUD + batch + stats + favorites
│   ├── UserDashboard.vue        # User dashboard — view/edit bound person
│   ├── GuestView.vue            # Read-only browsing with search/filters
│   ├── StatisticsDashboard.vue  # Charts + stats (role-aware: admin sees all, user sees limited)
│   ├── NotificationCenter.vue   # Notification list
│   └── BigScreenView.vue        # Public big-screen display
│
├── components/            # 30+ reusable components in 10 subdirs
│   ├── layout/            # AppLayout, HeaderBar, SidebarNav
│   ├── common/            # EmptyState, SkeletonCard/Chart/Table, ContextualHelp, HelpCenter, AccessibilitySettings
│   ├── person-form/       # PersonFormWizard (wizard), FormStepBasic/Cooperation/Rural/Skills
│   ├── person-table/      # PersonTable, PersonCardList, tableConfig, ColumnCustomizer
│   ├── batch/             # BatchActionBar, ImportDialog
│   ├── search/            # QuickFilterTags, SavedSearches, SearchHistory
│   ├── favorites/         # FavoriteButton, FavoriteList, FavoriteNotesDialog
│   ├── notifications/     # NotificationBell, NotificationDropdown
│   ├── comparison/        # TalentComparison, ComparisonRadarChart
│   ├── charts/            # TalentRadarChart
│   ├── PersonFormDialog.vue     # Multi-tab form (1024 lines)
│   ├── PersonDetailDialog.vue   # Detail view dialog
│   └── LoginForm.vue            # Login/register form
│
├── composables/           # 6 composables (3 used, 3 unused)
│   ├── useAutoSave.ts          # USED — PersonFormWizard
│   ├── useSavedSearches.ts     # USED — AdminDashboard
│   ├── useStatePreservation.ts # USED — router + AdminDashboard
│   ├── useCountUp.ts           # UNUSED
│   ├── useInfiniteScroll.ts    # UNUSED
│   └── useKeyboardShortcuts.ts # UNUSED
│
├── api/persons.ts         # PersonService singleton class — all API calls + axios interceptors
├── utils/                 # avatar.ts, echarts.ts, onboarding.ts
├── styles/                # tokens.css (variables), index.css (global), animations.css, high-contrast.css
└── directives/focusTrap.ts     # UNUSED
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new page | `views/` → `router/index.ts` | Lazy-loaded, add route meta (requiresAuth, title, breadcrumb) |
| Add reusable UI | `components/` subdirectory | PascalCase .vue, kebab-case subdir |
| Call backend API | `api/persons.ts` | PersonService singleton instance |
| Manage auth state | `stores/auth.ts` | Pinia: defineStore('auth') |
| Add route | `router/index.ts` | Add to routes array, lazy import |
| Register Element Plus | `main.ts` | Import + push to components array |
| Add CSS styling | `styles/` | tokens.css for variables, index.css for global |
| Use auth guards | `router/index.ts` | beforeEach meta checks: requiresAuth, requiresAdmin, requiresGuest |

## CONVENTIONS

- **UI:** Element Plus (on-demand imports in `main.ts`)
- **State:** Pinia for auth/user data
- **HTTP:** Axios singleton (`PersonService`) with 401 auto-refresh interceptor
- **Router:** Lazy-loaded views, auth guards via `router.beforeEach`
- **Language:** All UI in Chinese, PC-optimized (1400px max-width)
- **Styling:** CSS variables in `styles/tokens.css`, global in `index.css`
- **Error display:** `ElMessage.error()` for user-facing errors
- **Data masking:** Guest view masks sensitive info (张三 → 张*)
- **Code splitting:** Vite manualChunks → vue-vendor, element-plus, utils, echarts

## ANTI-PATTERNS

- **NEVER:** Direct `axios` calls in components (use `api/persons.ts`)
- **NEVER:** Guest view can read but NEVER modify data (read-only)
- **NEVER:** Skip route auth guards (meta: { requiresAuth: true })
- **ALWAYS:** Use Element Plus components (no custom CSS frameworks)
- **ALWAYS:** Handle ResizeObserver errors via global handlers (see `main.ts`)
- **ALWAYS:** Lazy-load views (no synchronous imports in router)

## KNOWN ISSUES

- Duplicate axios interceptors: both `main.ts` AND `api/persons.ts` register interceptors
- `api/persons.ts` `verifyToken()` calls non-existent `/api/auth/verify` endpoint
- Options API in all .vue files (not `<script setup lang="ts">`)
- 3 unused composables: `useCountUp`, `useInfiniteScroll`, `useKeyboardShortcuts`
- 1 unused directive: `focusTrap`
- `console.log` in production axios logging interceptors (`main.ts`)
