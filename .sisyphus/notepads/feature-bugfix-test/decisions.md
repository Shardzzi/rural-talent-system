## [2026-03-30 22:45:12] Decisions
- Task 1 (Input Validation): Completed and committed as e9a9fb1
- Using in-memory rate limiting (no new deps) per guardrails
- Maintaining existing JWT flows, only adding format validation
- Task 3 (JWT token format validation): Use shared Bearer/JWT parsing helper to reject malformed headers early, while preserving valid tokens and existing session checks.
- Task 6 (Standardize auth middleware): No changes needed - Wave 1 Task 1 (commit e9a9fb1) already applied all required validation middleware chains to personRoutes.ts. All POST/PUT routes have authenticateToken + appropriate validator + handleValidationErrors.
## [2026-03-30 23:40] Task 5: Replace unsafe type assertions with runtime validation

### Decisions
- Added `validateIdParam()` helper for all parseInt(req.params.id) calls - validates positive integer, rejects NaN/negative/zero
- Added `validateAge()` helper for age parsing - validates 1-150 range with integer check
- Replaced `as any` with typed assertions using Record<string, unknown> or specific interfaces (e.g., cooperation stats interface)
- Replaced `as Person[]` with `Array.isArray()` runtime check - safer than blind cast
- Fixed personId null check: `(!req.user.personId || req.user.personId !== id)` instead of `req.user.personId !== id`
- Kept `as Person | null` on getPersonById return - this is an acceptable assertion from a typed service layer

### Key pattern
```typescript
// Validation helper throws, controller catches and returns 400
let id: number;
try {
    id = validateIdParam(req.params.id);
} catch (validationError) {
    res.status(400).json({ success: false, message: (validationError as Error).message });
    return;
}
```
- Use a single transaction via \`/api/persons/comprehensive\` for data creation. If \`linkPersonToUser\` fails, manually delete the created person to ensure consistent state and prevent floating, unlinked records.
- Added regex \`/^(1[3-9]\d{9}|0\d{2,3}-\d{7,8})$/\` to support both mobile and landline phone formats natively in Element Plus forms.
- Bind skills to \`form\` reactive object so \`el-form-item\` rules can dynamically validate them natively without breaking layout structure.

## Task 10: Statistics API Real Data (2026-03-31)
- Added 3 new statistics methods: getGenderDistribution, getTopSkills, getRecentRegistrations to both SQLite and MySQL services
- Added 7 previously missing statistics methods to mysqlService.ts (getTotalSkillsCount, getCooperationStats, getSkillsCategoryStats, getAgricultureStats, getEducationStats, getAgeDistribution, getSkillsLibraryStats)
- The controller already called real methods; the issue was mysqlService.ts was incomplete
- Fixed pre-existing bug: validateUserSession compared JS millisecond timestamp with SQLite CURRENT_TIMESTAMP (datetime string), changed to `(strftime('%s','now') * 1000)` for correct comparison
- Did not add employment_status distribution as the persons table lacks that column (task constraint: no schema changes)

## Task 13 - CSV Export (2026-03-30)

- Used try/catch fallback from `getAllPersonsWithDetails()` to `getAllPersons()` to handle pre-existing schema mismatch gracefully. Export still works with basic person fields.
- CSV columns aligned with actual DB schema (`farming_years`, `breeding_types`, `cooperation_willingness`, etc.) rather than the broken query's column names.
- Frontend uses `responseType: 'blob'` for proper binary download handling.
- Route placed at `/persons/export` before `:id` route to avoid path parameter conflicts.

## Task 11: Advanced Search Filters
- **Decision**: Did NOT add employment_status filter to SQL query because the persons table lacks this column. The column is referenced in code (createComprehensivePerson) but was never added to the actual SQLite schema.
- **Decision**: Frontend employment_status filter remains as client-side filter (pre-existing behavior, unchanged).
- **Decision**: Added gender and education_level as server-side SQL filters, plus existing name/skill/crop/minAge/maxAge.
- **Decision**: Added mysqlService.ts searchTalents method matching databaseService.ts capabilities (without employment_status).
- **Gotcha**: persons table has mixed gender values (男, 女, male) - validation only allows male/female/other.

## Task 17 - Search & Pagination Tests
- searchTalents SQL does LIKE queries with LEFT JOIN on rural_talent_profile and talent_skills; no server-side LIMIT/OFFSET pagination despite page/limit validation in middleware
- Pagination params (page, limit) are validated by express-validator but not applied in the DB query — tests verify validation works (400 on invalid) but don't assert result count changes
- Gender values are 'male'/'female'/'other' (not Chinese); education_level uses Chinese values
- CSV export at GET /persons/export requires admin auth (401 without token)

## [2026-03-31 01:22:14] Task 14 - all endpoint tests
- Added single-script endpoint coverage in `test/test_all_endpoints.js` for all 22 backend routes.
- Kept existing custom Node+axios style (no new test framework/dependencies), with explicit checks for happy path, 401, 403, 400 and error/fallback responses where route design allows.
- Used unique `X-Forwarded-For` values per request to avoid auth rate-limit interference during sequential login/register tests.
