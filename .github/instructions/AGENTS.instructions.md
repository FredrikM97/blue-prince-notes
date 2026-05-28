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

## Instruction Maintenance

- Continuously update this instructions file when the user provides new project-wide preferences that should persist.
- When new guidance is reusable across files, add or adjust rules in this file in the same task, not later.
- Keep instruction updates concise and non-conflicting with existing rules.
