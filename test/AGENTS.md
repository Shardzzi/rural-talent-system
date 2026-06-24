# TEST KNOWLEDGE BASE

**Scope:** Custom Node.js API test suite  
**Tech:** Pure Node.js + axios (only dependency)  
**Runtime:** Requires backend on localhost:8085 (configurable via `API_BASE_URL` env var)

## STRUCTURE

```
test/
├── package.json           # pnpm workspace: rural-talent-system-test
├── run-tests.sh           # Bash runner (v3.0) — serial execution, health pre-check
├── README.md              # Test documentation
├── simple-verification.js       # (157L) Port check, DB file/table existence, API reachability
├── test_system_integration.js    # (174L) E2E: register → login → CRUD → link → guest → cleanup
├── test_dual_user_features.js    # (244L) Admin vs user: lists, details, permissions, stats
├── test_all_endpoints.js         # (993L) 22-endpoint matrix coverage with happy-path + error variants
├── test_error_handling.js        # (479L) 404/401/403/400/429 error paths + malformed JSON
├── test_edge_cases.js            # (746L) SQL injection, XSS, boundaries, concurrency, unicode
├── test_auth_permissions.js      # (753L) Token lifecycle, role matrix, refresh, weak password
├── test_search_pagination.js     # (545L) Multi-dim search, filters, pagination, CSV export
├── test_batch_operations.js      # (378L) [UNREGISTERED] Batch delete/update, CSV import flow
└── test_pagination.js            # (169L) [UNREGISTERED] Direct DB unit test via ts-node
```

## KEY PATTERNS

- **No test framework** — custom `assert()` per file, ANSI colored console output, process.exit(0/1)
- **HTTP-only** — 8/10 files test via axios against running backend at localhost:8085 (override via `API_BASE_URL` env var)
- **Rate-limit bypass** — 22-endpoint test uses random `X-Forwarded-For` IPs; other tests use `sleep(ms)`
- **Dynamic test data** — `Date.now()`-suffixed unique names, cleanup in `finally` blocks
- **No fixtures** — relies on pre-existing DB + runtime-created data + fixed test accounts

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new test | `test/*.js` → register in `run-tests.sh` and `package.json` scripts |
| Test new endpoint | `test_all_endpoints.js` — add to endpoint matrix + coverage counter |
| Test permissions | `test_auth_permissions.js` or `test_dual_user_features.js` |
| Test input validation | `test_error_handling.js` — 400/4xx error variants |
| Test search/filters | `test_search_pagination.js` — multi-dim search matrix |
| Test batch/import | `test_batch_operations.js` [unregistered] |
| Run all tests | `pnpm test` or `cd test && ./run-tests.sh all` |
| Run single test | `cd test && node test_all_endpoints.js` |

## RUN COMMANDS

```bash
pnpm test                          # Run all registered tests
cd test && ./run-tests.sh all      # Bash runner (all categories)
cd test && ./run-tests.sh endpoints  # Specific category
cd test && node test_all_endpoints.js  # Direct execution
pnpm --filter rural-talent-system-test test:search  # Single category via pnpm
```

## NOTES

- Tests modify the shared `backend/data/persons.db` — no test DB isolation
- Pre-existing test accounts: `admin`/`admin123`, `testuser`/`test123`
- Backend must be running before tests begin (default: localhost:8085, override via `API_BASE_URL` env var)
- 2 test files (`test_batch_operations.js`, `test_pagination.js`) exist but are not registered in runner/scripts
- `test_pagination.js` requires `ts-node` to import backend TypeScript directly
- No frontend tests exist
- No code coverage tooling
