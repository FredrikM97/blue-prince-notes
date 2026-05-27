# Frontend Boundary

This folder contains frontend application runtime and route composition.

## Files

- router.tsx: app route tree, shell wiring, and page selection logic

## Notes

- Browser data persistence remains in IndexedDB via src/lib/db.ts.
- TanStack Start still requires framework entry shims at src/router.tsx.
