# Testing Strategy

Status:
- active foundation strategy
- applies to all new test work

## Goal

Make the repo's testing model:
- explicit
- automatable
- strict enough to catch regressions before product drift reaches runtime

This repo should not accumulate four different testing styles for four
different features.

## Rules

- All tests must run headless.
- All tests must be automatable from repo scripts.
- A new feature should extend the existing harness, not introduce a parallel
  test system without a strong reason.
- Logic, correctness, performance, and convention checks are all first-class
  regressions.
- If a rule matters to architecture or design-system integrity, encode it in a
  test or a documented budget, not only in chat memory.
- Convention authority lives in `app_architecture/CONVENTIONS.md`.

## Test Layers

### 1. Logic regression tests

Purpose:
- catch broken branching, state transitions, and scoring logic

Examples:
- search ranking fixtures
- query parsing behavior
- project selection transition rules
- document loading state transitions

Rule:
- prefer small deterministic fixture inputs
- assert exact outputs where practical

### 2. Correctness regression tests

Purpose:
- catch contract breakage between generated artifacts and runtime behavior

Examples:
- generated search index shape
- manifest/runtime compatibility
- required docs-browser paths existing
- project registry contract checks
- static search recall against the indexed corpus

Rule:
- test the actual shipped contract, not a second mock implementation

### 3. Performance regression tests

Purpose:
- catch silent slowdowns in the paths that need to feel immediate

Examples:
- static search query latency budgets
- search index generation time budgets
- fixture-size scaling checks

Rule:
- use explicit budgets and stable fixture corpora
- keep performance checks lightweight enough for repeatable local execution

### 4. Convention regression tests

Purpose:
- catch drift from shared architecture and design-system rules

Examples:
- theme tokens used consistently
- component CSS not reintroducing raw palette literals
- single-path runtime contracts staying single-path
- no duplicate feature-specific implementations where a shared abstraction is
  required
- runtime feature installs exposing cleanup consistently
- markup injection ownership staying within named seams
- DOM/history/persistence ownership staying within named seams

Rule:
- convention checks should fail loudly when implementation drifts from repo
  standards

## Current Harness Direction

Current harness model:
- Node-based headless test runner
- repo-local test files under `tests/`
- shared helpers under `tests/helpers/`
- script entrypoints in `package.json`
- runtime browser-behavior checks may use a small headless DOM layer, but they
  must still run through the same repo test runner

This should remain the default unless a stronger need appears.

## Immediate Priorities

1. Convention tests for theme-token discipline.
2. Search ranking fixture tests across active projects.
3. Search performance budget checks for representative corpora.
4. Runtime contract checks for manifests, registry data, and generated search
   artifacts.
5. Convention tests for any newly documented repo rule that can be verified
   automatically.

## Known Convention Risk Already Identified

The explorer's active scope/state line has already drifted from theme
conventions before. That should be covered by convention tests rather than
relied on as a remembered manual check.
