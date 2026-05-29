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

## Less Is More

- Default to the smallest solution that fully solves the problem.
- Prefer reducing complexity over adding abstraction layers.
- Remove redundant code, duplicate helpers, and low-value indirection when touching related areas.
- Keep folders, APIs, and test utilities intentionally small and purpose-driven.
- Before adding a new file, helper, or test, check whether the existing structure can be simplified instead.
- Do not add or keep minimum compatibility layers/wrappers just to preserve old structure; simplify directly unless compatibility is explicitly required.

## Formatting And Lint Hygiene

- Treat formatter/lint diagnostics as part of done criteria for touched files.
- If diagnostics include Prettier import/object/JSX reflow suggestions (for example: `Replace ... prettier/prettier`), apply those formatting fixes before finalizing.
- Prefer running ESLint with fix for touched frontend files when formatting diagnostics are present.
- After edits, re-check diagnostics for all changed files and resolve remaining actionable issues.
- Do not add blanket file-level disables such as `/* eslint-disable ... */` unless there is no viable structural fix.
- If a lint disable is truly unavoidable, keep it scoped to the smallest possible line/block and add a short reason.

## Import Placement

- Keep all `import` statements at the top of the file.
- Do not place `import` statements inside functions, conditionals, loops, or mid-file blocks.
- Prefer static top-level imports over dynamic imports unless lazy-loading behavior is explicitly required.

## Type Safety

- Keep `noImplicitAny` behavior enforced and avoid introducing implicit `any` values.
- Prefer typed callback params and typed state/action payloads over inference that degrades to `any`.

## Testing Expectations

- Add or update relevant automated tests for behavior changes and bug fixes; do not rely only on manual verification.
- Prefer small, focused unit tests for utility/business logic and component tests for UI behavior.
- Include snapshot tests for stable, user-facing UI structure when layout/markup changes are part of the task.
- When snapshots change intentionally, review and keep them only when they represent the expected UI output.
- For changes that affect interaction-heavy UI (editing, scrolling, suggestions, drag/drop, routing), run a quick devtools-style hotspot audit: identify the worst callback/long task and patch the highest-impact offender in the same task when feasible.
- For frontend behavior changes, validate both functionality and performance:
  - functionality: run automated tests relevant to touched features and at least one end-to-end user flow smoke check (manual or automated) covering create/edit/delete and navigation paths touched by the change.
  - performance: verify no new repeated long-task warnings, no `Maximum update depth exceeded`, and no unstable external-store snapshot loops before finalizing.
- If full UI automation is not yet available for a touched workflow, explicitly report that gap and add/adjust the closest component-level or integration test in the same change.

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

## Reusable Placement And Boundaries

- Keep a clear distinction between feature-specific code and shared cross-feature code.
- If logic is reused across pages/features, move it to shared locations instead of leaving it in a feature folder.
- Shared input building blocks belong in `src/components/common/inputs/`.
- Markdown-related components/utilities belong in `src/components/common/markdown/`.
- Dropdown-related components belong in `src/components/common/dropdowns/`.
- Shared cross-feature hooks belong in `src/hooks/`.
- Store-derived data hooks/selectors should live in `src/hooks/` (not `src/data/`) unless they are persistence/IO concerns.
- Feature folders (for example `src/components/notes/`) should only contain logic primarily owned by that feature.
- Do not mix unrelated concerns in one file just to add features faster; split by responsibility first.

## Folder Creation Policy

- It is OK to create new folders when needed to isolate and group functionality.
- Prefer adding focused folders (for example `inputs`, `hooks`, `selectors`) over growing mixed-purpose files.
- Create folders when it improves discoverability, reuse, and ownership boundaries.
- Group by functionality first (for example one markdown folder, one dropdown folder) so related behavior is easy to find.

## Naming And File Placement Convention

- Use one consistent naming convention across the repo.
- Folder names: lowercase, short, and purpose-based (`common`, `notes`, `inputs`, `hooks`).
- React component files: PascalCase (for example `TokenInputField.tsx`).
- Hook files: `use` prefix + PascalCase stem (for example `useTokenSuggestionController.tsx`).
- Utility files: descriptive camelCase (for example `tokenSuggestions.tsx`).
- Do not add the `Common` prefix to file names by default. Prefer direct names like `Button`, `Dialog`, `Tabs`, `Sonner`.
- Avoid feature-prefixed names for shared files (for example use `SuggestionsDropdown`, not `NotesSuggestionsDropdown`).
- Use stable naming and placement over time; avoid mixing equivalent names/locations for the same kind of artifact.
- Framework-required special files (for example route files like `__root.tsx`) may keep framework naming.
- For legacy lowercase component wrapper files already in the codebase, prefer normalizing to PascalCase only in dedicated rename tasks; do not introduce new lowercase component filenames.

## Move/Rename Hygiene

- When moving or renaming a file, remove the old file in the same change.
- Update all imports/references in the same change so there is only one active source of truth.
- Do not leave duplicate implementations behind after extraction/migration.

## Extension Convention

- Use `.tsx` for all TypeScript files under `src/` and `tests/` (components, hooks, utilities, data, tests).
- Do not introduce new `.ts` files in `src/` or `tests/`.

## Documentation Requirements

- Add concise TSDoc comments above every exported component, hook, and utility function.
- For non-trivial internal helpers, add a short comment describing purpose and boundaries.
- Keep docs focused on intent and usage, not line-by-line narration.

## Panel Naming And Sidebar Structure

- For sidebar UI components, use names suffixed with `Panel`.
- Prefer dedicated panel components for sidebar sections instead of embedding all sidebar markup directly in parent view components.
- Keep panel logic scoped to the panel component where practical (filters/state wiring/render blocks).

## Naming Consistency

- Keep naming consistent for note-domain UI components; prefer `Notes*` names over mixing `Note*` and `Notes*` at the same architectural level.
- Avoid reintroducing retired names (for example `Capture*`) once a new naming direction is chosen.
- For shared cross-feature input building blocks (for example details editors used in notes and map), prefer generic names (for example `DetailsField`) over feature-prefixed duplicates.

## Button Usage

- Use the premade button components from `components/common/Button.tsx` instead of calling `buttonClass()` directly.
- Available components: `Button` (general, supports `variant` and `size` props), `IconButton` (ghost icon, always square with `shrink-0` and `type="button"` built in), `BrassButton` (accent primary action), `GhostButton` (secondary/cancel action).
- Do not reach for `buttonClass()` for new code. If an exact combination is not covered by a premade component, add a new variant to `components/common/Button.tsx` rather than using the raw function.
- `IconButton` has `type="button"` and `shrink-0` built in — never pass these explicitly at the call site.

## Markdown Support

- Use `MarkdownEditor` from `common/markdown/MarkdownEditor.tsx` wherever users write markdown text (note body, details fields). It includes a toolbar and live preview toggle.
- Use `DetailsField` from `common/inputs/DetailsField.tsx` for all user-editable details inputs (notes, todos, map cell details, and similar forms) so behavior stays consistent.
- Map cell editing panels must use `DetailsField` for the cell-details input instead of bespoke textarea/editor wiring.
- Use `MarkdownPreview` from `common/markdown/MarkdownPreview.tsx` to render stored markdown in read-only contexts (note detail views, map cell previews).
- Do not reach for raw `ReactMarkdown` + `remarkGfm` inline in components — always use these shared wrappers.

## Suggestions UX

- Keep token suggestions centralized through shared notes suggestion helpers/components; avoid per-field custom suggestion renderers.
- Suggestions must support `@` room tokens, `#` tag tokens, and `!` type tokens anywhere the shared details/title suggestion UX is used.
- Suggestion dropdowns must support keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Tab`, `Escape`) in addition to mouse selection.

## Hook Complexity

- If a hook returns more than 4–5 values or takes more than 4–5 parameters, consider splitting it.
- Prefer named, focused hooks (one purpose each) over large aggregate hooks.
- When `useMemo` chains are complex, add short comments explaining what each memo computes and why.
- Prefer inlining trivial `useMemo` calls in the component body over extracting them into a hook with a long parameter list.
- Avoid adding `useMemo` by default. Use it only when a value is demonstrably expensive to recompute, or when a stable reference is required for a memoized child or effect dependency. Prefer plain computation, module constants, or derived selectors first.
- Avoid `setState` when the value is purely derived from props or can live in a ref/controlled DOM element without changing render output. In hot UI paths, keep state as local and minimal; prefer refs for transient cursor/selection data and uncontrolled inputs only when that measurably reduces rerenders.

## Infinite Loop Prevention

- Treat potential render/update loops as release-blocking defects; do not ship code that can trigger `Maximum update depth exceeded`.
- Before merging hook/component state changes, verify that effects cannot write state from unstable dependencies that change every render.
- Reducers and state setters must be idempotent for no-op updates: if the next value is equal to current state, return/keep current state.
- Avoid selector patterns that allocate new objects on every render in frequently mounted boundaries; prefer stable selectors or separate primitive/array selectors.
- When introducing context providers at app boundaries, ensure provider values are stable and that consumers do not subscribe to alternate fallback stores during normal provider usage.
- After state-management refactors, run a quick runtime sanity check for repeated rerenders or loop warnings in addition to lint/build.

## Structural Simplicity

- Prefer fewer div layers. Before wrapping in a new `<div>`, check if the existing parent container can receive the needed class instead.
- Avoid wrapping a single child in a structural div that adds no layout behavior — remove it and apply the class directly.
- Regularly review components for redundant container elements after refactors.

## Duplication Reduction

- When the same or highly similar logic appears in more than one feature/component, refactor it into a shared generic hook/component/file.
- Avoid copy-pasting suggestion wiring, derived selectors, or repetitive field controllers across panels; centralize the behavior once and reuse it.
- Keep files focused and reasonably sized; if a file starts mixing unrelated concerns, split by responsibility before adding more logic.

## Panel Visual Rules

- Avoid adding decorative inner borders inside existing panel containers (for example inside `page-layout-panel`).
- Prefer spacing, typography, and subtle background contrast over nested bordered boxes within panels.
- Avoid boxed/bordered styling for every list item by default (for example map room note rows). Use borders only when they communicate state or interaction, not as baseline decoration.

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
