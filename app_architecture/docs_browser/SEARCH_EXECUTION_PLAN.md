# Search Execution Plan

Status:
- active execution plan
- follows `STATIC_SEARCH.md`

## Goal

Deliver a browser-only docs search experience that:
- feels immediate on real project corpora
- behaves the same in local-dev and hosted mode
- keeps the spotlight widget as the stable product surface
- is simple enough to reason about and evolve without reintroducing ambiguity

## End State

We should end up with:

- generated static search index artifacts for supported projects
- browser-only search runtime with no Python product-path dependency
- deterministic recall-first matching rules documented in-repo
- explicit search states for loading, unavailable, empty, and error
- keyboard-first result navigation
- a view-centered search bar layout rather than a top-bar-hugging dropdown

## Product Direction

### Search surface

The current search button + modal is transitional structure, not the final
layout.

Target direction:
- search remains toggle-driven
- the widget becomes view-centered in the content area
- the bar should feel like a spotlight / command-palette surface
- the top bar should launch search, not visually contain the search experience

This means the final visual center of gravity should move away from the header
and toward the viewer plane.

## Phases

### Phase 1: Runtime correctness

Goals:
- static search index loads as part of project runtime
- search works without Python endpoints
- missing index produces explicit unavailable state

Exit criteria:
- every supported project either has a generated index or clearly shows search
  unavailable
- no runtime fallback path muddies behavior

### Phase 2: Relevance quality

Goals:
- recall stays close to indexed-corpus `rg` expectations
- snippets are readable and stable
- ordering remains deterministic and simple

Work:
- compare recall against `rg` for representative queries
- simplify matching so broad terms do not lose valid matches too early
- add explicit field filters before adding heavier implicit ranking

Exit criteria:
- common targeted queries return obviously useful hits across
  `howl-docs`, `zide`, `zbar`, `wayspot`, and `cwatch`
- broad literal queries do not silently under-recall relative to the indexed
  corpus

### Phase 3: Responsiveness and feedback

Goals:
- search feels immediate under normal project sizes
- feedback states are clear while typing

Work:
- reduce per-query work
- precompute more at build time if needed
- consider worker isolation if main-thread responsiveness is not good enough

Exit criteria:
- typing does not visibly stall the UI
- result/state updates feel immediate enough for a spotlight interaction

### Phase 4: Spotlight layout

Goals:
- search surface is view-centered
- top bar acts as launcher only
- result list and status read as one focused search workspace

Work:
- move the active widget away from header-attached positioning
- make overlay sizing/layout work against the viewer plane
- keep keyboard flow unchanged while layout evolves

Exit criteria:
- no top-bar-hugging search layout remains
- the search surface reads as a centered view overlay, not a dropdown control

## Acceptance Criteria

Search should be considered “good enough” when:

- the correct project index is always used
- missing index state is explicit
- common title/path queries feel instant
- common heading/body queries feel predictably matched
- broad literal queries behave closer to `rg` expectations on the same indexed
  docs
- keyboard navigation is reliable
- the spotlight layout is centered and visually self-contained

## Non-Goals For Now

- full fuzzy-finder parity with `fzf`
- perfect grep-grade recall on massive corpora
- advanced query syntax
- chunked index sharding before relevance problems justify it

## Immediate Next Step

Implement Phase 2 deliberately:
- add recall fixtures against `rg` for representative queries
- simplify the matcher toward recall-first deterministic behavior
- tune snippets against the current five active projects
- only then start the layout shift toward the view-centered spotlight
