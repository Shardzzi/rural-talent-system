# Comprehensive Development Plan: Features, Bug Fixes, Test Completion

## TL;DR

> **Quick Summary**: Complete unfinished features, fix all known bugs (especially security-critical), and achieve comprehensive test coverage for the rural talent management system.
> 
> **Deliverables**:
> - Fixed SQL injection vulnerabilities and input validation
> - Token refresh mechanism for persistent sessions
> - Completed statistics API and data export
> - Advanced search filters for GuestView
> - Full PersonFormDialog validation
> - Backend test coverage for all 22 endpoints
> - Error handling, edge case, and auth tests
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: T1(input validation) → T5(SQL fix) → T8(comprehensive ops) → T15(integration tests) → F1-F4

---

## Context

### Original Request
Complete the unfinished features of the current project, synchronously fix known bugs, and supplement test coverage. First study the existing code structure and defects, identify missing edge cases and error handling, then develop a comprehensive development plan.

### Analysis Summary

**Backend Bugs Found:**
- CRITICAL: SQL injection in dynamic queries (databaseService.ts)
- CRITICAL: Missing input validation (authController, personController)
- HIGH: Unsafe type assertions without runtime checks
- HIGH: No database transactions for multi-step operations
- HIGH: Database-specific error message checking (SQLite-only strings)
- MEDIUM: Missing personId null check in permission logic
- MEDIUM: Hardcoded token expiry (24h)
- LOW: No rate limiting on auth endpoints

**Frontend Bugs Found:**
- CRITICAL: API calls lack error handling for network failures (AdminDashboard)
- HIGH: Client-side filtering breaks pagination (AdminDashboard)
- HIGH: GuestView uses wrong field name (person.location vs person.address)
- HIGH: PersonFormDialog partial failure inconsistent state
- MEDIUM: Search timeout not cleared on unmount (memory leak)
- MEDIUM: Phone regex too restrictive (landlines rejected)
- MEDIUM: Auth store uses fetch instead of axios (inconsistent)

**Unfinished Features:**
- Statistics API (hardcoded placeholder data)
- Data export (shows "开发中..." message)
- Token refresh mechanism (users logged out unexpectedly)
- Advanced search filters (age range, skills, location)
- Bulk operations (select multiple records)

**Test Coverage Gaps:**
- Only 8 of 22 endpoints tested (63% untested)
- Zero frontend tests
- No error handling tests
- No input validation tests
- No auth edge case tests

---

## Work Objectives

### Core Objective
Fix all known bugs, complete unfinished features, and achieve comprehensive test coverage across backend and frontend.

### Concrete Deliverables
- All backend input properly validated and sanitized
- All SQL queries parameterized (zero injection vectors)
- Token refresh mechanism working end-to-end
- Statistics API returning real data
- Data export generating CSV files
- Advanced search filters functional
- Full PersonFormDialog field validation
- 22/22 backend endpoints tested
- Error handling and edge case tests

### Definition of Done
- [ ] `pnpm build` passes with zero errors
- [ ] All existing tests pass
- [ ] New tests cover all endpoints
- [ ] No SQL injection vectors remain
- [ ] No TODO/FIXME comments remain
- [ ] Token refresh works (users stay logged in)

### Must Have
- SQL injection fix on ALL dynamic queries
- Input validation on ALL endpoints
- Token refresh mechanism
- Statistics API with real data
- CSV data export
- Advanced search filters
- Test coverage for all endpoints

### Must NOT Have (Guardrails)
- Do NOT break existing API contracts
- Do NOT change database schema
- Do NOT add new npm dependencies (unless critical)
- Do NOT modify the guest read-only behavior
- Do NOT remove existing test cases
- Do NOT change the Chinese-first UI language

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (custom Node.js test suite)
- **Automated tests**: YES (tests-after, add alongside implementation)
- **Framework**: Custom Node.js scripts + axios
- **Test runner**: `test/run-tests.sh` and `pnpm test`

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — security & validation):
├── Task 1: Input validation middleware [deep]
├── Task 2: Rate limiting on auth endpoints [quick]
└── Task 3: JWT token format validation [quick]

Wave 2 (Core bug fixes — parallel):
├── Task 4: SQL injection fix [deep]
├── Task 5: Type assertion safety [unspecified-high]
├── Task 6: Auth middleware consistency [unspecified-high]
├── Task 7: Database transaction safety [deep]
└── Task 8: Frontend API error handling [unspecified-high]

Wave 3 (Feature completion — parallel):
├── Task 9: Token refresh mechanism [deep]
├── Task 10: Statistics API implementation [unspecified-high]
├── Task 11: Advanced search filters [unspecified-high]
├── Task 12: PersonFormDialog validation [visual-engineering]
└── Task 13: CSV data export [unspecified-high]

Wave 4 (Test coverage — parallel):
├── Task 14: Backend endpoint tests (all 22) [deep]
├── Task 15: Error handling & edge case tests [unspecified-high]
├── Task 16: Auth & permission tests [unspecified-high]
└── Task 17: Search & pagination tests [unspecified-high]

Wave FINAL (After ALL tasks — verification):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| T1 | — | T4, T5, T14 |
| T2 | — | T14 |
| T3 | — | T9, T16 |
| T4 | T1 | T7, T10, T14 |
| T5 | T1 | T14 |
| T6 | T1 | T14, T16 |
| T7 | T4 | T15 |
| T8 | — | T9, T12 |
| T9 | T3, T8 | T16 |
| T10 | T4 | T15 |
| T11 | T4 | T17 |
| T12 | T8 | T15 |
| T13 | T4 | T17 |
| T14 | T1-T7 | F1-F4 |
| T15 | T7, T10, T12 | F1-F4 |
| T16 | T6, T9 | F1-F4 |
| T17 | T11, T13 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1→`deep`, T2→`quick`, T3→`quick`
- **Wave 2**: 5 tasks — T4→`deep`, T5→`unspecified-high`, T6→`unspecified-high`, T7→`deep`, T8→`unspecified-high`
- **Wave 3**: 5 tasks — T9→`deep`, T10→`unspecified-high`, T11→`unspecified-high`, T12→`visual-engineering`, T13→`unspecified-high`
- **Wave 4**: 4 tasks — T14→`deep`, T15→`unspecified-high`, T16→`unspecified-high`, T17→`unspecified-high`
- **FINAL**: 4 tasks — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

- [x] 1. Comprehensive Input Validation Middleware

  **What to do**:
  - Extend `backend/src/middleware/validation.ts` with validators for ALL endpoints:
    - `validatePerson` (already exists — add missing fields: gender, address, education_level)
    - `validateCreatePerson` — for POST /persons/comprehensive (all fields including rural profile, skills)
    - `validateUpdatePerson` — for PUT /persons/:id (allow partial updates)
    - `validateSearch` — for GET /search (name, age_min/max, gender, skill, crop)
    - `validateRegister` — for POST /auth/register (username min 3 chars, password min 6 chars, email)
    - `validateChangePassword` — for PUT /auth/change-password (oldPassword, newPassword min 6)
    - `validateLinkPerson` — for PUT /auth/link-person (personId must be positive integer)
    - `validateRuralProfile` — for POST/PUT /persons/:id/rural-profile
    - `validateSkill` — for POST /persons/:id/skills
  - Fix existing `validatePerson` to make email and phone OPTIONAL (currently `.notEmpty()` implicitly required)
  - Add `optional()` modifier to email/phone in validatePerson since they are optional fields
  - Add XSS sanitization: trim all string inputs, strip HTML tags

  **Must NOT do**:
  - Do NOT change database schema
  - Do NOT break existing API contracts (keep backward-compatible validation)
  - Do NOT add npm dependencies

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: T4, T5, T14
  - **Blocked By**: None

  **References**:
  - `backend/src/middleware/validation.ts` — Current validation middleware (only validatePerson exists)
  - `backend/src/types/index.ts:141-160` — PersonCreateRequest interface defines required fields
  - `backend/src/controllers/authController.ts:44-87` — registerValidation shows existing registration validation pattern
  - `backend/src/controllers/personController.ts:176` — parseInt(age) without validation
  - `backend/src/middleware/validation.ts:19-21` — Phone regex hardcoded to Chinese mobile only
  - `backend/src/routes/personRoutes.ts` — All route definitions showing which need validators

  **Acceptance Criteria**:
  - [ ] `pnpm build` passes with zero errors
  - [ ] All existing tests still pass

  **QA Scenarios**:
  ```
  Scenario: Validation rejects invalid person creation
    Tool: Bash (curl)
    Preconditions: Server running on port 8083, valid auth token
    Steps:
      1. POST /api/persons with body {"name": "A", "age": 999, "email": "bad"}
      2. Assert response status 400
      3. Assert response body contains validation error for name (too short), age (too high), email (invalid)
    Expected Result: 400 with specific field-level validation errors
    Failure Indicators: 200 OK or 500 error
    Evidence: .sisyphus/evidence/task-1-validation-reject.txt

  Scenario: Validation accepts valid person creation
    Tool: Bash (curl)
    Preconditions: Server running, valid admin token
    Steps:
      1. POST /api/persons with body {"name": "测试用户", "age": 30, "gender": "male", "phone": "13800138000"}
      2. Assert response status 200 or 201
    Expected Result: Successful creation with valid data
    Failure Indicators: 400 validation error for valid data
    Evidence: .sisyphus/evidence/task-1-validation-accept.txt

  Scenario: Optional fields truly optional
    Tool: Bash (curl)
    Preconditions: Server running, valid admin token
    Steps:
      1. POST /api/persons with body {"name": "测试", "age": 25, "gender": "male"} (no email, phone, address)
      2. Assert response status 200 or 201
    Expected Result: Person created without optional fields
    Failure Indicators: 400 validation error for missing optional fields
    Evidence: .sisyphus/evidence/task-1-optional-fields.txt
  ```

  **Commit**: YES
  - Message: `fix(validation): comprehensive input validation middleware`
  - Files: `backend/src/middleware/validation.ts`
  - Pre-commit: `pnpm --filter rural-talent-system-backend build`

- [x] 2. Rate Limiting on Auth Endpoints

  **What to do**:
  - Add rate limiting to authentication routes using existing npm dependencies or minimal implementation
  - Implement in-memory rate limiter (no new deps) for login/register endpoints
  - Limit: 5 failed login attempts per IP per 15 minutes
  - Limit: 3 registration attempts per IP per hour
  - Return 429 Too Many Requests with retry-after header when limit exceeded
  - Add rate limit info to response headers (X-RateLimit-Remaining, X-RateLimit-Reset)

  **Must NOT do**:
  - Do NOT add new npm dependencies (implement in-memory)
  - Do NOT affect non-auth endpoints

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: T14
  - **Blocked By**: None

  **References**:
  - `backend/src/routes/authRoutes.ts` — Auth route definitions
  - `backend/src/controllers/authController.ts` — Auth controller logic
  - `backend/src/app.ts` — Middleware chain (add rate limiter here)

  **QA Scenarios**:
  ```
  Scenario: Rate limiting blocks excessive login attempts
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. Send 6 POST /api/auth/login with wrong credentials from same IP
      2. Assert 6th request returns 429
      3. Assert response includes retry-after header
    Expected Result: 429 after 5 failed attempts
    Evidence: .sisyphus/evidence/task-2-rate-limit-login.txt

  Scenario: Rate limiting allows normal usage
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. Send 3 successful login requests with valid credentials
      2. Assert all return 200
    Expected Result: Normal requests succeed
    Evidence: .sisyphus/evidence/task-2-rate-limit-normal.txt
  ```

  **Commit**: YES
  - Message: `feat(security): add rate limiting to auth endpoints`
  - Files: `backend/src/app.ts`, `backend/src/routes/authRoutes.ts`

- [x] 3. JWT Token Format Validation

  **What to do**:
  - Fix `backend/src/middleware/auth.ts` line 14: validate Authorization header format before splitting
  - Check `authHeader.startsWith('Bearer ')` before extracting token
  - Handle malformed headers like `Bearer`, `Bearer invalid-token-format`, `Basic xxx`
  - Add token structure validation (check for 3 parts in JWT: header.payload.signature)
  - Log failed authentication attempts with IP address

  **Must NOT do**:
  - Do NOT change JWT_SECRET or signing algorithm
  - Do NOT modify existing valid token flows

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: T9, T16
  - **Blocked By**: None

  **References**:
  - `backend/src/middleware/auth.ts:14` — `authHeader.split(' ')[1]` without format check
  - `backend/src/middleware/auth.ts:78` — Same issue in optionalAuth

  **QA Scenarios**:
  ```
  Scenario: Malformed Authorization header rejected
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. GET /api/persons with header "Authorization: Basic abc123"
      2. Assert response 401 or 403
    Expected Result: Request rejected with clear error message
    Evidence: .sisyphus/evidence/task-3-malformed-header.txt

  Scenario: Valid token still works after fix
    Tool: Bash (curl)
    Preconditions: Server running, valid admin token
    Steps:
      1. GET /api/persons with valid Bearer token
      2. Assert response 200 with data
    Expected Result: Valid tokens work exactly as before
    Evidence: .sisyphus/evidence/task-3-valid-token.txt
  ```

  **Commit**: YES
  - Message: `fix(auth): validate JWT token format properly`
  - Files: `backend/src/middleware/auth.ts`

- [x] 4. SQL Injection Fix — Parameterize All Dynamic Queries

  **What to do**:
  - Fix `backend/src/services/databaseService.ts` searchTalents function (line ~1158+): replace string concatenation with parameterized queries
  - Fix all dynamic WHERE clause construction to use `?` placeholders
  - Fix updateComprehensivePerson (line ~742+): parameterize field updates
  - Fix duplicate check in createPerson (line ~789+): use parameterized query
  - Audit ALL queries in databaseService.ts for `$\{` interpolation — replace with `?`
  - Audit ALL queries in mysqlService.ts for string concatenation — use parameterized
  - Ensure no user input is ever directly interpolated into SQL

  **Must NOT do**:
  - Do NOT change the query logic or results — only change HOW parameters are passed
  - Do NOT break existing search functionality
  - Do NOT add new dependencies

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7, 8)
  - **Blocks**: T7, T10, T14
  - **Blocked By**: T1

  **References**:
  - `backend/src/services/databaseService.ts:1158` — searchTalents dynamic WHERE construction (CRITICAL)
  - `backend/src/services/databaseService.ts:742-840` — updateComprehensivePerson field updates
  - `backend/src/services/databaseService.ts:789-842` — duplicate checking with string concatenation
  - `backend/src/services/mysqlService.ts:379-395` — MySQL version of update with string concat

  **QA Scenarios**:
  ```
  Scenario: SQL injection attempt blocked
    Tool: Bash (curl)
    Preconditions: Server running, valid auth token
    Steps:
      1. GET /api/search?name=" OR 1=1 --
      2. Assert response does NOT return all records
      3. Assert response 200 with empty or filtered results
    Expected Result: Injection string treated as literal search term, returns no results
    Failure Indicators: Returns all persons (injection succeeded)
    Evidence: .sisyphus/evidence/task-4-sql-injection.txt

  Scenario: Normal search still works
    Tool: Bash (curl)
    Preconditions: Server running, data exists
    Steps:
      1. GET /api/search?name=张
      2. Assert response 200 with matching results
    Expected Result: Search returns correct results matching name
    Evidence: .sisyphus/evidence/task-4-search-normal.txt

  Scenario: Update person still works
    Tool: Bash (curl)
    Preconditions: Server running, valid admin token, person exists
    Steps:
      1. PUT /api/persons/1 with valid update data
      2. Assert response 200
      3. GET /api/persons/1 and verify data updated
    Expected Result: Person data correctly updated
    Evidence: .sisyphus/evidence/task-4-update-works.txt
  ```

  **Commit**: YES
  - Message: `fix(security): parameterize all dynamic SQL queries`
  - Files: `backend/src/services/databaseService.ts`, `backend/src/services/mysqlService.ts`
  - Pre-commit: `pnpm --filter rural-talent-system-backend build`

- [x] 5. Type Assertion Safety

  **What to do**:
  - Replace `as any` type assertions with proper runtime validation in personController.ts
  - Lines 405, 472: add runtime type checks before casting
  - Add validation for `parseInt(req.params.id)` — check for NaN before use
  - Add validation for `parseInt(age)` — check range 1-150
  - Fix personId null check in permission logic (line 256): `if (req.user.role === 'user' && (!req.user.personId || req.user.personId !== id))`
  - Replace `as Person[]` with runtime type validation

  **Must NOT do**:
  - Do NOT change API response format
  - Do NOT add new dependencies

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T14
  - **Blocked By**: T1

  **References**:
  - `backend/src/controllers/personController.ts:69` — parseInt(req.params.id) without NaN check
  - `backend/src/controllers/personController.ts:176,271` — parseInt(age) without validation
  - `backend/src/controllers/personController.ts:256` — missing personId null check
  - `backend/src/controllers/personController.ts:405,472` — `as any` assertions

  **QA Scenarios**:
  ```
  Scenario: Invalid ID parameter returns 400
    Tool: Bash (curl)
    Preconditions: Server running, valid auth token
    Steps:
      1. GET /api/persons/abc
      2. Assert response 400 with "无效的ID参数"
    Expected Result: 400 error for non-numeric ID
    Evidence: .sisyphus/evidence/task-5-invalid-id.txt

  Scenario: Negative ID returns 400
    Tool: Bash (curl)
    Preconditions: Server running, valid auth token
    Steps:
      1. GET /api/persons/-1
      2. Assert response 400
    Expected Result: 400 error for negative ID
    Evidence: .sisyphus/evidence/task-5-negative-id.txt
  ```

  **Commit**: YES
  - Message: `fix(types): replace unsafe type assertions with runtime validation`
  - Files: `backend/src/controllers/personController.ts`

- [x] 6. Auth Middleware Consistency

  **What to do**:
  - Audit all routes in personRoutes.ts for correct auth middleware usage
  - Fix `POST /persons/comprehensive` (line 33): missing validatePerson validation
  - Fix `PUT /persons/:id/comprehensive` (line 39): missing validation
  - Fix `POST /persons/:id/rural-profile` (line 42): missing validation for rural profile data
  - Fix `POST /persons/:id/skills` (line 46): missing validation for skill data
  - Ensure all mutating endpoints require `authenticateToken`
  - Add consistent validation middleware chain to all POST/PUT routes

  **Must NOT do**:
  - Do NOT change route paths
  - Do NOT remove existing middleware

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T14, T16
  - **Blocked By**: T1

  **References**:
  - `backend/src/routes/personRoutes.ts:33` — POST /persons/comprehensive missing validation
  - `backend/src/routes/personRoutes.ts:39` — PUT /persons/:id/comprehensive missing validation
  - `backend/src/routes/personRoutes.ts:42-43` — rural-profile missing validation
  - `backend/src/routes/personRoutes.ts:46` — skills missing validation

  **QA Scenarios**:
  ```
  Scenario: POST /persons/comprehensive validates input
    Tool: Bash (curl)
    Preconditions: Server running, valid admin token
    Steps:
      1. POST /api/persons/comprehensive with empty body {}
      2. Assert response 400 with validation error
    Expected Result: Validation error for missing required fields
    Evidence: .sisyphus/evidence/task-6-comprehensive-validation.txt

  Scenario: POST /persons/:id/skills validates skill data
    Tool: Bash (curl)
    Preconditions: Server running, valid token, person exists
    Steps:
      1. POST /api/persons/1/skills with body {"skill_name": "", "skill_category": ""}
      2. Assert response 400
    Expected Result: Validation error for empty skill fields
    Evidence: .sisyphus/evidence/task-6-skill-validation.txt
  ```

  **Commit**: YES
  - Message: `fix(auth): standardize authentication middleware usage`
  - Files: `backend/src/routes/personRoutes.ts`

- [x] 7. Database Transaction Safety

  **What to do**:
  - Wrap multi-step database operations in transactions in databaseService.ts:
    - createComprehensivePerson: person + rural_profile + skills must be atomic
    - updateComprehensivePerson: person + rural_profile + skills update must be atomic
    - upsertRuralProfile: delete + insert must be atomic
  - Fix race condition in createPerson duplicate check (line 664-739): add UNIQUE constraint enforcement
  - Fix database-specific error messages: use error code instead of string matching for SQLite/MySQL compatibility
  - Lines 225-232, 310-317 in personController.ts: replace 'UNIQUE constraint failed' string check with error code
  - Ensure proper rollback on any failure within transaction

  **Must NOT do**:
  - Do NOT change database schema or add constraints directly
  - Do NOT change query results

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T15
  - **Blocked By**: T4

  **References**:
  - `backend/src/services/databaseService.ts:664-739` — createPerson race condition
  - `backend/src/controllers/personController.ts:225-232` — SQLite-specific error string
  - `backend/src/controllers/personController.ts:310-317` — SQLite-specific error string

  **QA Scenarios**:
  ```
  Scenario: Concurrent duplicate creation prevented
    Tool: Bash (curl)
    Preconditions: Server running, person with phone 13800138000 exists
    Steps:
      1. Send 2 concurrent POST /api/persons with same phone number
      2. Assert one succeeds (200) and one fails (409 or 400)
    Expected Result: Only one person created with that phone
    Failure Indicators: Both succeed (race condition)
    Evidence: .sisyphus/evidence/task-7-duplicate-race.txt

  Scenario: Comprehensive creation rolls back on failure
    Tool: Bash (curl)
    Preconditions: Server running, valid admin token
    Steps:
      1. POST /api/persons/comprehensive with valid person data but invalid skill data
      2. Assert response 400 or 500
      3. GET /api/persons and verify no partial person was created
    Expected Result: No partial data in database
    Evidence: .sisyphus/evidence/task-7-rollback.txt
  ```

  **Commit**: YES
  - Message: `fix(database): add transaction safety for multi-step operations`
  - Files: `backend/src/services/databaseService.ts`, `backend/src/controllers/personController.ts`

- [x] 8. Frontend API Error Handling

  **What to do**:
  - Fix GuestView.vue: change `person.location` to `person.address` (line 307-316 locations computed)
  - Add global axios error interceptor in `frontend/src/api/persons.ts` or `main.ts`:
    - Handle 401 → redirect to login with message
    - Handle 403 → show permission denied message
    - Handle 500 → show server error message
    - Handle network timeout → show network error message
  - Fix auth store: replace `fetch` with `axios` for consistency (stores/auth.ts lines 74-97)
  - Add loading states to all API calls in AdminDashboard.vue
  - Clear search timeout on component unmount (AdminDashboard.vue line 452)
  - Fix Client-side filtering vs pagination conflict (AdminDashboard.vue)

  **Must NOT do**:
  - Do NOT change Element Plus components or UI layout
  - Do NOT change the Chinese-first UI language
  - Do NOT add new npm dependencies

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T9, T12
  - **Blocked By**: None

  **References**:
  - `frontend/src/views/GuestView.vue:307-316` — wrong field name (location vs address)
  - `frontend/src/views/AdminDashboard.vue:426-440` — loadPersons no error handling
  - `frontend/src/views/AdminDashboard.vue:367-415` — filtering breaks pagination
  - `frontend/src/views/AdminDashboard.vue:452-461` — search timeout not cleared on unmount
  - `frontend/src/stores/auth.ts:74-97` — uses fetch instead of axios
  - `frontend/src/api/persons.ts` — no global error interceptor

  **QA Scenarios**:
  ```
  Scenario: GuestView shows location data correctly
    Tool: Playwright
    Preconditions: Server running, persons with address data exist
    Steps:
      1. Navigate to guest view
      2. Find location/address display section
      3. Verify address data is displayed (not empty)
    Expected Result: Location section shows actual address data from persons
    Failure Indicators: Location section is empty
    Evidence: .sisyphus/evidence/task-8-guestview-location.png

  Scenario: 401 error redirects to login
    Tool: Playwright
    Preconditions: Server running, expired token
    Steps:
      1. Login, then manually expire token (or wait)
      2. Attempt to navigate to dashboard
      3. Verify redirect to login page with error message
    Expected Result: User redirected to login with "请重新登录" message
    Evidence: .sisyphus/evidence/task-8-401-redirect.png
  ```

  **Commit**: YES
  - Message: `fix(frontend): comprehensive API error handling`
  - Files: `frontend/src/views/GuestView.vue`, `frontend/src/views/AdminDashboard.vue`, `frontend/src/stores/auth.ts`, `frontend/src/api/persons.ts`

- [x] 9. Token Refresh Mechanism

  **What to do**:
  - Backend: add `POST /api/auth/refresh` endpoint that issues a new token given a valid (not yet expired) token
  - Backend: add token refresh logic in `backend/src/controllers/authController.ts`
  - Backend: add route in `backend/src/routes/authRoutes.ts`
  - Frontend: add axios response interceptor in `frontend/src/api/persons.ts` or `main.ts`:
    - On 401 response: attempt token refresh
    - If refresh succeeds: retry original request with new token
    - If refresh fails: redirect to login
  - Frontend: update `frontend/src/stores/auth.ts` to handle token refresh
  - Make token expiry configurable via env variable `JWT_EXPIRES_IN` (default 24h)
  - Issue refresh tokens that are valid for 7 days

  **Must NOT do**:
  - Do NOT change existing login flow behavior
  - Do NOT add new npm dependencies

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 11, 12, 13)
  - **Blocks**: T16
  - **Blocked By**: T3, T8

  **References**:
  - `backend/src/controllers/authController.ts:140-155` — current JWT creation logic
  - `backend/src/controllers/authController.ts:150-151` — hardcoded 24h token expiry
  - `backend/src/middleware/auth.ts:25-70` — current token validation
  - `backend/src/routes/authRoutes.ts` — add refresh route here
  - `frontend/src/stores/auth.ts:74-97` — login function using fetch
  - `frontend/src/api/persons.ts` — add interceptor here

  **QA Scenarios**:
  ```
  Scenario: Token refresh extends session
    Tool: Bash (curl)
    Preconditions: Server running, valid token
    Steps:
      1. POST /api/auth/refresh with valid Authorization header
      2. Assert response 200 with new token
      3. Use new token to access protected endpoint
      4. Assert protected endpoint returns 200
    Expected Result: New token works for authenticated requests
    Evidence: .sisyphus/evidence/task-9-refresh-token.txt

  Scenario: Expired token cannot be refreshed
    Tool: Bash (curl)
    Preconditions: Server running, expired token
    Steps:
      1. POST /api/auth/refresh with expired Authorization header
      2. Assert response 401
    Expected Result: Cannot refresh an already-expired token
    Evidence: .sisyphus/evidence/task-9-expired-refresh.txt

  Scenario: Frontend auto-refreshes on 401
    Tool: Playwright
    Preconditions: Server running, user logged in, token about to expire
    Steps:
      1. Login as admin
      2. Wait for token to near expiry (or manually create near-expiry token)
      3. Navigate to dashboard
      4. Verify user stays logged in (no redirect to login)
    Expected Result: User session maintained via automatic token refresh
    Evidence: .sisyphus/evidence/task-9-auto-refresh.png
  ```

  **Commit**: YES
  - Message: `feat(auth): implement token refresh mechanism`
  - Files: `backend/src/controllers/authController.ts`, `backend/src/routes/authRoutes.ts`, `frontend/src/stores/auth.ts`, `frontend/src/api/persons.ts`

- [x] 10. Statistics API Implementation

  **What to do**:
  - Replace hardcoded statistics in `backend/src/controllers/personController.ts` (getStatistics function, line ~560-566)
  - Implement real database queries:
    - Total persons count
    - Persons by gender distribution
    - Persons by education level distribution
    - Persons by age group (18-30, 31-45, 46-60, 60+)
    - Persons by employment status
    - Skills distribution (top 10 skills)
    - Recent registrations (last 7 days, 30 days)
  - Update `backend/src/services/databaseService.ts` to add getStatistics method
  - Update `backend/src/services/mysqlService.ts` with equivalent MySQL queries
  - Update AdminDashboard.vue to display real statistics data

  **Must NOT do**:
  - Do NOT add new database tables
  - Do NOT change existing endpoint paths

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T15
  - **Blocked By**: T4

  **References**:
  - `backend/src/controllers/personController.ts:560-566` — current hardcoded stats
  - `backend/src/routes/personRoutes.ts:15` — GET /statistics route
  - `frontend/src/views/AdminDashboard.vue:442-449` — loadStats function consuming stats

  **QA Scenarios**:
  ```
  Scenario: Statistics returns real data
    Tool: Bash (curl)
    Preconditions: Server running, valid admin token, persons exist in DB
    Steps:
      1. GET /api/statistics with admin token
      2. Assert response 200
      3. Assert totalPersons > 0
      4. Assert genderDistribution contains expected keys
    Expected Result: Real aggregated statistics from database
    Failure Indicators: totalUsers: 25 (hardcoded value)
    Evidence: .sisyphus/evidence/task-10-real-stats.txt

  Scenario: Statistics with empty database
    Tool: Bash (curl)
    Preconditions: Server running, admin token, empty persons table
    Steps:
      1. GET /api/statistics
      2. Assert response 200
      3. Assert totalPersons === 0
      4. Assert all distribution objects are empty or zeroed
    Expected Result: Graceful zero-state response
    Evidence: .sisyphus/evidence/task-10-empty-stats.txt
  ```

  **Commit**: YES
  - Message: `feat(api): implement statistics endpoint with real data`
  - Files: `backend/src/controllers/personController.ts`, `backend/src/services/databaseService.ts`

- [x] 11. Advanced Search Filters

  **What to do**:
  - Extend the search functionality in backend to support:
    - Age range filtering (minAge, maxAge)
    - Education level filtering
    - Employment status filtering
    - Skill keyword filtering
    - Crop/filter by main crops in rural profile
  - Extend frontend GuestView.vue search panel:
    - Add age range selector (min/max inputs or slider)
    - Add education level dropdown
    - Add employment status dropdown
    - Add skill keyword input
  - Update `backend/src/services/databaseService.ts` searchTalents to handle all filter parameters
  - Update `backend/src/services/mysqlService.ts` equivalent
  - Update `frontend/src/views/GuestView.vue` to pass new filter params to API

  **Must NOT do**:
  - Do NOT change existing search behavior (additive only)
  - Do NOT add new dependencies

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T17
  - **Blocked By**: T4

  **References**:
  - `backend/src/services/databaseService.ts:1158` — current searchTalents implementation
  - `backend/src/types/index.ts:92-104` — SearchParams interface (already has minAge, maxAge, skill, crop)
  - `frontend/src/views/GuestView.vue` — search panel UI
  - `backend/src/routes/personRoutes.ts:12` — GET /search route

  **QA Scenarios**:
  ```
  Scenario: Age range filter works
    Tool: Bash (curl)
    Preconditions: Server running, persons with various ages exist
    Steps:
      1. GET /api/search?minAge=25&maxAge=35
      2. Assert response 200
      3. Assert all returned persons have age between 25 and 35
    Expected Result: Only persons within age range returned
    Evidence: .sisyphus/evidence/task-11-age-filter.txt

  Scenario: Combined filters work
    Tool: Bash (curl)
    Preconditions: Server running, data exists
    Steps:
      1. GET /api/search?minAge=20&maxAge=40&gender=male&education_level=本科
      2. Assert response 200
      3. Assert all results match ALL filter criteria
    Expected Result: Intersection of all filter conditions
    Evidence: .sisyphus/evidence/task-11-combined-filter.txt

  Scenario: GuestView advanced search UI
    Tool: Playwright
    Preconditions: Server running, frontend accessible on port 8081
    Steps:
      1. Navigate to guest view
      2. Verify advanced search filters are visible
      3. Enter age range 25-35, select education level
      4. Click search
      5. Verify results update correctly
    Expected Result: UI filters work and results update
    Evidence: .sisyphus/evidence/task-11-guestview-search.png
  ```

  **Commit**: YES
  - Message: `feat(search): add advanced search filters (age, skills, location)`
  - Files: `backend/src/services/databaseService.ts`, `backend/src/services/mysqlService.ts`, `frontend/src/views/GuestView.vue`

- [x] 12. PersonFormDialog Field Validation

  **What to do**:
  - Complete form validation in `frontend/src/components/PersonFormDialog.vue`:
    - Basic info tab: name (required, 2-50 chars), age (required, 1-150), gender (required), phone (optional, Chinese mobile), email (optional, valid email), id_number (optional, 18 digits), address
    - Rural profile tab: planting_years (0-100), planting_scale (positive number), main_crops (required if rural profile filled), has_agricultural_machinery (boolean), agricultural_machinery_details, storage_facilities
    - Skills tab: skill_name (required), skill_category (required), proficiency_level
    - Cooperation tab: cooperation_type (required if filled), investment_capacity (positive number), preferred_scale, cooperation_purpose
  - Make phone validation support both mobile and landline formats
  - Add real-time validation feedback (show errors as user types)
  - Add validation for the comprehensive submit: ensure at least basic info tab is valid before submit
  - Fix partial submission failure (line 800-898): ensure consistent state if one API call fails

  **Must NOT do**:
  - Do NOT change the tab structure or layout
  - Do NOT remove existing form fields
  - Do NOT add new npm dependencies

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T15
  - **Blocked By**: T8

  **References**:
  - `frontend/src/components/PersonFormDialog.vue:547-582` — current rules object
  - `frontend/src/components/PersonFormDialog.vue:602-655` — parseSkillsFromPerson
  - `frontend/src/components/PersonFormDialog.vue:800-898` — handleSubmit
  - `backend/src/types/index.ts:141-160` — PersonCreateRequest interface

  **QA Scenarios**:
  ```
  Scenario: Form rejects empty required fields
    Tool: Playwright
    Preconditions: Frontend running, logged in as admin
    Steps:
      1. Open person form dialog
      2. Click submit without filling any fields
      3. Verify validation errors shown for name, age, gender
    Expected Result: Red error messages for required fields
    Evidence: .sisyphus/evidence/task-12-required-validation.png

  Scenario: Form accepts valid data and submits
    Tool: Playwright
    Preconditions: Frontend running, logged in as admin
    Steps:
      1. Open person form dialog
      2. Fill name "测试人员", age 30, gender "male", phone "13800138000"
      3. Click submit
      4. Verify dialog closes and new person appears in list
    Expected Result: Person created successfully
    Evidence: .sisyphus/evidence/task-12-valid-submit.png

  Scenario: Phone accepts landline format
    Tool: Playwright
    Preconditions: Frontend running, person form open
    Steps:
      1. Enter phone "010-12345678"
      2. Verify no validation error
    Expected Result: Landline format accepted
    Evidence: .sisyphus/evidence/task-12-landline-phone.png
  ```

  **Commit**: YES
  - Message: `fix(form): complete PersonFormDialog field validation`
  - Files: `frontend/src/components/PersonFormDialog.vue`

- [x] 13. CSV Data Export

  **What to do**:
  - Backend: add `GET /api/persons/export` endpoint that:
    - Accepts same search/filter parameters as GET /persons
    - Returns CSV file with Content-Disposition header
    - Includes all person fields plus rural profile and skills (flattened)
    - Uses proper CSV escaping (quotes around fields with commas/newlines)
    - Supports UTF-8 BOM for Excel compatibility
  - Frontend: update AdminDashboard.vue exportData function (line 523):
    - Replace "开发中..." placeholder with actual export trigger
    - Call /api/persons/export with current filter state
    - Trigger browser file download
  - Add the route to personRoutes.ts with admin authentication

  **Must NOT do**:
  - Do NOT add new npm dependencies (implement CSV generation manually)
  - Do NOT change existing API response format

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T17
  - **Blocked By**: T4

  **References**:
  - `frontend/src/views/AdminDashboard.vue:523-526` — current placeholder export function
  - `backend/src/routes/personRoutes.ts` — add export route here
  - `backend/src/controllers/personController.ts` — add export handler
  - `backend/src/services/databaseService.ts` — use getAllPersonsWithDetails for data

  **QA Scenarios**:
  ```
  Scenario: CSV export downloads file
    Tool: Bash (curl)
    Preconditions: Server running, valid admin token, persons exist
    Steps:
      1. GET /api/persons/export with admin token
      2. Assert response 200
      3. Assert Content-Type contains "text/csv"
      4. Assert Content-Disposition contains "attachment"
    Expected Result: CSV file downloaded
    Evidence: .sisyphus/evidence/task-13-export-csv.txt

  Scenario: CSV contains correct data
    Tool: Bash (curl)
    Preconditions: Server running, admin token, data exists
    Steps:
      1. GET /api/persons/export > /tmp/export.csv
      2. Count lines: should be header + number of persons
      3. Verify header row contains expected column names
    Expected Result: CSV with correct structure and data
    Evidence: .sisyphus/evidence/task-13-csv-content.txt

  Scenario: CSV handles special characters
    Tool: Bash (curl)
    Preconditions: Server running, person with comma in name or address
    Steps:
      1. GET /api/persons/export
      2. Verify fields with commas are properly quoted
    Expected Result: CSV parsing not broken by special chars
    Evidence: .sisyphus/evidence/task-13-csv-special-chars.txt
  ```

  **Commit**: YES
  - Message: `feat(export): implement CSV data export`
  - Files: `backend/src/controllers/personController.ts`, `backend/src/routes/personRoutes.ts`, `frontend/src/views/AdminDashboard.vue`

- [x] 14. Backend Endpoint Tests (All 22 Endpoints)

  **What to do**:
  - Create comprehensive test file `test/test_all_endpoints.js` covering ALL 22 API endpoints:
    - Auth: POST /register, POST /login, POST /logout, GET /me, PUT /change-password, PUT /link-person
    - Person: GET /health, GET /search, GET /statistics, GET /skills-library-stats, GET /persons, GET /persons/:id, GET /persons/:id/details, POST /persons, POST /persons/comprehensive, PUT /persons/:id, PUT /persons/:id/comprehensive, POST /persons/:id/rural-profile, PUT /persons/:id/rural-profile, POST /persons/:id/skills, DELETE /skills/:skillId, DELETE /persons/:id
  - For each endpoint test: happy path, missing auth (401), wrong role (403), invalid input (400)
  - Follow existing test patterns in `test/test_system_integration.js`
  - Use same test infrastructure (axios, hardcoded test server URL)

  **Must NOT do**:
  - Do NOT modify existing test files
  - Do NOT add test frameworks (use existing custom test runner)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: T1-T7

  **References**:
  - `test/simple-verification.js` — health check test pattern
  - `test/test_system_integration.js` — integration test pattern (registration, login, CRUD, permissions)
  - `test/test_dual_user_features.js` — dual-user permission test pattern
  - `test/run-tests.sh` — test runner script
  - `backend/src/routes/personRoutes.ts` — all person endpoints
  - `backend/src/routes/authRoutes.ts` — all auth endpoints

  **QA Scenarios**:
  ```
  Scenario: All endpoint tests pass
    Tool: Bash
    Preconditions: Server running on port 8083
    Steps:
      1. Run: node test/test_all_endpoints.js
      2. Assert exit code 0
      3. Assert "PASS" for all 22 endpoint tests
    Expected Result: All endpoint tests pass
    Failure Indicators: Any test FAIL or exit code non-zero
    Evidence: .sisyphus/evidence/task-14-all-endpoints.txt

  Scenario: Test runner includes new tests
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. Run: ./test/run-tests.sh all
      2. Verify new test file is executed
    Expected Result: New tests included in full test suite
    Evidence: .sisyphus/evidence/task-14-runner.txt
  ```

  **Commit**: YES
  - Message: `test(api): comprehensive backend endpoint tests`
  - Files: `test/test_all_endpoints.js`
  - Pre-commit: `pnpm test`

- [x] 15. Error Handling & Edge Case Tests

  **What to do**:
  - Create `test/test_error_handling.js` covering:
    - 404 errors: GET /api/nonexistent-route, GET /api/persons/999999
    - 500 errors: malformed data that triggers server errors
    - Validation errors: missing required fields, wrong types, out-of-range values
    - SQL injection attempts: name="OR 1=1--", name="'; DROP TABLE persons;--"
    - XSS attempts: name="<script>alert(1)</script>", notes="<img onerror=alert(1)>"
    - Oversized inputs: name with 10000 characters, age with extremely large number
    - Concurrent requests: 10 simultaneous requests to same endpoint
    - Malformed JSON: POST with invalid JSON body
    - Missing content-type: POST without Content-Type header
  - Create `test/test_edge_cases.js` covering:
    - Empty database: all operations on empty persons table
    - Unicode/emoji in fields: name="张三🎉", address="北京市朝阳区"
    - Boundary values: age=1, age=150, name with exactly 2 chars, name with exactly 50 chars
    - Null handling: optional fields set to null, undefined, empty string

  **Must NOT do**:
  - Do NOT modify existing tests
  - Do NOT add dependencies

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: T7, T10, T12

  **References**:
  - `test/test_system_integration.js` — existing error handling patterns
  - `backend/src/middleware/errorHandler.ts` — global error handler
  - `backend/src/middleware/validation.ts` — validation rules

  **QA Scenarios**:
  ```
  Scenario: Error tests pass
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. Run: node test/test_error_handling.js
      2. Assert exit code 0
      3. Assert all SQL injection tests blocked
    Expected Result: All error/edge case tests pass
    Evidence: .sisyphus/evidence/task-15-error-tests.txt

  Scenario: Edge case tests pass
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. Run: node test/test_edge_cases.js
      2. Assert exit code 0
    Expected Result: All edge case tests pass
    Evidence: .sisyphus/evidence/task-15-edge-tests.txt
  ```

  **Commit**: YES
  - Message: `test(error): error handling and edge case tests`
  - Files: `test/test_error_handling.js`, `test/test_edge_cases.js`

- [x] 16. Auth & Permission Tests

  **What to do**:
  - Create `test/test_auth_permissions.js` covering:
    - Token lifecycle: login → use token → logout → token rejected
    - Token expiry: verify expired tokens return 401
    - Token refresh: verify refresh endpoint issues new valid token
    - Role-based access:
      - Admin can: CRUD all persons, delete persons, view statistics, export
      - User can: view all persons, edit only own person, create persons
      - Guest can: view persons (masked), search persons
    - Invalid token: malformed JWT, wrong signature, empty token
    - Concurrent sessions: login from two places, logout from one
    - Password change: change password → old token invalid → login with new password
    - Registration: duplicate username, duplicate email, weak password rejection

  **Must NOT do**:
  - Do NOT modify existing auth tests
  - Do NOT change JWT_SECRET or auth logic

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: T6, T9

  **References**:
  - `test/test_dual_user_features.js` — existing permission test pattern
  - `backend/src/middleware/auth.ts` — authentication middleware
  - `backend/src/routes/authRoutes.ts` — auth routes
  - `backend/src/routes/personRoutes.ts` — role-protected routes

  **QA Scenarios**:
  ```
  Scenario: Auth tests pass
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. Run: node test/test_auth_permissions.js
      2. Assert exit code 0
      3. Assert all role-based access tests pass
    Expected Result: All auth/permission tests pass
    Evidence: .sisyphus/evidence/task-16-auth-tests.txt
  ```

  **Commit**: YES
  - Message: `test(auth): authentication and permission tests`
  - Files: `test/test_auth_permissions.js`

- [x] 17. Search & Pagination Tests

  **What to do**:
  - Create `test/test_search_pagination.js` covering:
    - Search by name: exact match, partial match, no match
    - Search by age range: min only, max only, both, reversed min > max
    - Search by gender: male, female, other
    - Search by education level: various levels
    - Combined filters: multiple filters simultaneously
    - Pagination: page 1, page 2, page beyond data, limit 1, limit 100
    - Search + pagination combined: filter results then paginate
    - Empty results: search with no matching results
    - Special characters in search: Unicode, spaces, hyphens

  **Must NOT do**:
  - Do NOT modify existing search logic

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: T11, T13

  **References**:
  - `backend/src/services/databaseService.ts:1158` — searchTalents implementation
  - `backend/src/routes/personRoutes.ts:12` — GET /search route

  **QA Scenarios**:
  ```
  Scenario: Search tests pass
    Tool: Bash
    Preconditions: Server running, test data exists
    Steps:
      1. Run: node test/test_search_pagination.js
      2. Assert exit code 0
      3. Assert all search and pagination tests pass
    Expected Result: All search/pagination tests pass
    Evidence: .sisyphus/evidence/task-17-search-tests.txt

  Scenario: CSV export test pass
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. Include export test in search test file
      2. Verify CSV download returns valid CSV
    Expected Result: Export test included and passing
    Evidence: .sisyphus/evidence/task-17-export-test.txt
  ```

  **Commit**: YES
  - Message: `test(search): search and pagination tests`
  - Files: `test/test_search_pagination.js`

---

## Questions Needing Clarification

- **[DECISION NEEDED]**: Should CSV export be admin-only or also available to regular users? Currently planned as admin-only.
- **[DECISION NEEDED]**: Should token refresh use a separate refresh token (more secure) or re-use the access token (simpler)? Currently planned as re-use approach for simplicity.
- **[DEFAULT APPLIED]**: Phone validation updated to support both mobile (1[3-9]...) and landline (0XX-XXXXXXXX) formats.
- **[DEFAULT APPLIED]**: JWT expiry made configurable via JWT_EXPIRES_IN env var, default 24h.

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm build` + `pnpm lint` + `pnpm test`. Review all changed files for: `as any`, empty catches, console.log in prod, unused imports, excessive comments.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cross-task integration. Test edge cases: empty state, invalid input, expired tokens. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- T1: `fix(validation): comprehensive input validation middleware`
- T2: `feat(security): add rate limiting to auth endpoints`
- T3: `fix(auth): validate JWT token format properly`
- T4: `fix(security): parameterize all dynamic SQL queries`
- T5: `fix(types): replace unsafe type assertions with runtime validation`
- T6: `fix(auth): standardize authentication middleware usage`
- T7: `fix(database): add transaction safety for multi-step operations`
- T8: `fix(frontend): comprehensive API error handling`
- T9: `feat(auth): implement token refresh mechanism`
- T10: `feat(api): implement statistics endpoint with real data`
- T11: `feat(search): add advanced search filters (age, skills, location)`
- T12: `fix(form): complete PersonFormDialog field validation`
- T13: `feat(export): implement CSV data export`
- T14: `test(api): comprehensive backend endpoint tests`
- T15: `test(error): error handling and edge case tests`
- T16: `test(auth): authentication and permission tests`
- T17: `test(search): search and pagination tests`

## Success Criteria

### Verification Commands
```bash
pnpm build                  # Expected: exit 0, no errors
pnpm test                   # Expected: all tests pass
pnpm type-check             # Expected: exit 0
grep -r "TODO\|FIXME" backend/src/ frontend/src/ --include="*.ts" --include="*.vue"  # Expected: empty
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass (existing + new)
- [ ] No SQL injection vectors
- [ ] Token refresh working
- [ ] Statistics API returning real data
- [ ] CSV export functional
- [ ] Advanced search filters working
