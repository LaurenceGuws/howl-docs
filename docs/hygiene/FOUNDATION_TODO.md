# Foundation Todo

Source review:
- `docs/review/FOUNDATION_REVIEW_2026-04-02.md`

Standard:
- deterministic behavior
- single-path runtime contracts
- explicit ownership
- simpler code after each cleanup pass
- test strategy authority:
  - `docs/hygiene/TESTING_STRATEGY.md`
- convention authority:
  - `app_architecture/CONVENTIONS.md`

## Phase 1

- [x] Make document loading deterministic.
      - Add request identity or abort-based cancellation for doc fetches.
      - Only the latest navigation may commit ready/error viewer state.
      - Loading/ready/error now commit through a single document-view transition
        layer instead of separate chrome/viewer render paths.
      - Authority:
        - `ts/docs/viewer.ts`
        - `ts/docs/doc_render_cycle.ts`

- [x] Remove document-global DOM coupling from tree behavior.
      - Scope active-link syncing to the tree root instead of `document`.
      - Authority:
        - `ts/tree/tree.ts`

- [~] Keep current local search honest while replacing it.
      - Do not invest in deep `rg` polish as if it were the long-term product.
      - The old local ripgrep fallback has now been removed from runtime search
        behavior so search architecture is no longer ambiguous during
        implementation.
      - Current search behavior is static-index-only.
      - Authority:
        - `ts/search/doc_search.ts`
        - `howl_docs.py`

## Phase 2

- [x] Collapse project selection to one authoritative browser-facing contract.
      - `?project=` is now the only steady-state selection path.
      - Raw `?config=` selection has been removed from steady-state browser
        behavior.
      - Launcher-owned root redirect has been removed.
      - Bare routes are canonicalized to `?project=howl-docs`.
      - `?project=<id>` must resolve explicitly or fail explicitly; it no
        longer falls back silently to the default project.
      - Authority:
        - `ts/config.ts`
        - `howl_docs.py`

- [x] Reduce launcher-owned manifest rewriting.
      - Manifest request-time rewriting has been removed from Python.
      - Remaining browser normalization is explicit in `ts/config.ts`.
      - Authority:
        - `howl_docs.py`
        - `ts/config.ts`

- [x] Introduce explicit project-aware browser state.
      - Selected project id
      - available project ids
      - loaded project runtime (`config` + `docs`) now lives in app state
      - runtime install/start sequencing now lives behind an explicit app
        controller instead of being coordinated directly in `ts/app.ts`
      - project switching is now controller-owned rather than shell-owned UI
        navigation logic
      - installed runtime features now expose teardown seams via disposer-style
        install paths, which makes future in-place project transitions
        technically possible instead of leaking listeners across reloads
      - project switching now performs an in-place runtime rebootstrap instead
        of requiring full-page navigation
      - browser `popstate` navigation now uses the same app-owned project
        transition path
      - registry/runtime model ownership still needs to become more explicit
      - Authority:
        - `ts/state.ts`
        - `ts/shared/types.ts`
        - `ts/app.ts`

- [x] Replace local ripgrep search with a static-bundle search architecture.
      - Build-time search index generation now exists.
      - Hosted/pages-capable runtime search behavior now exists.
      - Python search has been removed from the product path.
      - Spotlight search remains the stable product surface while the backend
        is now static-index-driven.
      - Matching is now recall-first and regression-checked against `rg` on the
        repo-local indexed corpus.
      - Remaining search work is product quality work tracked in
        `app_architecture/docs_browser/SEARCH_EXECUTION_PLAN.md`, not a
        foundation architecture blocker.
      - Authority:
        - `app_architecture/docs_browser/STATIC_SEARCH.md`

## Questions

- [x] Finalize the branding fallback contract.
      Current state:
      - runtime no longer synthesizes generic `ide Howl Docs` header text
      - project title is authoritative
      - blank or missing `brandWordmarkText` renders no prefix
      - blank or missing `icon` falls back to the shared neutral icon
        `./assets/icons/folder.svg`
      Authority:
        - `ts/docs/view_state.ts`
        - `ts/shared/branding.ts`
        - `app_architecture/docs_browser/CONSUMER_CONTRACT.md`

- [x] Confirm that repo-local docs-browser manifests belong in
      `app_architecture/docs_browser/`.
      Current state:
      - the old `config/` role has been removed
      - runtime defaults and docs now point at the `app_architecture/docs_browser/`
        layout
      - no stronger alternative layout has emerged during the cleanup pass
      - treat this as the steady-state repo-local docs-browser location unless
        a future docs architecture review explicitly replaces it
