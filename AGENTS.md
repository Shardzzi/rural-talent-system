# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-24  
**Project:** 数字乡村人才信息系统 (Rural Talent System)  
**Version:** v4.0  
**Commit:** 23da2b8

## OVERVIEW

Full-stack talent management system for rural development. TypeScript monorepo (pnpm workspaces) with Vue 3 frontend (Port 8081) and Express backend (Port 8085, configurable via `PORT` env var). JWT auth with 3 roles (admin/user/guest), dual SQLite/MySQL database support. Three packages: `backend`, `frontend`, `test`.

## STRUCTURE

```
rural-talent-system/
├── backend/src/         # Express API (22 TS files)
│   ├── controllers/     # 6 controller files
│   ├── services/        # 3 service files (SQLite, MySQL, factory)
│   ├── middleware/      # auth, validation, errorHandler, auditLogger
│   ├── routes/          # 6 route files (auth, person, batch, favorite, notification, audit)
│   ├── types/           # Barrel export of all TS interfaces
│   └── config/          # Winston logger
├── frontend/src/        # Vue 3 SPA (37+ source files)
│   ├── views/           # 6 page-level views
│   ├── components/      # 30+ components in 10 subdirs
│   ├── stores/          # Pinia auth store
│   ├── api/             # Axios service + interceptors (PersonService class)
│   ├── router/          # 13 routes, lazy-loaded
│   ├── composables/     # 6 composables (3 used, 3 unused)
│   ├── utils/           # 3 utility files
│   └── styles/          # 4 CSS files (tokens, animations, high-contrast)
├── test/                # Custom Node.js test suite (10 scripts, ~5185 lines)
├── docs/                # Comprehensive documentation
├── .github/workflows/   # CI pipeline (lint+typecheck → build → docker-build)
├── docker/              # Docker Compose configs (dev, dev-full, prod)
└── nginx/               # Production Nginx proxy config
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `backend/src/routes/` → `controllers/` → `services/` | Follow MVC pattern |
| Add/change DB field | `backend/src/types/index.ts` first, then `services/databaseService.ts` | Update interfaces FIRST |
| Change auth logic | `backend/src/middleware/auth.ts` | JWT validation + role checks |
| Add validation rules | `backend/src/middleware/validation.ts` | express-validator chains |
| Add UI component | `frontend/src/components/` | Element Plus, PascalCase file names |
| Add page/view | `frontend/src/views/` → `router/index.ts` | Lazy-loaded, add route meta |
| Update auth state | `frontend/src/stores/auth.ts` | Pinia store |
| API client call | `frontend/src/api/persons.ts` | PersonService singleton |
| Fix error responses | `backend/src/middleware/errorHandler.ts` | Centralized handler |
| Add rate limiting | `backend/src/app.ts` | Login: 5/15min, Register: 3/hr per IP |
| Add batch/import | `backend/src/controllers/batchController.ts` | POST upload/preview/confirm + template |
| Add statistics | `backend/src/controllers/personController.ts` | GET /api/statistics (logged-in users) |
| Add search filters | `backend/src/services/databaseService.ts` | searchTalents with multi-filters |
| Write tests | `test/` | Pure Node.js scripts, axios only |

## API ENDPOINT MAP

| Route File | Auth | Mount | Endpoints |
|-----------|------|-------|-----------|
| `authRoutes.ts` | Mixed | `/api/auth` | POST register/login/refresh/logout, GET me, PUT change-password/link-person |
| `personRoutes.ts` | Mixed | `/api` | GET health/search/statistics/skills-library-stats/persons, CRUD persons, skills |
| `batchRoutes.ts` | Admin | `/api` | POST batch/delete + update, import upload/preview/confirm/template |
| `favoriteRoutes.ts` | Auth | `/api` | GET/POST/DELETE/PUT /favorites |
| `notificationRoutes.ts` | Auth | `/api` | GET notifications, mark read, delete |
| `auditRoutes.ts` | Admin | `/api` | GET audit-logs, GET audit-logs/stats |

## CONVENTIONS

### Backend
- **Architecture:** MVC - Routes → Controllers → Services (getDbService via factory)
- **Auth:** JWT `Authorization: Bearer <token>`, 3 roles (admin/user/guest)
- **Error handling:** Controller-level try/catch, direct `res.json` (NOT via `next(error)`)
- **Logging:** Winston via `config/logger.ts` (not console.log)
- **DB:** Dual SQLite/MySQL via `DB_TYPE=sqlite|mysql` env var
- **SQL:** All parameterized (`?` placeholders), no string concatenation
- **Data locale:** Chinese gender values (男/女/其他), skill proficiency 1-5
- **Response format:** `{ success: boolean, message: string, data?: T }`
- **File names:** camelCase for .ts, PascalCase for .vue

### Frontend
- **UI:** Element Plus (on-demand imports in `main.ts`)
- **State:** Pinia for auth/user data
- **HTTP:** Axios singleton (`PersonService`) with 401 auto-refresh interceptor
- **Router:** Lazy-loaded views, auth guards via `router.beforeEach`
- **Language:** All UI in Chinese, PC-optimized (1400px max-width)
- **Styling:** CSS variables in `styles/tokens.css`, global in `index.css`
- **Error display:** `ElMessage.error()` for user-facing errors

### Monorepo
- **Package manager:** pnpm@10.33.0 with workspaces (backend, frontend, test)
- **Registry:** npmmirror.com (China mirror) via `.npmrc`
- **Dev:** `pnpm dev` starts both services in parallel

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER:** Use `as any` or `@ts-ignore` / `@ts-expect-error` — use `unknown` + runtime checks
- **NEVER:** Skip auth middleware on protected routes
- **NEVER:** Modify data on Guest view (read-only)
- **NEVER:** Disable rate limiting on auth endpoints
- **NEVER:** Direct `axios` calls in components — use `api/persons.ts`
- **NEVER:** Direct DB queries in controllers — use services
- **ALWAYS:** Update `types/index.ts` when changing DB schema
- **ALWAYS:** Use `sanitizeString` for user-provided string inputs
- **ALWAYS:** Use Winston logger (`config/logger.ts`) instead of `console.log`
- **ALWAYS:** Parameterize SQL (never string-interpolate user input)

## UNIQUE STYLES

### Large File Pattern
Key files large by design:
- `databaseService.ts` (~3253 lines) — All SQLite operations in one service
- `mysqlService.ts` (~1442 lines) — All MySQL operations in one service
- `personController.ts` (~1213 lines) — Person CRUD + stats + export
- `PersonFormDialog.vue` (~1024 lines) — Complex multi-tab form
- `AdminDashboard.vue` (~878 lines) — Feature-rich admin interface

### SQLite Callback Compatibility Layer
`databaseService.ts` wraps synchronous `better-sqlite3` API in callback-style `run/get/all` methods. All 47 exported functions use the same `createDatabaseCompat()` wrapper pattern.

### Custom Test Suite (no Jest/Mocha)
10 pure Node.js test scripts in `test/` with custom `assert()` functions, ANSI colored output, and a bash runner (`run-tests.sh`). Covers 22 API endpoints with happy-path + error matrices.

### Chinese-First UI
All UI text in Chinese, Element Plus with Chinese locale, data masking for sensitive personal info.

## KNOWN ISSUES

- `auth.ts` hardcodes `databaseService` for session validation (bypasses MySQL when DB_TYPE=mysql) — middleware/auth.ts lines 66, 140
- Frontend `api/persons.ts` `verifyToken()` calls non-existent endpoint `/api/auth/verify`
- Duplicate axios interceptors in `main.ts` and `api/persons.ts` with overlapping token refresh logic
- 164 `: any` type annotations across backend services (primarily in database callback signatures)
- Backend tsconfig has `strict: true` but `strictNullChecks: false`, `noImplicitAny: false`
- 3 composables (`useCountUp.ts`, `useInfiniteScroll.ts`, `useKeyboardShortcuts.ts`) not imported anywhere

## COMMANDS

```bash
pnpm dev                  # Start both frontend (8081) + backend (8085, set PORT env to override)
pnpm build                # Build all packages
pnpm start                # Start production services
pnpm test                 # Run full test suite
pnpm lint                 # ESLint all packages
pnpm type-check           # TypeScript checking
pnpm security:check       # Audit dependencies
./docker-quick-start.sh   # Quick Docker setup
./deploy.sh dev|prod      # Docker environment
```

## NOTES

- **Database:** SQLite at `backend/data/persons.db` (default), MySQL via `DB_TYPE=mysql`
- **Test accounts:** `admin`/`admin123` (full), `testuser`/`test123` (limited)
- **Auth Tokens:** 24h access token + 7d refresh token (`POST /api/auth/refresh`)
- **Rate limiting:** Per-IP in-memory: login 5/15min, register 3/hr
- **Browser:** main.ts handles ResizeObserver errors for Element Plus compatibility
- **Bundle:** v2.2.1 reduced from 1.17MB → 22.7KB via code splitting
- **Ports:** Frontend 8081, Backend 8085 (configurable via `PORT` env var)
- **Node requirement:** >=16.0.0 (pnpm@10.33.0)
