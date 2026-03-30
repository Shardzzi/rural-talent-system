# BACKEND KNOWLEDGE BASE

**Scope:** Express.js API server  
**Tech:** Node.js + Express + TypeScript  
**Port:** 8083

## STRUCTURE

```
backend/src/
├── app.ts                 # Entry point - Express server bootstrap
├── controllers/           # HTTP request handlers
│   ├── authController.ts  # Login/register/logout
│   └── personController.ts # Person CRUD (791 lines)
├── services/              # Business logic + DB operations
│   ├── databaseService.ts # SQLite ops (2253 lines)
│   ├── mysqlService.ts    # MySQL ops (641 lines)
│   └── dbServiceFactory.ts # DB type switching
├── middleware/            # Request processing chain
│   ├── auth.ts            # JWT verification
│   ├── validation.ts      # Input validation
│   └── errorHandler.ts    # Global error handling
├── routes/                # Route definitions
│   ├── authRoutes.ts      # /api/auth/*
│   └── personRoutes.ts    # /api/*
├── types/index.ts         # TypeScript interfaces
└── config/logger.ts       # Winston logging setup
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add API endpoint | `routes/` → `controllers/` |
| Change auth logic | `middleware/auth.ts` |
| Add DB table/column | `types/index.ts` → `services/*` |
| Fix error responses | `middleware/errorHandler.ts` |
| Add validation rules | `middleware/validation.ts` |

## CONVENTIONS

- **Pattern:** MVC - Routes → Controllers → Services
- **Auth:** JWT in `Authorization: Bearer <token>` header
- **Roles:** admin/user/guest (3-tier permission system)
- **DB:** Dual SQLite/MySQL via env `DB_TYPE`
- **Error format:** `{ success: false, message: string }`

## ANTI-PATTERNS

- **NEVER:** Bypass `auth` middleware on protected routes
- **NEVER:** Direct DB queries in controllers (use services)
- **ALWAYS:** Update `types/index.ts` when changing schema
- **ALWAYS:** Use `logger` (Winston) instead of `console.log`
