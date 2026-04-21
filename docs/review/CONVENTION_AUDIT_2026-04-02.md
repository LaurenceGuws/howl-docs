# Convention Audit

Date:
- 2026-04-02

Scope:
- documented conventions
- enforced conventions
- implicit conventions already present in code
- places where one concern is still implemented in multiple ways

## Summary

The repo is improving, but convention authority was still too implicit.

Good news:
- the style/token convention is now partially enforced by tests
- the runtime theme-switch path now has a real headless regression check
- project/runtime path cleanup already established a stronger single-path rule

Remaining gap:
- several conventions were real in spirit but not written down clearly enough
- some shared concerns are still implemented through multiple local patterns

## Newly Explicit Conventions

The following conventions are now explicit repo rules:

- component styling must be token-driven
- project manifests own base palette identity only
- repeated visual semantics belong in `styles/theme.css`
- runtime selection behavior should prefer one explicit path
- raw DOM ownership should remain narrow and concern-owned

Authority:
- `app_architecture/CONVENTIONS.md`
- `docs/hygiene/TESTING_STRATEGY.md`

## Existing Conventions That Were Present But Under-documented

### 1. Theme ownership split

Already present in practice:
- project config sets base palette values
- CSS owns derived materials and interaction surfaces

Needed action:
- keep this written as an explicit repo rule
- continue testing it through convention checks

### 2. Narrow DOM ownership

Already present in practice:
- shell DOM lookup, viewer mounting, tree mounting, and options/search wiring
  already live in bounded seams

Needed action:
- document the allowed seams explicitly
- avoid reintroducing ad hoc DOM queries elsewhere
- now partially enforced through grep-style ownership tests

### 3. Single-path runtime behavior

Already present in cleanup direction:
- `?project=` became the explicit project-selection path
- search fallback removal followed the same philosophy

Needed action:
- keep this as a reusable repo convention, not only a search/config decision
- controller/config ownership for history changes is now explicit and enforced

## Areas Where One Concern Is Still Implemented In Multiple Ways

### 1. HTML/markup injection patterns

Observed patterns:
- state-driven `innerHTML` assignment in viewer/render helpers
- template parsing in markdown post-processing
- string-built option/result markup in shell/search/tree code
- direct SVG/diagram injection in icon and mermaid code

Why this matters:
- the code has more than one markup ownership pattern already
- not all of these are wrong, but the repo lacks a clear rule for when each is
  acceptable

Needed convention:
- define allowed markup injection categories and their owners
- now documented in `app_architecture/CONVENTIONS.md`
- `innerHTML` ownership is now restricted to named files and can be checked
  statically

### 2. Event listener ownership patterns

Observed patterns:
- disposer-returning feature installs
- direct one-off event listeners in subsystem files
- controller-owned global listeners

Why this matters:
- this is trending in the right direction, but still not formalized enough

Needed convention:
- all long-lived feature installs should return disposers
- global listeners should be controller-owned
- now documented in `app_architecture/CONVENTIONS.md`

### 3. Stateful highlight/active semantics

Observed patterns:
- tree active path uses tree semantic tokens
- search active/highlight now uses search semantic tokens
- some component border/hover/selection states still use local token formulas

Why this matters:
- the direction is good, but the repo still needs a clearer “stateful visual
  semantics become tokens first” rule

Needed convention:
- add semantic tokens before repeating stateful visual formulas across
  components

## Recommended Next Actions

1. Keep `app_architecture/CONVENTIONS.md` as the repo convention authority.
2. Expand convention tests for:
   - semantic token usage in more stateful UI rules
   - markup/runtime ownership where practical
3. Write one focused convention for markup injection ownership.
4. Write one focused convention for event-listener/disposer ownership.
5. Continue reducing places where repeated stateful UI formulas live directly in
   component CSS.
