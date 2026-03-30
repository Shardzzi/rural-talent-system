# FRONTEND KNOWLEDGE BASE

**Scope:** Vue 3 SPA  
**Tech:** Vue 3 + TypeScript + Element Plus + Vite  
**Port:** 8081

## STRUCTURE

```
frontend/src/
├── main.ts                # Entry point - app bootstrap
├── App.vue                # Root component
├── router/index.ts        # Vue Router configuration
├── views/                 # Page-level components
│   ├── AdminDashboard.vue # Admin UI (878 lines)
│   ├── UserDashboard.vue  # User UI (783 lines)
│   └── GuestView.vue      # Read-only UI (860 lines)
├── components/            # Reusable components
│   ├── PersonFormDialog.vue    # Edit form (1024 lines)
│   ├── PersonDetailDialog.vue  # Detail view (762 lines)
│   └── LoginForm.vue      # Auth form
├── stores/                # Pinia state management
│   └── auth.ts            # Auth store
├── api/                   # HTTP clients
│   └── persons.ts         # Backend API wrapper
└── vue-shims.d.ts         # Type declarations
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new page | `views/` → `router/index.ts` |
| Add reusable UI | `components/` |
| Call backend API | `api/persons.ts` |
| Manage auth state | `stores/auth.ts` |
| Add route | `router/index.ts` |
| Register Element Plus | `main.ts` (on-demand imports) |

## CONVENTIONS

- **UI library:** Element Plus (on-demand imports in `main.ts`)
- **State:** Pinia for auth/user data
- **HTTP:** Axios with interceptors (see `main.ts` lines 50-95)
- **Language:** All UI text in Chinese
- **Responsive:** PC-only (not mobile)

## ANTI-PATTERNS

- **NEVER:** Direct `axios` calls in components (use `api/`)
- **NEVER:** Guest view can read but NEVER modify data
- **ALWAYS:** Use Element Plus components (no custom CSS frameworks)
- **ALWAYS:** Handle ResizeObserver errors via global handlers (see `main.ts`)

## NOTES

- **Bundle optimization:** v2.2.1 reduced from 1.17MB → 22.7KB via code splitting
- **Element Plus:** All components manually imported in `main.ts` (lines 3-33)
- **Auth flow:** Token stored in localStorage, auto-attached by axios interceptor
- **Data masking:** Guest view shows masked data (e.g., 张三 → 张*)
