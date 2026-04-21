import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

import { bootstrapAppRuntime } from "./app_bootstrap.js";
import {
  canonicalizeProjectSelection,
  loadProjectConfig,
  loadProjectRegistry,
} from "./config.js";

export async function startApp(): Promise<void> {
  const hljs = window.hljs;
  const registry = await loadProjectRegistry();
  canonicalizeProjectSelection();
  const { project, docs, searchIndex } = await loadProjectConfig(registry);
  const { appController } = await bootstrapAppRuntime({
    project,
    registry,
    docs,
    searchIndex,
    marked,
    mermaid,
    hljs,
  });

  appController.install();
  await appController.start();
}
