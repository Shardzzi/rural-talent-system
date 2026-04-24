# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

数字乡村人才信息系统 — a full-stack rural talent management system. Monorepo via pnpm workspaces with three packages: `backend`, `frontend`, `test`. TypeScript throughout.

## Development Commands

```bash
pnpm install                # Install all dependencies
pnpm dev                    # Start both frontend + backend in parallel
pnpm build                  # Build all packages
pnpm start                  # Start production services
pnpm lint                   # Lint all packages
pnpm type-check             # TypeScript checking across all packages

# Individual services
pnpm backend:dev            # Backend only (port 8083), hot reload via nodemon
pnpm frontend:dev           # Frontend only (port 8081), Vite dev server
pnpm backend:build          # tsc compilation to backend/dist/
pnpm frontend:build         # Vite build to frontend/dist/

# Tests (requires backend running on 8083)
pnpm test                   # Run test suite via pnpm filter
cd test && ./run-tests.sh   # Run all tests with the shell runner
cd test && ./run-tests.sh endpoints   # Run specific test category
# Categories: all, health, integration, permissions, endpoints, errors, edge-cases, auth, search

# Docker
./docker-quick-start.sh
./deploy.sh dev|prod|stop|status
```

## Architecture

### Request Flow
```
Request → Express Router → Validation Middleware → Auth Middleware → Controller → Service → Database
```

### Backend (`backend/src/`)
- **Entry**: `app.ts` — Express server setup, middleware registration, route mounting
- **Routes**: `routes/` — personRoutes, authRoutes, batchRoutes (plus favorites, notifications, audit)
- **Controllers**: `controllers/` — HTTP request/response handling, delegates to services
- **Services**: `services/` — business logic and DB operations
  - `databaseService.ts` — primary, uses **better-sqlite3** (synchronous API wrapped in callbacks)
  - `mysqlService.ts` — alternative for MySQL via `DB_TYPE=mysql` env var
  - `dbServiceFactory.ts` — factory that selects DB service based on `DB_TYPE`
- **Middleware**: `middleware/` — `auth.ts` (JWT + role checks), `validation.ts` (express-validator), `errorHandler.ts`
- **Types**: `types/index.ts` — shared TypeScript interfaces (update these first when changing schema)
- **Logging**: Winston via `config/logger.ts` — use this instead of `console.log`

### Frontend (`frontend/src/`)
- **Entry**: `main.ts` — Vue 3 app init with Element Plus on-demand imports (lines 3-33 list all components)
- **Router**: `router/index.ts` — Vue Router with auth guards
- **Stores**: `stores/auth.ts` — Pinia store for auth state, JWT + auto-refresh on 401
- **API Layer**: `api/persons.ts` — Axios wrapper with request/response interceptors
- **Views**: `AdminDashboard.vue`, `UserDashboard.vue`, `GuestView.vue` — three role-based pages
- **Components**: `PersonFormDialog.vue`, `PersonDetailDialog.vue`, `LoginForm.vue`
- All UI in Chinese, PC-optimized (not mobile-responsive), layout max-width 1400px

### Database
Default: **SQLite** via better-sqlite3 at `backend/data/persons.db`. Set `DB_TYPE=mysql` to use MySQL instead.

Tables: `users`, `persons`, `rural_talent_profile`, `talent_skills`, `cooperation_intentions`, `training_records`, `user_sessions`, `favorites`, `notifications`, `audit_logs`. Foreign keys with CASCADE deletes.

Gender values stored in Chinese (男/女/其他). Skill proficiency as integer 1-5.

### Auth & Permissions
- JWT with access token (24h) + refresh token (7d), `POST /api/auth/refresh`
- Three roles: admin (full access), user (view all, edit own bound person only), guest (masked data, read-only)
- Rate limiting: login 5/15min/IP, register 3/hour/IP
- `sanitizeString` middleware strips HTML tags from all inputs
- Error responses: `{ success: false, message: string }`

## Where to Look

| Task | Location |
|------|----------|
| Add API endpoint | `backend/src/routes/` → `controllers/` → `services/` |
| Add/change DB field | `backend/src/types/index.ts` first, then `services/databaseService.ts` |
| Change auth logic | `backend/src/middleware/auth.ts` |
| Add validation rules | `backend/src/middleware/validation.ts` |
| Fix error responses | `backend/src/middleware/errorHandler.ts` |
| Add UI component | `frontend/src/components/` |
| Add page/view | `frontend/src/views/` → `router/index.ts` |
| Update auth state | `frontend/src/stores/auth.ts` |
| Add API client call | `frontend/src/api/persons.ts` |

## Conventions

- All SQL queries are parameterized — never string-concatenate user input
- All user input passes through `sanitizeString` then express-validator
- Backend uses synchronous better-sqlite3 but wraps calls in a callback compatibility layer
- Frontend proxy: Vite proxies `/api` → `http://localhost:8083` during development
- Vite build uses manual chunk splitting: `vue-vendor`, `element-plus`, `utils`, `echarts`
- Custom test suite — no Jest/Mocha, pure Node.js scripts in `test/`
- `main.ts` contains ResizeObserver error suppression for Element Plus compatibility

## Anti-Patterns

- **Never** use `any` type suppression or `as any` assertions — use `unknown` with runtime checks
- **Never** skip auth middleware on protected routes
- **Never** make direct `axios` calls in Vue components — use `api/persons.ts`
- **Never** make direct DB queries in controllers — use services
- **Never** disable rate limiting on auth endpoints
- **Never** allow Guest view to modify data (read-only)
- **Always** update `types/index.ts` when changing DB schema
- **Always** use Winston logger (`config/logger.ts`) instead of `console.log`
- **Always** use `sanitizeString` for user-provided string inputs
- **Always** use Element Plus components (no custom CSS frameworks)

## Ports

- Frontend dev server: 8081
- Backend API: 8083
- Tests hit the backend directly on 8083 (backend must be running)

## Test Accounts

- `admin` / `admin123` — full access
- `testuser` / `test123` — view all, edit own data only
