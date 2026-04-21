# Consumer Contract

This file defines the integration contract for repos that want to use
`howl-docs` as an external docs browser.

## Model

A consumer repo owns:

- its own project manifest
- its own docs-index JSON
- its own docs tree
- its own branding choices

`howl-docs` owns:

- the browser app
- local HTTP serving
- static search runtime behavior
- rendering and navigation behavior

Do not copy consumer project manifests into this repo as tracked files just to make the
launcher happy. Pass the consumer config path directly to `howl_docs.py`.

## Launch Modes

### Local dev

Use `howl_docs.py` and pass either:

- no config argument, which loads
  `./app_architecture/docs_browser/project.howl-docs.json`
- a project manifest path inside this repo
- one arbitrary external config path
- multiple external config paths to expose one multi-project registry

Example:

```bash
cd /path/to/howl-docs
python3 howl_docs.py 8010 ../zbar/tools/docs_browser/project.zbar.json
```

Example with multiple projects:

```bash
cd /path/to/howl-docs
python3 howl_docs.py 8010 \
  ../zbar/tools/docs_browser/project.zbar.json \
  ../wayspot/tools/docs_browser/project.wayspot.json \
  ../zide/app_architecture/docs_browser/project.zide.json \
  ../cwatch/tools/docs_browser/project.cwatch.json
```

When an external config path is used, the launcher mounts that config
directory through a local HTTP path so relative config assets still work. The
browser-facing selection contract is a stable project id such as
`?project=zbar`, not a raw mounted config path.

### Hosted / Pages

Hosted mode is static-only. There is no local Python seam for search.

Use a hosted config such as `project.pages.json` and set:

- `runtimeMode` to `"github-pages"`
- `repoBasePath` to the hosted site root for the target repo

Example:

```json
{
  "runtimeMode": "github-pages",
  "repoBasePath": "/howl-docs/"
}
```

## Project Manifest Fields

Required fields:

- `title`: authoritative project title shown in the header
- `icon`: icon URL used for header branding and favicon; if omitted or blank,
  runtime falls back to the shared neutral icon `./assets/icons/folder.svg`
- `repoBasePath`: base path used to load docs and repo assets
- `defaultDoc`: default document path, usually `README.md`
- `docRoots`: top-level directories to include in the tree model
- `includeExtensions`: extensions allowed in the doc tree, such as `[".md"]`

Optional fields:

- `category`: optional project grouping label for the multi-project chooser;
  blank or missing values fall back to `Other`
- `brandWordmarkText`: optional short prefix shown before the project title;
  blank or missing values render no prefix, and no generic fallback token is
  synthesized by the runtime
- `docsIndexPath`: path to the docs-index JSON
- `repoUrl`: source repository URL for the GitHub button
- `supportUrl`: optional support link target
- `supportLabel`: optional support link text
- `runtimeMode`: currently `local-dev` or `github-pages`
- `theme`: dark/light base palette overrides
- `repoAbsolutePath`: optional local-only absolute repo root for rewriting
  absolute Markdown media links; do not rely on this unless you actually need
  it

## Path Rules

### `repoBasePath`

`repoBasePath` is the root used for normal doc/media fetches.

Examples:

- local self-hosted config in this repo: `"."`
- local external consumer config: `"/__project_repo/<project-id>/"`
- pages deployment: `"/howl-docs/"`

This value should point at the consumer repo root from the browser's point of
view, not from the shell's point of view.

For external local-dev configs, `howl_docs.py` mounts the consumer repo
under a project-scoped path such as `"/__project_repo/zbar/"`.

### `docsIndexPath`

If omitted, the app loads `./docs-index.json` relative to the project manifest.

If present, it resolves relative to the config file that declared it, not
relative to the app root.

That means a consumer config can safely say:

```json
{
  "docsIndexPath": "./docs-index.zbar.json"
}
```

### `icon`

`icon` is loaded as a normal browser URL. Keep it reachable from the served
page.

Examples:

- local standalone config: `"./assets/icons/github.svg"`
- external consumer config: `"/__project_repo/zbar/assets/icon/zbar-icon.png"`
- pages config: `"/howl-docs/assets/icons/github.svg"`

## Docs Index

The docs-index file is a JSON array of repo-relative document paths.

Example:

```json
[
  "README.md",
  "docs/INDEX.md",
  "app_architecture/BOOTSTRAP.md"
]
```

Each entry should be relative to the consumer repo root implied by
`repoBasePath`.

## Search Contract

Full-text search is now static-index-based in both local-dev and hosted mode.

Requirements:

- the consumer should generate and ship a `search-index.<project>.json`
- the project manifest should expose that artifact through `searchIndexPath`
- docs listed in the docs index must resolve inside the target repo root used
  to generate the artifact

If no search index is present, the browser shows search as unavailable for that
project. There is no Python search fallback in the product path.

## Project Selection Contract

The browser should select projects by stable project id.

When the launcher exposes multiple projects, the registry entry for each
project also includes a category label used for grouped chooser UI.

Current local-dev form:

```text
http://127.0.0.1:8010/?project=zbar
```

The launcher exposes the project registry at `/__projects`.

The browser canonicalizes bare routes to the explicit built-in project id:

```text
http://127.0.0.1:8010/?project=howl-docs
```

Do not build local workflows around raw mount internals such as
`/__config_root/...`. Those paths are implementation details owned by the
launcher.

## Reference Consumer

`zbar` is the current reference integration.

Files:

- `../zbar/scripts/open_docs_browser.sh`
- `../zbar/tools/docs_browser/project.zbar.json`
- `../zbar/tools/docs_browser/docs-index.zbar.json`

That setup is the pattern to copy into other repos until a more formal wrapper
exists.
