# Multi-Project Plan

Status:
- active product execution plan

## Goal

Ship one docs instance that can host multiple projects without turning the
product into a pile of ad hoc project-switch seams.

The first release should prioritize:
- clear project identity
- obvious project switching
- simple categorized navigation
- one stable search/document experience inside the selected project

This plan is about the first clean multi-project product shape, not the final
ambition.

## Product Principles

- project selection should be explicit and visible
- project identity should be obvious from the current view
- project switching should not feel like changing config files
- the first release should stay simple before introducing richer hub behavior
- do not add cross-project cleverness before single-project flows stay solid

## First Shippable Shape

The first shippable multi-project release should have:

- one current selected project at a time
- one visible project switch surface in the shell
- grouped/categorized projects in that switch surface
- project-local docs tree
- project-local spotlight search
- explicit project identity in header, favicon, and theme

It should not try to do all of these yet:
- cross-project full-text search
- project pinning/favorites
- project recents/history UI
- complex landing dashboards
- project-specific custom shell layouts

## Current Starting Point

Already true:
- the runtime supports multiple projects
- project selection is explicit through `?project=<id>`
- project switching is controller-owned and in-place
- project-local static search works
- project-local branding and theme identity are explicit

Still missing:
- richer project chooser refinement beyond the first grouped shell panel
- a defined first-view story for multi-project use
- explicit decision about whether `/` should stay on the built-in project or
  become a multi-project landing route later

## Decisions For The First Release

### 1. Scope of selection

Selection stays single-project.

The app should always have one active project runtime.
All tree/search/view interactions are scoped to that selected project.

### 2. Search scope

Search stays project-local for the first release.

Reason:
- simpler mental model
- simpler runtime model
- simpler performance profile
- avoids mixing unrelated docs corpora before grouping/navigation is solid

### 3. Project grouping

Projects should gain optional manifest metadata for:
- `category`
- `shortLabel` or equivalent only if really needed later

If no category is provided, the project should land under a neutral default
group such as `Other`.

### 4. Switch surface

The old flat header select is gone.

Target first upgrade:
- keep the shell-level launcher control
- open a project chooser surface
- group projects by category
- show title and icon
- keep interaction simple and keyboard-safe

Do not jump straight to an over-designed dashboard.

### 5. Landing behavior

For now:
- `/?project=<id>` remains the authoritative route
- the built-in project remains the default bare-route target

Later, if a real multi-project landing view is added, it should get its own
explicit route rather than overloading project selection.

## Execution Phases

### Phase 1: Project metadata model

Goals:
- define minimal project grouping metadata
- keep manifest contract small

Work:
- add optional category field to the project contract
- update consumer contract docs
- decide default category behavior
- assign categories to the active local test projects

Exit criteria:
- every active local test project can be grouped deterministically

### Phase 2: Project chooser UX

Goals:
- replace the old select with a clearer project chooser
- refine the grouped chooser without reintroducing parallel switch surfaces

Work:
- add a chooser trigger/surface
- group projects by category
- preserve keyboard-safe selection flow

Exit criteria:
- multi-project mode is obvious without reading the URL
- switching projects feels product-native instead of config-native

### Phase 3: Identity cleanup

Goals:
- make current project identity read clearly across the shell
- avoid duplicate or noisy project labeling

Work:
- tighten header/title treatment
- review switcher labels and icon sizing
- verify project identity stays clear on mobile

Exit criteria:
- selected project is obvious at a glance
- switcher and header do not compete visually

### Phase 4: Landing and navigation review

Goals:
- decide whether the product needs a dedicated multi-project landing route

Work:
- evaluate real usage after the chooser lands
- only add a landing view if the chooser still feels insufficient

Exit criteria:
- either keep direct project entry
- or add a dedicated explicit landing route with a documented reason

## Acceptance Criteria

The first multi-project product lane should be considered complete when:

- project-local browsing remains simple and stable
- multiple projects are visible and switchable without URL knowledge
- projects are grouped predictably
- project identity is obvious in the active view
- the URL contract remains explicit and single-path
- no new fallback-heavy runtime behavior is introduced

## Non-Goals For Now

- cross-project merged search results
- project-specific saved preferences beyond current app state
- large catalog/homepage design explorations
- per-project shell customization beyond existing manifest identity/theme

## Immediate Next Step

Implement the next chooser refinement:
- validate the grouped chooser on real project sets
- tighten identity/label treatment inside the shell
- then decide whether a dedicated landing route is still needed
