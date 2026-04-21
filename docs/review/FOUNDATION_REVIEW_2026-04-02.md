# Howl Docs Foundation Review

Date: 2026-04-02

Scope:
- architectural correctness
- implementation determinism
- single-path behavior
- cleanup readiness before further feature expansion

Standard:
- behavior should follow one clear path
- ownership should be explicit
- compatibility fallbacks should be minimized
- the codebase should become easier to reason about after each change, not more flexible in hidden ways

## Summary

The codebase is in a much better place than it was at the start of the
foundation pass.

Resolved foundation items:
- document-load determinism is fixed
- tree DOM ownership is local instead of document-global
- project selection now follows one explicit browser-facing contract
- launcher root redirect and request-time manifest rewriting are gone
- project runtime lives in app-owned state
- project switching is controller-owned and supports in-place runtime
  rebootstrap
- Python is no longer part of the product search path
- generic product-specific branding synthesis has been removed

The repo is now good enough to treat as a cleaner base for product work.

The remaining foundation-level gaps are narrower:
- the state layer is still a mutable bag with feature-local orchestration
- review/plan authority is improved, but still spread across several docs

## Findings

### 1. Resolved: document loading is deterministic under rapid navigation

Files:
- `ts/docs/viewer.ts`
- `ts/docs/doc_render_cycle.ts`

Current state:
- document loads now use explicit latest-request ownership
- stale loads no longer overwrite newer viewer state

Why this matters:
- current document state now follows routing state instead of timing races

### 2. Resolved: project selection follows one explicit browser-facing contract

Files:
- `ts/config.ts`
- `howl_docs.py`

Current state:
- `?project=` is the only steady-state browser selection contract
- bare routes canonicalize to the built-in project id
- invalid project ids fail explicitly instead of silently falling back

Why this matters:
- project selection no longer depends on hidden compatibility branches

### 3. Resolved enough: launcher/runtime ownership is minimal enough for the current product path

Files:
- `howl_docs.py`

Current state:
- Python no longer rewrites manifests at request time
- Python no longer owns project-selection redirects
- launcher responsibility is now mostly transport plus local-dev registry
  exposure

Residual risk:
- do not let richer product metadata drift back into the launcher

### 4. Resolved enough: project-aware state is now first-class runtime state

Files:
- `ts/state.ts`
- `ts/shared/types.ts`
- `ts/app_controller.ts`

Current state:
- selected project id, registry entries, and loaded project runtime now live in
  app-owned state
- project switching and `popstate` share the same controller-owned transition
  path

Residual risk:
- the state model is still lighter than a fully explicit transition system

### 5. Medium: the current state layer is still mostly a mutable bag

Files:
- `ts/state.ts`
- `ts/docs/doc_render_cycle.ts`
- `ts/search/doc_search.ts`

Problem:
- the repo now has much better ownership than before, but state transitions and
  DOM reactions still live across several modules
- naming is cleaner than the actual architecture underneath it

Why this matters:
- this is now the main remaining architectural softness in the browser runtime

Required direction:
- keep future work moving toward clearer feature-local transition ownership
- avoid adding new ad hoc state branches without controller ownership

### 6. Resolved: tree behavior no longer uses document-global DOM coupling

Files:
- `ts/tree/tree.ts`

Current state:
- active-link syncing is scoped to the tree root it owns

Why this matters:
- tree behavior is now a better-contained widget seam

### 7. Resolved enough: search state now has one explicit product path

Files:
- `ts/search/doc_search.ts`
- `app_architecture/docs_browser/STATIC_SEARCH.md`

Current state:
- spotlight search is now static-index-only
- projects without a search index show explicit unavailable state
- recall-first behavior is regression-checked against `rg` on the repo-local
  corpus

Residual risk:
- search quality and layout polish still remain, but those are execution-plan
  items, not foundation blockers

### 8. Resolved enough: browser-facing branding fallback is now explicit

Files:
- `ts/docs/view_state.ts`
- `ts/shared/branding.ts`
- project manifests

Current state:
- generic runtime phrase synthesis is gone
- blank or missing `brandWordmarkText` renders no prefix
- blank or missing `icon` falls back to the shared neutral icon
  `./assets/icons/folder.svg`

Why this matters:
- multi-project navigation is now product-facing
- fallback behavior no longer depends on hidden runtime wording assumptions

### 9. Medium: review and execution authority is improved, but still distributed

Files:
- `docs/hygiene/FOUNDATION_TODO.md`
- `docs/hygiene/TESTING_STRATEGY.md`
- `app_architecture/CONVENTIONS.md`
- `app_architecture/docs_browser/SEARCH_EXECUTION_PLAN.md`

Problem:
- the repo now has real authority docs
- but “where to look first” still depends on the type of work rather than one
  single operational dashboard

Why this matters:
- this is manageable now, but still a hygiene concern if the doc set grows

Required direction:
- keep authority docs small and sharply scoped
- avoid creating overlapping “master” docs that just duplicate them

## Recommended Next Step

Do not start another broad review loop.

The foundation pass should now close through execution discipline:
- keep `FOUNDATION_TODO.md` accurate
- treat `CONVENTIONS.md` and `TESTING_STRATEGY.md` as hard gates
- continue product work without reopening compatibility fallbacks or hidden
  alternate paths
