# Repository Conventions

Status:
- active implementation authority
- complements `docs/hygiene/TESTING_STRATEGY.md`

## Purpose

Keep the codebase on one clear implementation path.

Conventions in this repo are not optional style preferences.
They exist to preserve:
- deterministic behavior
- explicit ownership
- reusable abstractions
- low-ambiguity implementation choices

If a convention matters, it should be:
- documented here or in a focused design doc
- enforced by tests where practical

## Core Rules

### Single-path behavior

- Avoid compatibility fallbacks when they hide the real product path.
- Prefer one explicit runtime contract over multiple equivalent entry paths.
- Invalid inputs should fail explicitly rather than silently falling back.

### Explicit ownership

- Each subsystem should have a clear owner for state, rendering, and side
  effects.
- Do not split one feature's behavior across several ad hoc patterns when a
  shared controller or helper already exists.
- Do not re-implement existing repo behavior locally when the concern already
  has an owner.

### Abstraction before duplication

- If the same semantic concern appears in multiple components, introduce a
  shared token, helper, or documented pattern instead of cloning the logic.
- Do not allow four subtly different implementations of the same UI or runtime
  rule to grow in parallel.

## Style System Conventions

### Theme ownership

Theme ownership is split into two layers:

- project manifests own base palette overrides
- `styles/theme.css` owns derived semantic/material tokens

Project manifests may set:
- `bg`, `bg2`
- `panel`, `panel2`, `panel3`
- `ink`, `muted`
- `line`, `lineSoft`
- `accent`, `accentSoft`, `accentStrong`
- `activeLink`
- `code`
- `treeActive`

Component styles should consume semantic tokens.
They should not invent project-colored values locally.

### Token-driven component styling

Outside `styles/theme.css`:

- do not use raw hex/rgb/rgba color literals
- do not hardcode project-colored values
- do not add one-off local formulas when a named semantic token should exist

Allowed:
- `var(--...)` token usage
- `color-mix(...)` only when it derives from existing semantic tokens

Required rule:
- repeated or stateful visual semantics must become named tokens in
  `styles/theme.css`

Current examples:
- tree active visuals use tree semantic tokens
- search result highlight and active rail use search semantic tokens

## DOM and Runtime Conventions

### DOM ownership

Raw DOM ownership should remain narrow.

Current allowed direct DOM seams:
- `ts/shell/shell_dom.ts`
- `ts/shell/shell_icons.ts`
- `ts/tree/tree.ts`
- `ts/docs/viewer.ts`
- `ts/options_menu.ts`

Outside those seams:
- prefer state/controller/render helpers
- avoid ad hoc global DOM queries

Allowed document-level query owners:
- `ts/shell/shell_dom.ts`
- `ts/main.ts`

Allowed document-level listener owners:
- `ts/options_menu.ts`
- `ts/search/doc_search.ts`

Allowed window-level listener owners:
- `ts/app_controller.ts`
- `ts/docs/doc_routing.ts`

### State and controller ownership

- App/runtime transitions should go through the app/controller path, not
  scattered UI-owned navigation.
- Feature state should not be split between app state and feature-local mutable
  bags unless the split is deliberate and documented.

Persistence ownership rule:
- `localStorage` access belongs in `ts/state.ts`

History ownership rule:
- `history.pushState` and `history.replaceState` belong only in:
  - `ts/app_controller.ts`
  - `ts/config.ts`

## Testing Expectations

Conventions should be enforced in layers:

- static convention tests for structural/style rules
- runtime headless tests for behavior that must be true in the browser

Current enforced examples:
- component styles must stay token-driven
- tree active state must use semantic tokens
- search highlight states must use semantic tokens
- project theme switching must clear stale overrides
- runtime feature installers must return disposers
- document/window listener ownership stays within named seams
- `localStorage` ownership stays in `ts/state.ts`
- history ownership stays in `ts/app_controller.ts` and `ts/config.ts`
- document-level DOM queries stay in named seams

## Current Audit Findings

The following conventions were already present in practice and are now made
explicit:

- token-driven component styling
- project manifests own only base palette identity, not per-component theming
- app/runtime selection should follow one explicit path
- DOM ownership should remain narrow and concern-owned

The following areas still need stronger standardization:

- search/viewer highlight semantics were previously implemented with local
  accent usage and have now been unified behind semantic tokens
- tree active geometry still uses a special-case approximation and needs a more
  explicit row-owned grammar
- DOM markup injection still appears through several subsystem-specific
  patterns and should be reviewed for clearer shared rules

## Markup Injection Conventions

Markup injection is allowed only in these categories:

- trusted generated viewer HTML owned by the markdown/render pipeline
- trusted vendor-rendered HTML/SVG owned by dedicated seams
  - syntax highlighting
  - Mermaid rendering
  - static shell icon SVG injection
- small state-driven UI markup owned by a focused render surface
  - tree markup
  - search results
  - project switch options

Required rule:
- each injection path must have a clear owner
- avoid inventing a new markup injection pattern when an existing category
  already fits
- if a new injection path is needed, document which category it belongs to
- `innerHTML` usage is restricted to explicit owner files

Current `innerHTML` owner files:
- `ts/docs/viewer_state.ts`
- `ts/docs/highlight.ts`
- `ts/docs/mermaid.ts`
- `ts/docs/markdown.ts`
- `ts/shell/shell_icons.ts`
- `ts/tree/tree.ts`
- `ts/shell/app_shell.ts`
- `ts/search/doc_search.ts`
- `ts/docs/view_state.ts`

Do not:
- scatter ad hoc `innerHTML` writes across general control logic
- mix trusted-render and arbitrary-string injection under the same unclear seam

## Event Listener Conventions

Listener ownership should follow one clear rule:

- long-lived feature installs must return a disposer
- controller-owned global listeners stay in controller/bootstrap seams
- feature-local listeners may stay in the owning feature install, but they must
  be removable through that install's disposer

Current intended pattern:
- `install*` runtime features return `Dispose`
- app/controller owns installation and teardown sequencing

Do not:
- attach long-lived listeners without a cleanup path
- let global listeners spread across arbitrary feature modules
