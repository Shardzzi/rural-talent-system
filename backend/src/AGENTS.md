# BACKEND KNOWLEDGE BASE

**Scope:** Express.js API server  
**Tech:** Node.js + Express + TypeScript + better-sqlite3/mysql2  
**Port:** 8085 (configurable via `PORT` env var)

## STRUCTURE

```
backend/src/
├── app.ts                  # Entry - Express bootstrap, rate limiters, route mounting
├── controllers/            # HTTP request handlers (6 files)
│   ├── authController.ts   # Login/register/refresh/logout/me/change-password/link-person
│   ├── personController.ts # Person CRUD + statistics + export (1213 lines)
│   ├── batchController.ts  # Batch delete/update + CSV import workflow
│   ├── favoritesController.ts # Favorites CRUD
│   ├── notificationController.ts # Notification CRUD
│   └── auditController.ts  # Audit log queries
├── services/               # Business logic + DB operations (3 files)
│   ├── databaseService.ts  # SQLite ops via better-sqlite3 (3253 lines, 47+ exported fns)
│   ├── mysqlService.ts     # MySQL parallel implementation
│   └── dbServiceFactory.ts # getDbService(req), DatabaseService interface
├── middleware/             # Request processing chain (4 files)
│   ├── auth.ts             # JWT verify (authenticateToken, optionalAuth, requireAdmin, requireUser)
│   ├── validation.ts       # express-validator chains (12 validators, 506 lines)
│   ├── errorHandler.ts     # 500/404 centralized handler
│   └── auditLogger.ts      # Request audit middleware (intercepts res.end)
├── routes/                 # Route definitions (6 files, ~30 endpoints)
│   ├── authRoutes.ts       # Mount: /api/auth — 7 endpoints (register/login/refresh/logout/me/change-password/link-person)
│   ├── personRoutes.ts     # Mount: /api — 17+ endpoints (health/search/statistics/persons CRUD/skills)
│   ├── batchRoutes.ts      # Mount: /api — 6 admin endpoints (batch delete/update, import, template)
│   ├── favoriteRoutes.ts   # Mount: /api — 4 auth endpoints (CRUD favorites)
│   ├── notificationRoutes.ts # Mount: /api — 5 auth endpoints (CRUD notifications)
│   └── auditRoutes.ts      # Mount: /api — 2 admin endpoints (audit-logs, stats)
├── types/index.ts          # Barrel: 30+ interfaces (User, Person, JWT, Search, Import, Favorites, etc.)
└── config/logger.ts        # Winston logger (file + console transports)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new controller | `controllers/` | async (req, res) => void, try/catch, direct res.json |
| Add new route file | `routes/` → register in `app.ts` | Mount via app.use(path, router) |
| Change auth logic | `middleware/auth.ts` | JWT_SECRET, authenticateToken, optionalAuth, requireAdmin |
| Add/change DB field | `types/index.ts` → `services/databaseService.ts` | Update interfaces FIRST |
| Add validation rules | `middleware/validation.ts` | express-validator chains, sanitizeString |
| Fix error responses | `middleware/errorHandler.ts` | 404 + 500 handlers |
| Add service function | `services/databaseService.ts` (and `mysqlService.ts`) | Use createDatabaseCompat() wrapper |
| Add rate limiters | `app.ts` | login: 5/15min, register: 3/hr per IP |

## CONVENTIONS

- **Pattern:** MVC - Routes → Controllers → Services (getDbService via factory)
- **Auth:** JWT `Authorization: Bearer <token>` (24h access + 7d refresh)
- **Roles:** admin (full), user (view all, edit own bound person), guest (masked read-only)
- **DB:** SQLite default, MySQL via `DB_TYPE=mysql`; factory decides at startup
- **Error format:** `{ success: boolean, message: string, data?: T }`
- **Error handling:** Controller-level try/catch → `res.status(N).json({ success: false, message })` — NOT via `next(error)`
- **Logging:** Winston (`config/logger.ts`), not console.log
- **SQL:** All parameterized (`?`), no string interpolation
- **File names:** camelCase.ts (controllers, services, routes, middleware)
- **DB data locale:** Chinese gender (男/女/其他), proficiency integer 1-5

## KNOWN ISSUES

- `auth.ts` hardcodes databaseService for session validation (bypasses MySQL when DB_TYPE=mysql) — lines 66, 140
- Backend tsconfig has `strict: true` but `strictNullChecks: false`, `noImplicitAny: false`
- 158 `: any` annotations in services (callback signatures, temp vars)
- Controller error handling leaks `err.message` to clients in notification/favorites/audit controllers
- `getDefaultDbService()` exported but unused

## ANTI-PATTERNS

- **NEVER:** Bypass `auth` middleware on protected routes
- **NEVER:** Direct DB queries in controllers (use services)
- **NEVER:** String-concatenate SQL inputs (always parameterize)
- **NEVER:** Use `as any` or `@ts-ignore` (use `unknown` + runtime checks)
- **ALWAYS:** Update `types/index.ts` when changing schema
- **ALWAYS:** Use `logger` instead of `console.log`
