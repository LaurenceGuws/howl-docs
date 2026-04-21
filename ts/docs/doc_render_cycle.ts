import { renderHighlightedCode } from "./highlight.js";
import { currentDocFromHash } from "../shared/utils.js";
import { resolveProjectIcon, resolveProjectWordmark } from "../shared/branding.js";
import { setCurrentDoc } from "../state.js";
import {
  type DocumentBranding,
  renderDocumentView,
  setDocumentError,
  setDocumentLoading,
  setDocumentReady,
} from "./view_state.js";
import {
  loadDoc,
  setDocumentViewError,
  setDocumentViewLoading,
} from "./viewer.js";
import { updateTreeActivePath } from "../tree/tree_state.js";
import type { AppShell, AppState, ProjectRuntime } from "../shared/types.js";
import type {
  HighlightJsApi,
  MarkedApi,
  MermaidApi,
} from "../shared/vendor_types.js";

function syncCurrentDocSelection(
  state: AppState,
  docs: string[],
  defaultDocPath: string,
  renderTree: () => void,
): void {
  const currentPath = currentDocFromHash(docs, defaultDocPath);
  setCurrentDoc(state, currentPath);
  updateTreeActivePath(state, currentPath);
  renderTree();
}

function renderDocumentLifecycleChrome(args: {
  state: AppState;
  shell: AppShell;
  viewerEl: HTMLElement;
  branding: DocumentBranding;
  repoBasePath: string;
  path: string;
  status: AppState["document"]["status"];
  err?: unknown;
}): void {
  const {
    state,
    shell,
    viewerEl,
    branding,
    repoBasePath,
    path,
    status,
    err,
  } = args;

  if (status === "loading") {
    setDocumentLoading(state, repoBasePath, path);
    setDocumentViewLoading(state, path);
  } else if (status === "ready") {
    setDocumentReady(state, repoBasePath, path);
  } else if (status === "error") {
    setDocumentError(state, repoBasePath, path);
    setDocumentViewError(state, path, err);
  } else {
    return;
  }

  renderDocumentView(state, shell, viewerEl, branding);
}

export async function renderCurrentDocCycle(args: {
  state: AppState;
  shell: AppShell;
  projectRuntime: ProjectRuntime;
  viewerEl: HTMLElement;
  marked: MarkedApi;
  mermaid: MermaidApi;
  hljs?: HighlightJsApi;
  rootEl: HTMLElement;
  renderTree: () => void;
  signal: AbortSignal;
  shouldCommit: () => boolean;
}): Promise<void> {
  const {
    state,
    shell,
    projectRuntime,
    viewerEl,
    marked,
    mermaid,
    hljs,
    rootEl,
    renderTree,
    signal,
    shouldCommit,
  } = args;
  const { config: project, docs } = projectRuntime;
  const branding: DocumentBranding = {
    iconPath: resolveProjectIcon(project),
    title: project.title,
    wordmarkText: resolveProjectWordmark(project),
  };
  const repoBasePath = project.repoBasePath;
  const defaultDocPath = project.defaultDoc;

  syncCurrentDocSelection(state, docs, defaultDocPath, renderTree);

  await loadDoc({
    state,
    repoBasePath,
    path: state.currentDoc,
    marked,
    mermaid,
    rootEl,
    viewerEl,
    docs,
    defaultDocPath,
    signal,
    shouldCommit,
    onLoading(nextState: AppState, path: string) {
      if (!shouldCommit()) return;
      renderDocumentLifecycleChrome({
        state: nextState,
        shell,
        viewerEl,
        branding,
        repoBasePath,
        path,
        status: "loading",
      });
    },
    onReady(nextState: AppState, path: string) {
      if (!shouldCommit()) return;
      renderDocumentLifecycleChrome({
        state: nextState,
        shell,
        viewerEl,
        branding,
        repoBasePath,
        path,
        status: "ready",
      });
      renderHighlightedCode(hljs, viewerEl);
    },
    onError(nextState: AppState, path: string, err?: unknown) {
      if (!shouldCommit()) return;
      renderDocumentLifecycleChrome({
        state: nextState,
        shell,
        viewerEl,
        branding,
        repoBasePath,
        path,
        status: "error",
        err,
      });
    },
  });
}
