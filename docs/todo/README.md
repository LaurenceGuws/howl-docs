# Howl Docs Todo

## Current Priority

### Tree widget cleanup

- [~] Keep the tree widget simple and intuitive before pursuing richer custom
      geometry.
      - Current direction:
        - the panel has been simplified back toward a conventional nested
          navigation list
        - custom connector-heavy geometry has been deliberately scaled back
      - Remaining work:
        - refine the active/focus path treatment
        - verify the simpler panel reads well across real project corpora
      - Authority:
        - [../../app_architecture/ui/TREE_WIDGET.md](../../app_architecture/ui/TREE_WIDGET.md)

### Full-text search

- [x] Add a separate ripgrep-backed header search instead of overloading the
      sidebar tree filter.
      - Sidebar input remains path/tree filtering only.
      - Header search now streams local `rg` hits into a modal result list.
- [ ] Polish search-hit navigation so focusing a result in the rendered viewer
      is more exact than first-match term highlighting.
- [ ] Decide what the hosted/pages story should be for full-text search.
      - Current behavior is local-dev only via `howl_docs.py`.

### Theme and shell cleanup

- [~] Keep the shell theme system token-driven instead of letting component CSS
      grow local one-off surfaces.
      - Outer shell/header/pane/control/viewer materials now derive much more
        cleanly from `theme.css`.
      - Remaining work: continue removing component-local background formulas
        when a named theme token would be clearer.
- [ ] Audit and standardize stateful visual semantics.
      - Repeated active/selected/highlight visuals should become semantic theme
        tokens before they spread across component CSS.
      - Use `app_architecture/CONVENTIONS.md` as authority.
- [ ] Audit dark/light drift through theme tokens first and component rules
      second.
- [x] Keep project config limited to base palette overrides.
      - Derived shell/control/viewer materials remain CSS-owned.
      - Do not expand config into per-component styling knobs by default.
- [ ] Keep the app header intentionally small and shell-level.
      - Avoid turning it back into a document breadcrumb/navigation bar.

### State foundation

- [~] Introduce a dedicated app-state module instead of storing behavior across
      `main.js`, DOM attributes, and `localStorage` calls.
      - `ts/state.ts` now owns the first persistence/default boundaries.
      - Remaining work: options/search/current-doc state transitions still need
        a cleaner shared model and less direct DOM orchestration.
- [ ] Define a clear state shape for:
      - current doc
      - theme
      - sidebar width
      - sidebar collapsed state
      - options menu state
      - search query
      - document header/load state
      - tree filter/active state
      - viewer body render state
- [ ] Centralize persistence reads/writes behind a small state/persistence boundary.
- [ ] Keep typing work sequenced after the module/state split.
      - First stabilize module boundaries and state ownership.
      - Then keep TypeScript aligned to those stable boundaries.
      - Avoid using types to justify muddled ownership.

### Module refactor

- [~] Split the old `main.js` monolith into concern-owned modules.
      - app startup
      - layout/sidebar controls
      - options/menu controls
      - state/config wiring
      - Current extraction landed:
        - `ts/app.ts`
        - `ts/shell/app_shell.ts`
        - `ts/docs/doc_controller.ts`
        - `ts/docs/doc_routing.ts`
        - `ts/docs/doc_render_cycle.ts`
        - `ts/config.ts`
        - `ts/state.ts`
        - `ts/tree/tree_state.ts`
        - `ts/docs/view_state.ts`
        - `ts/docs/viewer_state.ts`
        - `ts/layout.ts`
        - `ts/options_menu.ts`
      - Remaining work:
        - keep `ts/docs/doc_controller.ts` as assembly only
        - continue shrinking cross-module DOM assumptions
- [ ] Standardize markup injection ownership.
      - The repo currently uses several HTML/SVG injection rules.
      - Define when string markup, template parsing, and direct SVG injection
        are acceptable instead of letting each subsystem invent its own rule.
- [ ] Standardize event-listener ownership.
      - Long-lived feature installs should follow one disposer-based rule.
      - Global listeners should remain controller-owned.
- [x] Rename the source tree from `js/` to `ts/` and group modules by concern.
      - `docs/`, `tree/`, `theme/`, `shell/`, and `shared/` now own the main
        source boundaries.
- [x] Split tree and shell internals so concern folders are structural, not
      cosmetic.
      - `ts/tree/` now separates model, markup, state, and DOM orchestration.
      - `ts/shell/` now separates DOM lookup, icon injection, and shell boot.

### Config-driven identity

- [~] Move project identity into config instead of code/CSS edits.
      - Title/icon/default doc already live in
        `app_architecture/docs_browser/project.howl-docs.json`.
      - Brand-level light/dark palette overrides now live there too.
      - More shell/control/viewer surface behavior now derives from those base
        palette tokens.
      - Repo fetch base path now lives there too.
      - Remaining work: decide how far config should go beyond palette/base
        tokens without turning the tool into a per-project styling DSL.
      - Remove the generic `ide` wordmark fallback from multi-project headers.
      - Define a neutral shared fallback for projects that do not yet have a
        strong icon/branding asset instead of synthesizing sloppy branding in
        runtime code.
- [x] Split `styles/base.css` by concern.
      - `base.css` is now the import root.
      - `theme.css`, `shell.css`, `tree.css`, `controls.css`,
        `viewer.css`, and `responsive.css` now own the main style boundaries.

### Python vs JS ownership

- [ ] Keep `howl_docs.py` minimal and document the rule that Python is only
      for serving and optional generation tasks.
- [ ] If doc-index generation is automated, add a separate generation script
      rather than bloating the launcher.

## Nice To Have

- [ ] Keyboard escape to close options menu.
- [ ] Persist expanded tree folders.
- [ ] Better iconography for controls.
- [ ] Auto-generate `app_architecture/docs_browser/docs-index.howl-docs.json`.
- [x] Add support for multiple project configs.
- [ ] Add a short local style-guide note for shell materials so future UI work
      does not reintroduce per-widget background drift.

## Deliberately Deferred

- [ ] Framework migration.
- [ ] Search indexing beyond simple path filtering.
- [ ] Rich YAML-specific rendering.
