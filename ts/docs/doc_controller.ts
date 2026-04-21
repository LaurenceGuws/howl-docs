import { rerenderVisibleMermaid } from "./mermaid.js";
import { renderCurrentDocCycle } from "./doc_render_cycle.js";
import { applySearchQuery, installDocRouting } from "./doc_routing.js";
import {
  renderTreeFromState,
  updateTreeExpandedPaths,
} from "../tree/tree_state.js";
import type {
  AppShell,
  AppState,
  Dispose,
  DocController,
} from "../shared/types.js";
import type {
  HighlightJsApi,
  MarkedApi,
  MermaidApi,
} from "../shared/vendor_types.js";

export function createDocController(args: {
  state: AppState;
  shell: AppShell;
  treeEl: HTMLElement;
  viewerEl: HTMLElement;
  searchEl: HTMLInputElement;
  marked: MarkedApi;
  mermaid: MermaidApi;
  hljs?: HighlightJsApi;
  rootEl: HTMLElement;
}): DocController {
  const {
    state,
    shell,
    treeEl,
    viewerEl,
    searchEl,
    marked,
    mermaid,
    hljs,
    rootEl,
  } = args;
  let currentDocRequestId = 0;
  let activeDocAbortController: AbortController | null = null;
  let routingCleanup: Dispose | null = null;

  async function renderCurrentDoc(): Promise<void> {
    const projectRuntime = state.project.runtime;
    if (!projectRuntime) return;
    currentDocRequestId += 1;
    const requestId = currentDocRequestId;
    activeDocAbortController?.abort();
    const abortController = new AbortController();
    activeDocAbortController = abortController;

    await renderCurrentDocCycle({
      state,
      shell,
      projectRuntime,
      viewerEl,
      marked,
      mermaid,
      hljs,
      rootEl,
      renderTree,
      signal: abortController.signal,
      shouldCommit() {
        return requestId === currentDocRequestId;
      },
    });
  }

  function renderTree(): void {
    const docs = state.project.runtime?.docs ?? [];
    renderTreeFromState(state, treeEl, docs, (expandedPaths) => {
      updateTreeExpandedPaths(state, expandedPaths);
    });
  }

  function install(): void {
    routingCleanup?.();
    routingCleanup = installDocRouting({
      searchEl,
      renderCurrentDoc,
      onSearchQuery(query: string) {
        applySearchQuery({ state, query, renderTree });
      },
    });
  }

  async function rerenderDiagramsForTheme(): Promise<void> {
    await rerenderVisibleMermaid(mermaid, rootEl, viewerEl);
  }

  return {
    install,
    renderTree,
    renderCurrentDoc,
    rerenderDiagramsForTheme,
  };
}
