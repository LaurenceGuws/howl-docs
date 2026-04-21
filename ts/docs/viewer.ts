import { renderMarkdown } from "./markdown.js";
import { currentFindFromHash, docFetchPath } from "../shared/utils.js";
import { renderMermaidBlocks } from "./mermaid.js";
import {
  setViewerContent,
  setViewerError,
  setViewerLoading,
} from "./viewer_state.js";
import type { AppState } from "../shared/types.js";
import type { MarkedApi, MermaidApi } from "../shared/vendor_types.js";

export function setDocumentViewLoading(state: AppState, path: string): void {
  setViewerLoading(state, path);
}

export function setDocumentViewContent(state: AppState, html: string): void {
  setViewerContent(state, html);
}

export function setDocumentViewError(
  state: AppState,
  path: string,
  err: unknown,
): void {
  setViewerError(state, path, err);
}

function focusSearchHit(viewerEl: HTMLElement, term: string): void {
  const query = term.trim();
  if (!query) return;

  const walker = document.createTreeWalker(viewerEl, NodeFilter.SHOW_TEXT);
  const lowerQuery = query.toLowerCase();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!(node instanceof Text)) continue;
    const value = node.textContent ?? "";
    const index = value.toLowerCase().indexOf(lowerQuery);
    if (index < 0) continue;
    const range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + query.length);
    const mark = document.createElement("mark");
    mark.className = "viewer-search-hit";
    try {
      range.surroundContents(mark);
    } catch {
      mark.textContent = value.slice(index, index + query.length);
      range.deleteContents();
      range.insertNode(mark);
    }
    mark.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
}

export async function loadDoc(args: {
  state: AppState;
  repoBasePath: string;
  path: string | null;
  marked: MarkedApi;
  mermaid: MermaidApi;
  rootEl: HTMLElement;
  viewerEl: HTMLElement;
  docs: string[];
  defaultDocPath: string;
  signal: AbortSignal;
  shouldCommit: () => boolean;
  onLoading: (state: AppState, path: string) => void;
  onReady: (state: AppState, path: string) => void;
  onError: (state: AppState, path: string, err: unknown) => void;
}): Promise<void> {
  const {
    state,
    repoBasePath,
    path,
    marked,
    mermaid,
    rootEl,
    viewerEl,
    docs,
    signal,
    shouldCommit,
    onLoading,
    onReady,
    onError,
  } = args;

  if (!path) return;

  onLoading(state, path);

  try {
    const res = await fetch(docFetchPath(repoBasePath, path), { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const source = await res.text();
    if (!shouldCommit()) return;
    const html = renderMarkdown(marked, source, path, repoBasePath, docs);
    setDocumentViewContent(state, html);
    onReady(state, path);
    await renderMermaidBlocks(mermaid, rootEl, viewerEl);
    if (!shouldCommit()) return;
    focusSearchHit(viewerEl, currentFindFromHash());
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    if (!shouldCommit()) return;
    onError(state, path, err);
  }
}
