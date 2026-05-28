---
description: Describe when these instructions should be loaded by the agent based on task context
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

# Working Rules

- Prioritize clean, simplified code over backward compatibility by default.
- Do not keep compatibility aliases, wrappers, or shims unless explicitly requested.
- When refactoring, prefer replacing old APIs/components directly instead of preserving legacy names.
- If backward compatibility is required for a specific change, that requirement must be stated in the task.

## Formatting And Lint Hygiene

- Treat formatter/lint diagnostics as part of done criteria for touched files.
- If diagnostics include Prettier import/object/JSX reflow suggestions (for example: `Replace ... prettier/prettier`), apply those formatting fixes before finalizing.
- Prefer running ESLint with fix for touched frontend files when formatting diagnostics are present.
- After edits, re-check diagnostics for all changed files and resolve remaining actionable issues.
- Do not add blanket file-level disables such as `/* eslint-disable ... */` unless there is no viable structural fix.
- If a lint disable is truly unavoidable, keep it scoped to the smallest possible line/block and add a short reason.

## Type Safety

- Keep `noImplicitAny` behavior enforced and avoid introducing implicit `any` values.
- Prefer typed callback params and typed state/action payloads over inference that degrades to `any`.

## Testing Expectations

- Add or update relevant automated tests for behavior changes and bug fixes; do not rely only on manual verification.
- Prefer small, focused unit tests for utility/business logic and component tests for UI behavior.
- Include snapshot tests for stable, user-facing UI structure when layout/markup changes are part of the task.
- When snapshots change intentionally, review and keep them only when they represent the expected UI output.

## Theme Token Structure

- In `src/frontend/styles.css`, keep light mode tokens in `:root` and dark mode tokens in `:root.dark`.
- Use explicit section comments for each mode: `core surfaces`, `interactive colors`, `controls/focus`, and `sidebar`.
- Add new color tokens to both modes (or document why a token intentionally inherits).

## JSX ClassName Structure

- Keep JSX `className` values short and readable.
- Avoid large inline utility strings in JSX (for example: `className="mx-auto max-w-7xl px-4 py-6"`).
- Prefer local, component-scoped styling near the component implementation.
- It is OK and preferred to place style constants at the top of a TSX file when they are only used by that component.
- It is also OK to create a local CSS file next to a component/page (for example in `quick-note/`) when styles are specific to that feature.
- Use `src/frontend/styles.css` primarily for truly shared, cross-feature design tokens and reusable global classes.
- If a class list grows beyond a small, readable size, refactor it before finishing the task.
- Keep inline `className` usage limited to short, readable cases; extract long class lists into local component styles.

## Component Isolation

- Each component should own only the state and effects directly tied to its own rendering. Do not let parent components hold state that belongs to a child.
- Extract self-contained behaviors into dedicated components (e.g. `ThemeToggle` owns its own theme state — `AppHeader` does not need to know the current theme).
- A component that manages its own data (localStorage, subscriptions, derived values) should be the single owner of that data. Avoid duplicating that logic in a parent.
- When a parent component conditionally renders logic that could be a named sub-component, prefer extracting it so the parent body stays flat and readable.

## Component Scope And Maintainability

- Avoid massive component functions that mix store wiring, derived data, effects, and submit/business logic in one place.
- Keep constants and effects isolated near the component area that owns them.
- Prefer focused local hooks (for example: derived data, global listeners, submit handlers) instead of one giant hook return object.
- Destructure only what a component section needs; avoid pulling large state/action sets into a single top-level function when they can be delegated.

## Panel Naming And Sidebar Structure

- For sidebar UI components, use names suffixed with `Panel`.
- Prefer dedicated panel components for sidebar sections instead of embedding all sidebar markup directly in parent view components.
- Keep panel logic scoped to the panel component where practical (filters/state wiring/render blocks).

## Naming Consistency

- Keep naming consistent for note-domain UI components; prefer `Notes*` names over mixing `Note*` and `Notes*` at the same architectural level.
- Avoid reintroducing retired names (for example `Capture*`) once a new naming direction is chosen.

## Button Usage

- Use the premade button components from `ui/button.tsx` instead of calling `buttonClass()` directly.
- Available components: `Button` (general, supports `variant` and `size` props), `IconButton` (ghost icon, always square with `shrink-0` and `type="button"` built in), `BrassButton` (accent primary action), `GhostButton` (secondary/cancel action).
- Do not reach for `buttonClass()` for new code. If an exact combination is not covered by a premade component, add a new variant to `ui/button.tsx` rather than using the raw function.
- `IconButton` has `type="button"` and `shrink-0` built in — never pass these explicitly at the call site.

## Markdown Support

- Use `MarkdownEditor` from `common/MarkdownEditor.tsx` wherever users write markdown text (note body, details fields). It includes a toolbar and live preview toggle.
- Use `MarkdownPreview` from `common/MarkdownPreview.tsx` to render stored markdown in read-only contexts (note detail views, map cell previews).
- Do not reach for raw `ReactMarkdown` + `remarkGfm` inline in components — always use these shared wrappers.

## Hook Complexity

- If a hook returns more than 4–5 values or takes more than 4–5 parameters, consider splitting it.
- Prefer named, focused hooks (one purpose each) over large aggregate hooks.
- When `useMemo` chains are complex, add short comments explaining what each memo computes and why.
- Prefer inlining trivial `useMemo` calls in the component body over extracting them into a hook with a long parameter list.
- Avoid adding `useMemo` by default. Use it only when a value is demonstrably expensive to recompute, or when a stable reference is required for a memoized child or effect dependency. Prefer plain computation, module constants, or derived selectors first.
- Avoid `setState` when the value is purely derived from props or can live in a ref/controlled DOM element without changing render output. In hot UI paths, keep state as local and minimal; prefer refs for transient cursor/selection data and uncontrolled inputs only when that measurably reduces rerenders.

## Structural Simplicity

- Prefer fewer div layers. Before wrapping in a new `<div>`, check if the existing parent container can receive the needed class instead.
- Avoid wrapping a single child in a structural div that adds no layout behavior — remove it and apply the class directly.
- Regularly review components for redundant container elements after refactors.

## Panel Visual Rules

- Avoid adding decorative inner borders inside existing panel containers (for example inside `page-layout-panel`).
- Prefer spacing, typography, and subtle background contrast over nested bordered boxes within panels.

## Instruction Maintenance

- Continuously update this instructions file when the user provides new project-wide preferences that should persist.
- When new guidance is reusable across files, add or adjust rules in this file in the same task, not later.
- Keep instruction updates concise and non-conflicting with existing rules.

## Folder Structure (Current)

```
src/
  lib/                  # Shared between server and frontend — do NOT move to frontend/.
                        # types.ts / utils.ts (both sides), error-page.ts / error-capture.ts (server-only).
  frontend/
    components/
      common/           # ALL shared components and Radix UI wrappers live here.
                        # Replaces the old `ui/` folder (removed). No separate ui/ folder.
      notes/            # Notes feature (was quick-note/): NotesView, NotesPanel (capture),
                        # NotesDetailPanel, NotesFiltersPanel, NotesRow, etc. + notes.css
      note-row/         # NoteRowSummary, NoteRowEditor, NoteRowDetails + note-row.css
      map/              # MapPage, MapPanel + map.css
      graph/            # GraphPage
      images/           # ImagesPage + images.css
      todos/            # TodosPage + TodoItem + TodoScopeFilter + todos.css
      settings/         # SettingsPage
      AppHeader.tsx     # + app-header.css (co-located)
    data/               # store, db, io, parse, rooms
    styles.css          # Global CSS entry point — tokens only. Per-feature CSS is @imported.
```

## Three-Zone Page Layout

Pages use a consistent three-zone structure managed by `PageLayout` (in `common/`):

- **Left** — `page-layout-sidebar`: sticky filter/navigation column. Provided via the `sidebar` prop.
- **Middle / content** — `page-layout-content`: main content area. Receives `children`.
  - CSS class `page-layout-content-offset` adds right padding when a SidebarPanel is open (`panelOpen` prop).
  - A 200ms `padding-right` transition prevents jarring shifts when panels open/close.
- **Right** — `SidebarPanel` (from `common/SidebarPanel.tsx`): fixed right overlay, slides in.
  - Map uses an **inline** right panel (`MapPanel`) instead of SidebarPanel to eliminate layout shift.

Use `<PageLayout className="max-w-2xl">` etc. to override the default `max-w-7xl` per page.

## Per-Feature CSS Co-location

Each feature folder owns its own CSS file (e.g. `map/map.css`, `notes/notes.css`).

- Each file contains a single `@layer components { ... }` block.
- All feature CSS files are `@import`-ed by `src/frontend/styles.css`.
- `styles.css` contains only: @imports, @custom-variant, @theme tokens, `:root` variables, and global `html {}` styles.
- Do NOT add component classes directly to `styles.css`.

## lib/ Purpose

The `src/lib/` folder is the **server-and-frontend shared boundary**:

- `types.ts` — domain types (`Note`, `Todo`, `GridCell`, etc.) used by both frontend and server/db layers.
- `utils.ts` — the `cn()` helper (clsx + tailwind-merge). Imported widely by component files.
- `error-page.ts` — renders the HTML fallback error page; used by `src/start.ts` (server only).
- `error-capture.ts` — captures errors out-of-band for server recovery; used by `src/start.ts`.

Do not move `lib/` files into `frontend/` — the server-side files (`start.ts`, routes) depend on them.

## Security

- A CodeQL workflow (`.github/workflows/codeql.yml`) runs on push/PR to `main` and weekly.
  Uses `security-extended` queries for OWASP Top 10 coverage.
- All code should be free of OWASP Top 10 vulnerabilities (injection, XSS, insecure deserialization, etc.).
