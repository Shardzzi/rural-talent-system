# PROJECT KNOWLEDGE BASE

**Generated:** 2025-03-30  
**Project:** 数字乡村人才信息系统 (Rural Talent System)  
**Version:** v2.2.1

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
├── frontend/src/        # Vue 3 SPA (11 Vue + 6 TS)
│   ├── views/           # Page-level components
│   ├── components/      # Reusable UI components
│   ├── stores/          # Pinia state management
│   ├── api/             # Axios service layer
│   └── router/          # Vue Router config
├── test/                # Custom Node.js test suite
└── docs/                # Comprehensive documentation
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `backend/src/routes/` + `controllers/` | Follow existing CRUD patterns |
| Add database field | `backend/src/types/index.ts` + `services/databaseService.ts` | Update interfaces first |
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
| `personController` | Controller | `controllers/personController.ts` | CRUD ops (791 lines) |
| `databaseService` | Service | `services/databaseService.ts` | SQLite ops (2253 lines) |
| `mysqlService` | Service | `services/mysqlService.ts` | MySQL ops (641 lines) |
| `auth` | Middleware | `middleware/auth.ts` | JWT verification |
| `validation` | Middleware | `middleware/validation.ts` | Input validation |

### Frontend Entry Points
| Symbol | Type | Location | Purpose |
|--------|------|----------|---------|
| `createApp` | Vue | `frontend/src/main.ts` | App bootstrap, Element Plus setup |
| `router` | Router | `router/index.ts` | Route definitions |
| `useAuthStore` | Pinia | `stores/auth.ts` | Auth state management |
| `personsApi` | API | `api/persons.ts` | Backend API client |
| `AdminDashboard` | View | `views/AdminDashboard.vue` | Admin UI (878 lines) |
| `UserDashboard` | View | `views/UserDashboard.vue` | User UI (783 lines) |
| `GuestView` | View | `views/GuestView.vue` | Read-only UI (860 lines) |
| `PersonFormDialog` | Component | `components/PersonFormDialog.vue` | Edit form (1024 lines) |

## CONVENTIONS

### Backend
- **Architecture:** MVC pattern - Controllers → Services → Database
- **Auth:** JWT in Authorization header, three roles (admin/user/guest)
- **Error handling:** Centralized in `middleware/errorHandler.ts`
- **Logging:** Winston logger via `config/logger.ts`
- **DB choice:** Environment-driven (DB_TYPE=sqlite|mysql)

### Frontend
- **UI:** Element Plus with on-demand imports (main.ts lists all components)
- **State:** Pinia stores for auth/user state
- **HTTP:** Axios with request/response interceptors for logging
- **Error handling:** Global handlers in main.ts for ResizeObserver/Element Plus quirks
- **Responsive:** PC-optimized only (not mobile)

### Monorepo
- **Package manager:** pnpm with workspaces (backend, frontend, test)
- **Scripts:** Root package.json unifies dev/build/test commands
- **Dev:** `pnpm dev` starts both frontend (8081) and backend (8083)

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER:** Use `any` type suppression - strict TypeScript enforced
- **NEVER:** Skip auth middleware on protected routes
- **NEVER:** Modify data on Guest view (read-only)
- **ALWAYS:** Update TypeScript interfaces when changing DB schema
- **ALWAYS:** Use API service layer - no direct axios calls in components

## UNIQUE STYLES

### Large File Pattern
Several key files exceed 500+ lines by design:
- `databaseService.ts` (2253 lines) - All SQLite operations in one service
- `PersonFormDialog.vue` (1024 lines) - Complex multi-tab form component
- `AdminDashboard.vue` (878 lines) - Feature-rich admin interface

### Chinese-First UI
- All UI text in Chinese
- Element Plus with Chinese locale
- Data masking for sensitive Chinese personal info

### Custom Test Suite
No Jest/Mocha - pure Node.js test scripts in `test/`:
- `simple-verification.js` - Health checks
- `test_system_integration.js` - Full flow tests
- `test_dual_user_features.js` - Permission tests

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
- **Logs:** `logs/backend.log` and `logs/frontend.log`
- **Performance:** v2.2.1 reduced bundle by 98% (1.17MB → 22.7KB) via code splitting
- **Browser quirks:** main.ts contains ResizeObserver error suppression for Element Plus compatibility
