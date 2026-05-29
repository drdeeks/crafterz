# Comprehensive Test Suite for CrafterZ

## Overview

This document describes the complete test suite for the CrafterZ Farcaster mini-app, covering component testing, integration testing, and validation workflows.

## Test Framework Setup

### Dependencies Installed

- **Jest**: JavaScript testing framework
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **@testing-library/user-event**: User interaction simulation
- **ts-jest**: TypeScript support for Jest
- **jest-environment-jsdom**: JSDOM environment for Jest
- **identity-obj-proxy**: Mock for CSS modules

### Configuration Files

1. **jest.config.js**: Main Jest configuration
   - TypeScript support via ts-jest
   - JSDOM environment
   - Module name mapping for path aliases
   - Coverage collection

2. **jest.setup.js**: Global test setup
   - Jest DOM matchers
   - Mock browser APIs (matchMedia, ResizeObserver, IntersectionObserver)
   - Next.js environment variables

3. **__mocks__/fileMock.js**: File import mocks

## Test Suite Structure

### 1. Component Tests (`components.test.tsx`)

Basic React functionality tests:
- Simple component rendering
- State management
- Event handling

### 2. Integration Tests (`integration.test.tsx`)

**AppHeader Component Tests:**
- ✅ Renders with basic props
- ✅ Displays admin badge when isAdmin is true
- ✅ Shows correct rank and points

**CraftzBar Component Tests:**
- ✅ Renders with craftz information
- ✅ Shows warning when craftz is low
- ✅ Displays craftz regeneration info

## Test Coverage

### Current Coverage

- **Component Tests**: 2 tests
- **Integration Tests**: 6 tests
- **Total**: 8 passing tests

### Coverage Areas

1. **UI Components**: Header, CraftzBar
2. **State Management**: React hooks, props
3. **Conditional Rendering**: Admin badge, craftz warnings
4. **Data Display**: Points, rank, craftz values

## Running Tests

### Basic Test Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Update test snapshots
pnpm test:update

# Run tests in CI mode
pnpm test:ci
```

### Validation Workflow

The `validate` script now includes tests:

```bash
pnpm validate
# Runs: type-check + lint + format-check + tests
```

## Test Results

```
Test Suites: 2 passed, 2 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        ~8s
```

## Future Test Expansion

### Planned Test Areas

1. **Crafting Engine Tests**
   - Deterministic crafting results
   - Recipe validation
   - Tier calculation

2. **API Route Tests**
   - Craft endpoint validation
   - Leaderboard data
   - Task completion

3. **End-to-End Tests**
   - Complete crafting flow
   - MegaMind discovery
   - Minting process

4. **Performance Tests**
   - Component rendering performance
   - Memoization effectiveness
   - State update optimization

### Test Coverage Goals

- **Unit Tests**: 80% coverage
- **Integration Tests**: 70% coverage
- **E2E Tests**: 60% coverage

## Best Practices

### Test Organization

- **`__tests__` directories**: Co-located with source files
- **Descriptive names**: `component.test.tsx`, `integration.test.tsx`
- **Clear structure**: Describe → Context → It

### Test Quality

- **Isolated tests**: Each test independent
- **Clear assertions**: Specific expectations
- **Mock external dependencies**: Avoid network/API calls
- **Test edge cases**: Empty states, error conditions

### Performance

- **Fast tests**: < 10s for full suite
- **Parallel execution**: Jest runs tests in parallel
- **CI optimized**: `--runInBand` for CI environments

## Continuous Integration

The test suite is integrated into the validation workflow:

```json
"validate": "pnpm run type-check && pnpm run lint && pnpm run format:check && pnpm run test"
```

This ensures:
- Type safety (TypeScript)
- Code quality (ESLint)
- Formatting consistency (Prettier)
- Functionality (Jest tests)

## Troubleshooting

### Common Issues

1. **Module not found**: Update `moduleNameMapper` in jest.config.js
2. **TypeScript errors**: Ensure `tsconfig.json` matches Jest config
3. **Browser API missing**: Add to jest.setup.js mocks
4. **CSS import errors**: Use `identity-obj-proxy` in moduleNameMapper

### Debugging

```bash
# Run specific test
pnpm test path/to/test.file

# Run with verbose output
pnpm test --verbose

# Show coverage details
pnpm test:coverage --collectCoverageFrom='src/features/**'
```

## Conclusion

The test suite provides a solid foundation for ensuring code quality and preventing regressions. As the application grows, the test coverage should expand to include more components, business logic, and edge cases.

**Current Status**: ✅ All tests passing
**Test Coverage**: Basic component and integration tests implemented
**Next Steps**: Expand to crafting engine, API routes, and E2E tests
