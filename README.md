# Howl Docs

Local browser-based documentation explorer for Howl projects.

Standalone repo:

- <https://github.com/howl-editor/howl-docs>

Integration contract:

- [app_architecture/docs_browser/CONSUMER_CONTRACT.md](app_architecture/docs_browser/CONSUMER_CONTRACT.md)

Current entrypoints:

- `howl_docs.py`: lightweight local HTTP launcher
- `index.html`: HTML shell
- `design/`: focused explorer design docs for non-trivial widget/system boundaries
- `styles/base.css`: stylesheet import root
- `app_architecture/`: architecture and subsystem design docs
- `ts/`: TypeScript source modules
  - `docs/`: document routing/rendering/view state
- `search/`: spotlight-style static search
  - `tree/`: tree rendering and tree state
  - `theme/`: theme/runtime palette wiring
  - `shell/`: app-shell startup, DOM lookup, and icon wiring
- `shared/`: shared types/helpers/vendor declarations
- `build/js/`: generated browser ESM output
- `app_architecture/docs_browser/project.howl-docs.json`: local project manifest
- `app_architecture/docs_browser/project.howl-docs.pages.json`: hosted/pages manifest
- `app_architecture/docs_browser/docs-index.howl-docs.json`: repo docs index
- `docs/`: workflow, handoff, review, and todo docs

Run locally:

```bash
cd "$(git rev-parse --show-toplevel)"
npm install
npm run build
python3 howl_docs.py
```

Then open the printed URL.

Alternate config:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 howl_docs.py 8000 project.pages.json
```

External project:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 howl_docs.py 8010 ../other-project/docs_browser/project.other.json
```

The launcher prints a project-scoped URL:

```text
http://127.0.0.1:8010/?project=other
```

Project ids are the browser-facing selection contract. Config file mount paths
are launcher internals and should not be treated as the primary URL model.

Multiple external projects:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 howl_docs.py 8010 \
  ../project-a/docs_browser/project.a.json \
  ../project-b/docs_browser/project.b.json \
  ../project-c/docs_browser/project.c.json
```

That exposes one local docs instance with a project registry. The browser can
switch projects through stable project ids like `?project=a` or `?project=c`.

The launcher can mount an external config directory for local development. That
lets consuming repos keep their own project manifest and docs index files
without copying them into this repo.

Structure is intentionally small and framework-free so the tool can be reused
across other Howl projects and modules by swapping project config and doc-index JSON.

Current shell rule:

- the outer shell owns the atmospheric background field
- panes own the main material layers
- small wrappers and controls should prefer transparency, border, and hover
  state before adding their own local fill
- theme/config should drive the surface system through tokens rather than
  scattered component-specific color formulas

Theme rule:

- project config may override the base palette only
- derived shell/control/viewer materials stay in `styles/theme.css`
- if a visual change can be expressed by changing a derived token, prefer that
  over adding a new component-local background
- the current config surface is intentionally capped there; do not expand it
  into per-component styling knobs without a strong reuse reason

Notes:

- `ts/` is the source tree.
- `build/js/` is generated output and is intentionally not checked in.
- The mapping is direct: files under `ts/` compile to browser ESM under
  `build/js/`, preserving the same subtree layout.
- The launcher expects `build/js/main.js` to exist and will tell you to run the
  build step if it is missing.
- `main` stays source-only for this tool.
- If GitHub Pages is published for a release, built explorer assets may be
  committed on the release branch as part of the release ritual instead of on
  `main`.
- Release-branch Pages publication should keep `.nojekyll` at the repo root so
  GitHub serves the static explorer directly.
- For design-heavy internal cleanup, use
  [app_architecture/ui/README.md](app_architecture/ui/README.md) for focused
  documentation of widget and system boundaries.
- Current repo workflow docs live under [docs/INDEX.md](docs/INDEX.md).
- The sidebar input remains a tree/path filter only.
- Search is a separate spotlight-style full-text surface backed by generated
  static search indexes.
- Project-local search works the same in local-dev and hosted mode when the
  selected project ships its search artifact.
