import type {
  AppController,
  DocController,
  ProjectConfig,
  ProjectRegistryEntry,
  StaticSearchIndex,
} from "./shared/types.js";
import type {
  HighlightJsApi,
  MarkedApi,
  MermaidApi,
} from "./shared/vendor_types.js";
import { createDocController } from "./docs/doc_controller.js";
import { createAppController } from "./app_controller.js";
import { configureMarked } from "./docs/markdown.js";
import { initMermaidForTheme } from "./docs/mermaid.js";
import { initializeAppShell, syncHighlightTheme } from "./shell/app_shell.js";
import { getAppShell } from "./shell/shell_dom.js";
import { createAppState } from "./state.js";

export async function bootstrapAppRuntime(args: {
  project: ProjectConfig;
  registry: ProjectRegistryEntry[];
  docs: string[];
  searchIndex: StaticSearchIndex | null;
  marked: MarkedApi;
  mermaid: MermaidApi;
  hljs?: HighlightJsApi;
}): Promise<{
  state: ReturnType<typeof createAppState>;
  shell: ReturnType<typeof getAppShell>;
  appController: AppController;
}> {
  const { project, registry, docs, searchIndex, marked, mermaid, hljs } = args;
  const state = createAppState({
    selectedProjectId: project.id ?? null,
    availableProjectIds: registry.map((entry) => entry.id),
    projectEntries: registry,
    projectRuntime: {
      config: project,
      docs,
      searchIndex,
    },
  });
  const shell = getAppShell();

  await initializeAppShell({ shell, project, state });
  configureMarked(marked);
  initMermaidForTheme(mermaid, shell.rootEl, state.theme);
  syncHighlightTheme(shell, state.theme);

  const docController = createDocController({
    state,
    shell,
    treeEl: shell.treeEl,
    viewerEl: shell.viewerEl,
    searchEl: shell.searchEl,
    marked,
    mermaid,
    hljs,
    rootEl: shell.rootEl,
  });
  const appController = createAppController({
    state,
    shell,
    docController,
    hljs,
  });

  return { state, shell, appController };
}
