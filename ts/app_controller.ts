import { installSidebarControls, syncResponsiveSidebarState } from "./layout.js";
import { loadProjectConfig, projectUrl, selectedProjectId } from "./config.js";
import { installDocSearch } from "./search/doc_search.js";
import {
  initializeAppShell,
  installProjectSwitcher,
  syncHighlightTheme,
} from "./shell/app_shell.js";
import { installThemeControls } from "./theme/theme_controls.js";
import {
  resetProjectSessionState,
  setProjectRuntime,
  setSelectedProjectId,
} from "./state.js";
import type {
  AppController,
  AppShell,
  AppState,
  DocController,
  Dispose,
} from "./shared/types.js";
import type { HighlightJsApi } from "./shared/vendor_types.js";

export function createAppController(args: {
  state: AppState;
  shell: AppShell;
  docController: DocController;
  hljs?: HighlightJsApi;
}): AppController {
  const { state, shell, docController, hljs } = args;
  let cleanupListeners: Dispose[] = [];
  let activeProjectTransition: Promise<void> | null = null;

  function install(): void {
    cleanup();
    cleanupListeners = [
      installProjectSwitcher({
        shell,
        state,
        onSelectProject: selectProject,
      }),
    ];
    docController.install();
    const handlePopState = (): void => {
      const nextProjectId = selectedProjectId();
      if (!nextProjectId || nextProjectId === state.project.selectedId) return;
      if (activeProjectTransition) return;
      activeProjectTransition = transitionProject(nextProjectId, { pushHistory: false })
        .catch((err) => {
          console.error("Failed to restore project from history", err);
        })
        .finally(() => {
          activeProjectTransition = null;
        });
    };
    window.addEventListener("popstate", handlePopState);
    cleanupListeners.push(() =>
      window.removeEventListener("popstate", handlePopState),
    );
    const handleResize = (): void => {
      syncResponsiveSidebarState(shell.appEl, state);
    };
    window.addEventListener("resize", handleResize);
    cleanupListeners.push(() =>
      window.removeEventListener("resize", handleResize),
    );
    cleanupListeners.push(installThemeControls({
      state,
      shell,
      docController,
      hljs,
      onThemeApplied: () => syncHighlightTheme(shell, state.theme),
    }));
    cleanupListeners.push(installSidebarControls({
      appEl: shell.appEl,
      state,
      sidebarToggleEl: shell.sidebarToggleEl,
      sidebarResizerEl: shell.sidebarResizerEl,
    }));
    cleanupListeners.push(installDocSearch({
      state,
      shell,
    }));
  }

  async function start(): Promise<void> {
    docController.renderTree();
    await docController.renderCurrentDoc();
  }

  function selectProject(projectId: string): void {
    if (projectId === state.project.selectedId) return;
    if (activeProjectTransition) return;
    activeProjectTransition = transitionProject(projectId)
      .catch((err) => {
        console.error("Failed to switch project", err);
      })
      .finally(() => {
        activeProjectTransition = null;
      });
  }

  async function transitionProject(
    projectId: string,
    options?: { pushHistory?: boolean },
  ): Promise<void> {
    const previousUrl = location.href;
    const previousProjectId = state.project.selectedId;
    const previousProjectRuntime = state.project.runtime;
    const nextUrl = projectUrl(projectId);
    if (options?.pushHistory === false) {
      history.replaceState(null, "", nextUrl);
    } else {
      history.pushState(null, "", nextUrl);
    }
    cleanup();
    shell.projectSwitchToggleEl.disabled = true;

    try {
      const { project, docs, searchIndex } = await loadProjectConfig(state.project.entries);
      setSelectedProjectId(state, project.id ?? projectId);
      setProjectRuntime(state, {
        config: project,
        docs,
        searchIndex,
      });
      resetProjectSessionState(state);
      shell.searchEl.value = "";
      shell.globalSearchEl.value = "";
      await initializeAppShell({ shell, project, state });
      install();
      await start();
    } catch (err) {
      history.replaceState(null, "", previousUrl);
      if (previousProjectRuntime) {
        setSelectedProjectId(state, previousProjectId);
        setProjectRuntime(state, previousProjectRuntime);
        resetProjectSessionState(state);
        shell.searchEl.value = "";
        shell.globalSearchEl.value = "";
        await initializeAppShell({
          shell,
          project: previousProjectRuntime.config,
          state,
        });
        install();
        await start();
      }
      throw err;
    } finally {
      shell.projectSwitchToggleEl.disabled = false;
    }
  }

  function cleanup(): void {
    for (const dispose of cleanupListeners.splice(0)) {
      dispose();
    }
  }

  return {
    install,
    start,
    selectProject,
  };
}
