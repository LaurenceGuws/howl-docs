import { escapeHtml } from "../shared/utils.js";
import { setViewerHtml } from "../state.js";
import type { AppState } from "../shared/types.js";

export function setViewerLoading(state: AppState, path: string): void {
  setViewerHtml(state, `<p class="status">Loading ${escapeHtml(path)}...</p>`);
}

export function setViewerContent(state: AppState, html: string): void {
  setViewerHtml(state, html);
}

export function setViewerError(
  state: AppState,
  path: string,
  err: unknown,
): void {
  setViewerHtml(
    state,
    `
    <div class="callout">
      Failed to load <code>${escapeHtml(path)}</code>.
    </div>
    <p>This viewer fetches Markdown files over HTTP. Open the explorer from the repo root:</p>
    <pre><code>cd /path/to/howl-docs
python3 howl_docs.py</code></pre>
    <p>Error: <code>${escapeHtml(String(err))}</code></p>
  `,
  );
}

export function renderViewer(state: AppState, viewerEl: HTMLElement): void {
  viewerEl.innerHTML = state.documentView.html;
}
