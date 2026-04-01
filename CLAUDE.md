# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack rural talent management system (数字乡村人才信息系统) built with TypeScript throughout. It's a production-ready monorepo using pnpm workspaces with Vue 3 frontend and Express.js backend.

## Development Commands

### Quick Start
```bash
# Install all dependencies
pnpm install

# Development mode (recommended for development)
pnpm dev

# Production mode
pnpm start

# Docker deployment
./docker-quick-start.sh
./deploy.sh dev    # Development with MySQL
./deploy.sh prod   # Production deployment
```

### Package Management (pnpm workspace)
```bash
# Development (start both frontend and backend)
pnpm dev

# Build all packages
pnpm build

# Start production services
pnpm start

# Run tests
pnpm test

# Lint all packages
pnpm lint

# Type checking
pnpm type-check

# Individual service commands
pnpm backend:dev          # Backend development with hot reload
pnpm frontend:dev         # Frontend development server
pnpm backend:build        # Build backend for production
pnpm frontend:build       # Build frontend for production
pnpm backend:start        # Start built backend
pnpm frontend:start       # Start built frontend
```

### Dependency Management
```bash
pnpm deps:check           # Check for outdated dependencies
pnpm deps:update          # Update all dependencies
pnpm security:check       # Run security audit
```

## Architecture

### Technology Stack
- **Frontend**: Vue 3 + TypeScript + Element Plus + Vite (Port 8081)
- **Backend**: Node.js + Express + TypeScript + SQLite (Port 8083)
- **Authentication**: JWT with bcrypt password hashing
- **Rate limiting**: In-memory per-IP limiter
- **Input validation**: express-validator with custom sanitizers
- **XSS protection**: HTML tag stripping
- **Package Manager**: pnpm workspace
- **Database**: SQLite with 7 main tables

### Key Directories
- `backend/src/` - Express.js application with controllers, services, middleware, and routes
- `frontend/src/` - Vue 3 application with components, views, stores (Pinia), and API services
- `test/` - Custom test suite for health checks, integration, and permission testing
- `docs/` - Comprehensive documentation

### Database Schema
SQLite database with tables for users, persons, rural_talent_profile, talent_skills, cooperation_intentions, training_records, and user_sessions.

### Authentication & Permissions
- JWT token-based authentication
- Three-tier role system: admin/user/guest
- Data masking for unauthenticated users
- Users can only edit their own bound person information

### Token Refresh (T9)
- POST /api/auth/refresh endpoint
- Access token: 24h expiry
- Refresh token: 7d expiry
- Frontend axios interceptor auto-refreshes on 401

### Rate Limiting (T2)
- Login: 5 attempts per 15 minutes per IP
- Register: 3 attempts per hour per IP
- Headers: X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After

### JWT Format Validation (T3)
- Bearer prefix enforced
- 3-part JWT structure validated
- Failed attempts logged with IP

### XSS Protection (T1)
- sanitizeString middleware strips HTML tags
- All user inputs sanitized before validation

## Development Workflow

### Access Points
- **Frontend Application**: http://localhost:8081
- **Backend API**: http://localhost:8083
- **API Test Endpoint**: http://localhost:8083/api/persons

### Test Accounts
- **Admin**: admin/admin123 (full access)
- **User**: testuser/test123 (can view all, edit only own data)

### Logging
- Backend logs: `logs/backend.log`
- Frontend logs: `logs/frontend.log`
- Logs directory is automatically created and managed by the application

## Code Patterns

### Backend Structure
- **Controllers**: Handle HTTP requests and responses
- **Services**: Database operations and business logic
- **Middleware**: Authentication, validation, error handling
- **Routes**: API endpoint definitions
- **Types**: TypeScript interfaces and type definitions

### Frontend Structure
- **Components**: Reusable Vue components (Element Plus based)
- **Views**: Page-level components
- **Stores**: Pinia state management
- **API**: Axios-based service layer for backend communication

### Performance Features (v2.2.1)
- Main bundle reduced by 98% (22.7KB)
- Element Plus on-demand imports
- Code splitting with manual chunks
- PC-optimized responsive design
- Chinese localization

## Testing

The project includes a comprehensive test suite:
```bash
# Run all tests
pnpm test

# All test files (8 total)
node test/simple-verification.js        # Health checks
node test/test_system_integration.js    # Integration tests
node test/test_dual_user_features.js    # Permission tests
node test/test_all_endpoints.js         # All 22 endpoints
node test/test_error_handling.js        # Error responses
node test/test_edge_cases.js            # Security/edge cases
node test/test_auth_permissions.js      # Auth & permissions
node test/test_search_pagination.js     # Search & pagination
```

## Important Notes

- Never disable rate limiting in production
- Always use parameterized SQL queries
- Always sanitize user inputs with sanitizeString
- Use TypeScript throughout - strict type checking is enabled
- Follow the existing authentication and permission patterns
- Database is SQLite - located at `backend/data/persons.db`
- Frontend is PC-optimized (not mobile-responsive)
- All UI is in Chinese with Element Plus components
- The system includes data masking for sensitive information
- Use the existing API service layer for frontend-backend communication
- Backend uses Express middleware for auth, validation, and error handling

## Performance Optimizations

The project has undergone significant performance optimization in v2.2.1:
- Bundle size reduction through code splitting
- Element Plus on-demand component imports
- Lazy loading for better initial load times
- Optimized Vite build configuration
- Manual chunk splitting for vendor libraries