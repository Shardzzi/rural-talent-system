# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-30  
**Project:** 数字乡村人才信息系统 (Rural Talent System)  
**Version:** v3.1

## OVERVIEW

Full-stack talent management system for rural development. TypeScript monorepo with Vue 3 frontend (Port 8081) and Express backend (Port 8083). Features JWT auth, role-based permissions (admin/user/guest), and SQLite/MySQL support.

## STRUCTURE

```
rural-talent-system/
├── backend/src/         # Express API (13 TS files)
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Database & business logic
│   ├── middleware/      # Auth, validation, errors
│   ├── routes/          # API endpoint definitions
│   └── types/           # TypeScript interfaces
├── frontend/src/        # Vue 3 SPA (7 Vue + 5 TS + 1 d.ts)
│   ├── views/           # Page-level components
│   ├── components/      # Reusable UI components
│   ├── stores/          # Pinia state management
│   ├── api/             # Axios service layer
│   └── router/          # Vue Router config
├── test/                # Custom Node.js test suite (8 test files, 22 endpoints)
└── docs/                # Comprehensive documentation
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `backend/src/routes/` + `controllers/` | Follow existing CRUD patterns |
| Add database field | `backend/src/types/index.ts` + `services/databaseService.ts` | Update interfaces first |
| Add rate limiting | `backend/src/app.ts` | Login: 5/15min, Register: 3/hr per IP |
| Add token refresh | `backend/src/controllers/authController.ts` | POST /api/auth/refresh, 7d refresh token |
| Add CSV export | `backend/src/controllers/personController.ts` | GET /api/persons/export with filters |
| Add statistics | `backend/src/controllers/personController.ts` | GET /api/statistics real DB data |
| Add search filters | `backend/src/services/databaseService.ts` | searchTalents with age/gender/education/skill/crop filters |
| Add UI component | `frontend/src/components/` | Element Plus based |
| Add page/view | `frontend/src/views/` | Three views: Admin/User/Guest |
| Update auth logic | `backend/src/middleware/auth.ts` | JWT validation |
| Update state | `frontend/src/stores/auth.ts` | Pinia store |
| API client | `frontend/src/api/persons.ts` | Axios wrapper |

## CODE MAP

### Backend Entry Points
| Symbol | Type | Location | Purpose |
|--------|------|----------|---------|
| `app` | Express | `backend/src/app.ts` | Server bootstrap, middleware chain |
| `authController` | Controller | `controllers/authController.ts` | Login/register/logout |
| `refresh` | Controller | `controllers/authController.ts` | Token refresh endpoint (7d expiry) |
| `personController` | Controller | `controllers/personController.ts` | CRUD ops |
| `getStatistics` | Controller | `controllers/personController.ts` | Real statistics from DB |
| `exportPersons` | Controller | `controllers/personController.ts` | CSV export with filters |
| `databaseService` | Service | `services/databaseService.ts` | SQLite ops |
| `searchTalents` | Service | `services/databaseService.ts` | Advanced search with multi-filters |
| `mysqlService` | Service | `services/mysqlService.ts` | MySQL ops |
| `dbServiceFactory` | Service | `services/dbServiceFactory.ts` | DB service factory (sqlite/mysql) |
| `auth` | Middleware | `middleware/auth.ts` | JWT verification |
| `validation` | Middleware | `middleware/validation.ts` | Input validation |
| `validateComprehensivePerson` | Middleware | `middleware/validation.ts` | Full person validation |
| `errorHandler` | Middleware | `middleware/errorHandler.ts` | Centralized error handling |
| `logger` | Config | `config/logger.ts` | Winston logger |

### Frontend Entry Points
| Symbol | Type | Location | Purpose |
|--------|------|----------|---------|
| `createApp` | Vue | `frontend/src/main.ts` | App bootstrap, Element Plus setup |
| `router` | Router | `router/index.ts` | Route definitions |
| `useAuthStore` | Pinia | `stores/auth.ts` | Auth state management |
| `personsApi` | API | `api/persons.ts` | Backend API client |
| `AdminDashboard` | View | `views/AdminDashboard.vue` | Admin UI |
| `UserDashboard` | View | `views/UserDashboard.vue` | User UI |
| `GuestView` | View | `views/GuestView.vue` | Read-only UI |
| `PersonFormDialog` | Component | `components/PersonFormDialog.vue` | Edit form |
| `PersonDetailDialog` | Component | `components/PersonDetailDialog.vue` | Detail view dialog |
| `LoginForm` | Component | `components/LoginForm.vue` | Login/register form |
| `DebugPanel` | Component | `components/DebugPanel.vue` | Dev debug panel (dev-only) |
| `AuthDebugPanel` | Component | `components/AuthDebugPanel.vue` | Guest auth debug panel |

## CONVENTIONS

### Backend
- **Architecture:** MVC pattern - Controllers → Services → Database
- **Auth:** JWT in Authorization header, three roles (admin/user/guest)
- **Error handling:** Centralized in `middleware/errorHandler.ts`
- **Logging:** Winston logger via `config/logger.ts`
- **DB choice:** Environment-driven (DB_TYPE=sqlite|mysql)
- **Data locale:** Gender values in Chinese (男/女/其他), skill proficiency as integer (1-5)

### Frontend
- **UI:** Element Plus with on-demand imports (main.ts lists all components)
- **State:** Pinia stores for auth/user state
- **HTTP:** Axios with request/response interceptors for logging
- **Error handling:** Global handlers in main.ts for ResizeObserver/Element Plus quirks
- **Responsive:** PC-optimized, responsive search grids via Element Plus breakpoints
- **Layout:** max-width 1400px centered on PC, form inputs max-width 280px

### Monorepo
- **Package manager:** pnpm with workspaces (backend, frontend, test)
- **Scripts:** Root package.json unifies dev/build/test commands
- **Dev:** `pnpm dev` starts both frontend (8081) and backend (8083)

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER:** Use `any` type suppression - strict TypeScript enforced
- **NEVER:** Skip auth middleware on protected routes
- **NEVER:** Modify data on Guest view (read-only)
- **NEVER:** Disable rate limiting on auth endpoints
- **NEVER:** Use `as any` type assertions (use `unknown` with runtime checks)
- **ALWAYS:** Update TypeScript interfaces when changing DB schema
- **ALWAYS:** Use API service layer - no direct axios calls in components
- **ALWAYS:** Use `sanitizeString` for user-provided string inputs
- **ALWAYS:** Parameterize SQL queries (never interpolate user input)

## UNIQUE STYLES

### Large File Pattern
Several key files are large by design:
- `databaseService.ts` - All SQLite operations in one service
- `mysqlService.ts` - All MySQL operations in one service
- `PersonFormDialog.vue` - Complex multi-tab form component
- `AdminDashboard.vue` - Feature-rich admin interface
- `GuestView.vue` - Feature-rich guest browsing interface

### Chinese-First UI
- All UI text in Chinese
- Element Plus with Chinese locale
- Data masking for sensitive Chinese personal info

### Custom Test Suite
No Jest/Mocha - pure Node.js test scripts in `test/`:
- `simple-verification.js` - Health checks
- `test_system_integration.js` - Full flow tests
- `test_dual_user_features.js` - Permission tests
- `test_all_endpoints.js` - API coverage
- `test_error_handling.js` - Error resilience
- `test_edge_cases.js` - Boundary conditions
- `test_auth_permissions.js` - Security validation
- `test_search_pagination.js` - Data retrieval tests

## COMMANDS

```bash
# Development
pnpm dev                  # Start both frontend (8081) + backend (8083)
pnpm backend:dev          # Backend only with hot reload
pnpm frontend:dev         # Frontend only

# Production
pnpm build                # Build all packages
pnpm start                # Start production services

# Testing
pnpm test                 # Run full test suite
./test/run-tests.sh all   # Alternative test runner
node test/simple-verification.js
node test/test_system_integration.js
node test/test_dual_user_features.js
node test/test_all_endpoints.js
node test/test_error_handling.js
node test/test_edge_cases.js
node test/test_auth_permissions.js
node test/test_search_pagination.js

# Docker
./deploy.sh dev           # Docker dev environment
./deploy.sh prod          # Docker production
./docker-quick-start.sh   # Quick Docker setup

# Utilities
pnpm lint                 # ESLint all packages
pnpm type-check           # TypeScript checking
pnpm security:check       # Audit dependencies
```

## NOTES

- **Database:** SQLite default at `backend/data/persons.db`, MySQL optional via env
- **Test accounts:** admin/admin123 (full), testuser/test123 (limited)
- **Logs:** `backend/logs/combined.log` and `backend/logs/error.log`
- **Performance:** v2.2.1 reduced bundle by 98% via code splitting; v3.1 added UI overhaul
- **Browser quirks:** main.ts contains ResizeObserver error suppression for Element Plus compatibility
- **Rate limiting:** Per-IP with configurable windows
- **Security:** JWT format validation (3-part structure), XSS sanitization via `sanitizeString`
- **Auth Tokens:** 24h access token + 7d refresh token
