# Backend Tests

This directory contains the automated test suite for the Caeli backend application.

## Test Structure

```
src/__tests__/
├── setup.ts                    # Global test setup and configuration
├── helpers/
│   └── test-app.ts            # Helper to create test Fastify instances
├── unit/                      # Unit tests for individual controllers
│   ├── auth.controller.test.ts
│   ├── task.controller.test.ts
│   └── group.controller.test.ts
└── integration/               # Integration tests for complete flows
    └── main-flows.test.ts

src/__mocks__/
└── supabase.ts                # Mocked Supabase client for testing
```

## Running Tests

### Run all tests

```bash
pnpm test
```

### Run tests in watch mode (useful during development)

```bash
pnpm test:watch
```

### Run tests with UI

```bash
pnpm test:ui
```

### Run only unit tests

```bash
pnpm test:unit
```

### Run only integration tests

```bash
pnpm test:integration
```

### Run tests with coverage report

```bash
pnpm test:coverage
```

## Coverage Requirements

The test suite is configured to maintain a minimum code coverage of **70%** for:

- Lines
- Functions
- Branches
- Statements

Coverage reports are generated in the following formats:

- Text (displayed in console)
- JSON (`coverage/coverage-final.json`)
- HTML (`coverage/index.html`)
- LCOV (`coverage/lcov.info`)

## Test Categories

### Unit Tests

Unit tests focus on individual controller functions in isolation:

- **Auth Controller**: OAuth flow, session management, token refresh
- **Task Controller**: CRUD operations for tasks
- **Group Controller**: Household/group management

### Integration Tests

Integration tests verify complete user flows:

- Authentication flow (OAuth initiation → callback → token refresh)
- Household creation and management
- Task lifecycle (create → assign → complete)
- Invitation flow
- Error handling and edge cases

## Key Features

### Mocking

- **Supabase Client**: Fully mocked to avoid database dependencies
- **JWT Verification**: Mocked authentication for isolated testing
- **Fast Execution**: All tests use mocks, no external services required

### Test Speed

- Target: Complete test suite runs in < 30 seconds
- Unit tests: < 10 seconds
- Integration tests: < 20 seconds

### Best Practices

- Each test is independent and isolated
- Proper setup and teardown in `beforeAll`/`afterAll`
- Descriptive test names following "should..." pattern
- Comprehensive assertions for success and failure cases

## Test Data

Mock data is defined in:

- `src/__mocks__/supabase.ts` - Mock responses for Supabase operations
- Individual test files - Test-specific mock data

## Troubleshooting

### Tests failing with TypeScript errors

Run type checking:

```bash
pnpm type-check
```

### Coverage below threshold

Identify uncovered code:

```bash
pnpm test:coverage
# Open coverage/index.html in browser for detailed report
```

### Tests timing out

Check the timeout settings in `vitest.config.ts`:

- `testTimeout`: 30000ms (30 seconds)
- `hookTimeout`: 30000ms (30 seconds)

## Adding New Tests

### For a new controller:

1. Create `src/__tests__/unit/[controller-name].controller.test.ts`
2. Import test helpers and mocks
3. Follow existing test structure
4. Test both success and error cases

### For a new integration flow:

1. Add test cases to `src/__tests__/integration/main-flows.test.ts`
2. Or create a new integration test file if the flow is complex
3. Mock complete user journeys
4. Verify end-to-end behavior

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

- Fast execution (< 30 seconds)
- No external dependencies
- Exit codes indicate pass/fail
- Coverage reports can be uploaded to coverage services

To run in CI:

```bash
pnpm test:coverage
```

The command will exit with code 0 on success, non-zero on failure.
