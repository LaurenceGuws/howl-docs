import { setDocumentState } from "../state.js";
import { docFetchPath, escapeHtml } from "../shared/utils.js";
import type { AppShell, AppState } from "../shared/types.js";
import { renderViewer } from "./viewer_state.js";

export type DocumentBranding = {
  iconPath: string;
  title: string;
  wordmarkText?: string;
};

function setDocumentStatus(
  state: AppState,
  repoBasePath: string,
  path: string,
  status: AppState["document"]["status"],
): void {
  setDocumentState(state, {
    title: path,
    subtitle: "",
    rawLink: docFetchPath(repoBasePath, path),
    status,
  });
}

export function setDocumentLoading(
  state: AppState,
  repoBasePath: string,
  path: string,
): void {
  setDocumentStatus(state, repoBasePath, path, "loading");
}

export function setDocumentReady(
  state: AppState,
  repoBasePath: string,
  path: string,
): void {
  setDocumentStatus(state, repoBasePath, path, "ready");
}

export function setDocumentError(
  state: AppState,
  repoBasePath: string,
  path: string,
): void {
  setDocumentStatus(state, repoBasePath, path, "error");
}

export function renderDocumentChrome(
  state: AppState,
  shell: AppShell,
  branding: DocumentBranding,
): void {
  const wordmarkText = branding.wordmarkText?.trim();
  const label = wordmarkText
    ? `${escapeHtml(wordmarkText)} ${escapeHtml(branding.title)}`
    : escapeHtml(branding.title);
  shell.titleEl.innerHTML =
    `<span class="app-wordmark"><img class="app-wordmark-mark" src="${escapeHtml(branding.iconPath)}" alt="" aria-hidden="true" />${label}</span>`;
  shell.subtitleEl.textContent = state.document.subtitle;
  shell.rawLinkEl.href = state.document.rawLink;
}

export function renderDocumentView(
  state: AppState,
  shell: AppShell,
  viewerEl: HTMLElement,
  branding: DocumentBranding,
): void {
  renderDocumentChrome(state, shell, branding);
  renderViewer(state, viewerEl);
}
