# Frontend Data Layer

Browser-only application data modules live here.

## Modules

- db.ts: IndexedDB access
- store.ts: Zustand app state and actions
- io.ts: JSON export/import
- parse.ts: quick-capture parser
- rooms.ts: room metadata and map coordinates

These modules are frontend-only and should not be imported by backend runtime code.
