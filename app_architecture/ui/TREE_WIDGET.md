# Tree Widget Design

## Goal

Make the docs tree read like a deliberate hierarchy widget rather than a loose
list of folders with decorative rails.

The target visual reference is closer to a terminal/process tree:

- each row owns its own connector geometry
- vertical rails read as continuity between rows
- horizontal elbows read as explicit joins into child rows
- active path highlighting follows the actual branch path instead of painting
  whole containers

## Current Direction

The current implementation is in transition.

What is already true:

- the tree is rendered from explicit state
- folders/files are rendered from a tree model, not from ad hoc DOM mutation
- active path and expanded paths are explicit state
- connector and hover colors are token-driven through
  [theme.css](../styles/theme.css)
- the tree has been simplified back toward a conventional nested navigation
  panel instead of pursuing bespoke connector geometry too early

What is still weak:

- the active branch/focus path still needs a calmer final visual treatment
- the current panel is intentionally simpler, but not yet polished
- if we revisit richer connector geometry later, it should be justified by real
  UX value rather than customness

## Desired Geometry Model

The current preferred model is:

1. folders and files read like a simple nested navigation list
2. indentation and one branch rail are enough to explain hierarchy
3. active state should be obvious without decorative geometry
4. complexity should stay low until a stronger UX need is proven

That means the design should avoid:

- pseudo-graph drawing that adds more code than clarity
- multiple connector grammars for open vs closed state
- container-owned hacks that are hard to reason about
- custom geometry pursued for novelty rather than usability

## Ownership

Design ownership is split like this:

- [tree_model.ts](../ts/tree/tree_model.ts)
  - structural tree model from document paths
- [tree_markup.ts](../ts/tree/tree_markup.ts)
  - row semantics and row/path classes
- [tree.ts](../ts/tree/tree.ts)
  - DOM mount and toggle wiring
- [tree.css](../styles/tree.css)
  - row geometry and connector visuals
- [theme.css](../styles/theme.css)
  - connector and active-path tokens

## Invariants

- folders and files should participate in one connector system
- active-path highlighting should be row-local, not container-guessed
- inactive branches should stay readable but subdued
- tree visuals should remain token-driven and theme-safe
- markup should carry semantic classes/data for path state; CSS should not infer
  active-path structure indirectly

## Follow-up

The recent connector-heavy exploration has been deliberately simplified.

Remaining follow-up:

- refine the active/focus treatment
- keep the nested panel intuitive on desktop and mobile
- only reintroduce more complex tree geometry if a simpler panel proves
  insufficient

Track that work in [../../docs/todo/README.md](../../docs/todo/README.md).
