# Testing Guide

This project uses three test layers only: unit, integration, and e2e.

## Folder map

- `tests/unit`
  - Pure logic and small hooks.
  - Fast, isolated, no broad app wiring.
- `tests/integration`
  - Cross-module behavior and feature wiring.
  - Includes data/router tests plus UI integration tests.
  - UI integration tests live in `tests/integration/ui`.
  - UI smoke snapshots live in `tests/integration/smoke-ui`.
- `tests/e2e`
  - Browser flow validation with Playwright.
  - Local-only smoke runs.

## How to choose a test type

- If you are validating parsing/utility logic: use `unit`.
- If you are validating module collaboration or UI behavior with mocks: use `integration`.
- If you are validating full app navigation/flows in a browser: use `e2e`.

## Commands

- `npm run test` - full local verification (types + Vitest + e2e smoke)
- `npm run test:vitest` - full Vitest suite only
- `npm run test:unit` - unit tests only
- `npm run test:integration` - all integration tests
- `npm run test:integration:ui` - integration UI tests only
- `npm run test:smoke:ui` - integration UI smoke snapshot tests only
- `npm run test:smoke:local` - Playwright smoke tests (local)
- `npm run test:verify:local` - alias for `npm run test`

## Practical strategy (less is more)

- Prefer `integration` tests as the main safety net for UI functionality.
- Keep `unit` tests only for fast, high-value logic (parsing, helpers, selectors, small hooks).
- Keep `e2e` as a small smoke suite for critical user journeys (navigation + create/edit/import flows).
- Avoid duplicating the same scenario in all three layers.

## E2E artifacts

- Playwright outputs (`playwright-report`, `test-results`, `blob-report`) are generated locally when needed.
- These folders are ignored by Git via `.gitignore` and are not intended to be committed.

## Shared test setup and fixtures

- `tests/setup.tsx` provides global defaults for browser-like APIs used in UI tests:
  - `matchMedia`
  - `ResizeObserver`
  - `IntersectionObserver`
  - `URL.createObjectURL` and `URL.revokeObjectURL`
- `tests/setup.tsx` also runs cleanup and restores mocks after each test.
- Use typed domain builders from `tests/fixtures/domainBuilders.tsx` to avoid repeating full object shapes in tests.
  - Example builders: `buildNote`, `buildTodo`, `buildStoredImage`, `buildSection`, `buildGridCell`
- Use provider helpers from `tests/helpers/renderWithProviders.tsx` for provider-heavy tests.
  - Example helper: `renderRootLayoutWithProviders()` for router/root-layout integration tests.

## Naming conventions

- Unit/integration tests: `*.test.tsx`
- Playwright e2e tests: `*.spec.tsx`
- UI smoke snapshots: `*.smoke.test.tsx`
