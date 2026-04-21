# Static Search Direction

Status:
- active architecture note
- intended to replace local ripgrep search as the primary product path

## Problem

The current search feature is centered on local ripgrep through
`howl_docs.py`.

That is not aligned with the main product goal:
- the docs explorer should produce or serve static web bundles
- the same core feature set should work on GitHub Pages or similar static
  hosting

Current local ripgrep search is still useful as a development aid, but it is
not the right long-term foundation for product search.

## Direction

Search should become a static-bundle feature with build-time index generation.

Short rule:
- build the search index ahead of time
- ship the index with the docs bundle
- run search entirely in the browser at runtime

## Contract

### Build time

A build or generation step should produce a search index from the docs corpus.

Inputs:
- project manifest
- docs index
- document content

Output:
- static search index artifact stored next to the bundled docs metadata

Candidate location:
- `app_architecture/docs_browser/search-index.<project>.json`
or a future generated output path owned by the docs build flow

### Generated schema

Initial generated schema should stay intentionally simple and deterministic.

Suggested top-level shape:

```json
{
  "version": 1,
  "projectId": "howl-docs",
  "generatedAt": "2026-04-02T12:00:00.000Z",
  "documents": [
    {
      "path": "README.md",
      "title": "Howl Docs",
      "headings": [
        "Structure",
        "Local Development"
      ],
      "text": "Normalized document text used for runtime matching.",
      "sections": [
        {
          "id": "structure",
          "heading": "Structure",
          "text": "Section-level normalized text."
        }
      ]
    }
  ]
}
```

Notes:
- `version` allows the runtime to reject incompatible artifacts cleanly
- `projectId` ties the artifact to the selected project contract
- `documents` are path-addressable and deterministic
- `sections` provide a clean future seam for heading-aware ranking/snippets
- `text` is a normalized search field, not presentation HTML

### Runtime

The browser app should:
- load the static search index for the selected project
- run query/filter locally in the browser
- render one search UX regardless of local-dev or hosted mode

### Search surface

The intended product surface is a spotlight-style search widget, not a
permanently inlined header input.

Current direction:
- a header icon button toggles the search widget
- the widget owns the search input and results list
- the same surface should work for both transitional local-dev search and the
  future static search runtime

Reason:
- better fit for a multi-project docs surface
- clearer product focus than a cramped always-visible input
- closer to the intended spotlight / command-palette interaction model

### Transitional local-dev behavior

Static search is now the only runtime search path.

Current rule:
- if a project has a generated search index, the browser uses it
- if a project does not have a generated search index, search is unavailable
- do not reintroduce local ripgrep fallback into the browser runtime path

## Open Decisions

### Search unit

Decide whether the index should be built from:
- whole documents
- headings/sections
- line snippets

Current likely best fit:
- section-oriented records with stable source path and short preview text

Reason:
- better relevance than whole-document blobs
- simpler than line-perfect positional indexing
- aligns with docs navigation better than raw grep behavior

### Ranking

Current direction has changed:
- prefer recall-first matching over “smart” ranking
- default ordering should be deterministic and simple, currently path-first
- broad queries should not be suppressed aggressively just to improve ranking

Near-term runtime rule:
- match documents/sections by normalized query tokens
- keep recall closer to `rg` expectations on the indexed corpus
- default ordering should stay easy to reason about
- use explicit field filtering before adding heavier implicit ranking

If richer ordering is added later:
- keep it optional or narrowly scoped
- do not let it hide obviously valid matches

### Highlighting

The current in-view search-hit behavior is a first-match approximation.

A static search replacement should define:
- what payload is returned for each hit
- whether hits target a document, a heading anchor, or a text range
- how the viewer should scroll/focus when opening a result

### Ownership

Preferred ownership split:
- generation/build step owns index creation
- browser owns search UX and filter/match application
- Python should not remain in the primary hosted-capable search path

### Search filtering

The intended simplification path is closer to editor search than fuzzy finder
ranking.

Preferred direction:
- keep the main search input recall-first
- add explicit field filters when needed:
  - path
  - title
  - heading
  - body
- default to searching across all fields unless narrowed

This is easier to reason about and closer to user expectation for pasted
literal text and path-like queries.

## Immediate Next Step

Do not implement search replacement blindly.

First:
1. decide where docs-bundle generation belongs
2. define the generated search-index schema
3. decide the runtime loading path for a selected project
4. preserve the spotlight widget contract while replacing the local ripgrep
   backend

## Initial implementation seam

The first implementation step should be a generator that:
- reads a project manifest
- resolves its docs-index file
- loads the referenced docs from the repo root
- emits a deterministic `search-index.<project>.json` artifact

That generator is allowed to start with a simple full-text-oriented schema.
Do not block on workers, chunking, or advanced ranking before the artifact and
runtime contract exist.
