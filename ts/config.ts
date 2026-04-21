import type {
  ProjectConfig,
  ProjectRegistryEntry,
  StaticSearchIndex,
} from "./shared/types.js";

export async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

async function fetchProjectRegistry(): Promise<ProjectRegistryEntry[] | null> {
  try {
    return await fetchJson<ProjectRegistryEntry[]>("/__projects");
  } catch {
    return null;
  }
}

function defaultProjectRegistryEntry(): ProjectRegistryEntry {
  return {
    id: defaultProjectId(),
    label: "Howl Docs",
    category: "Infrastructure",
    configPath: defaultProjectConfigPath(),
    repoBasePath: ".",
  };
}

export async function loadProjectRegistry(): Promise<ProjectRegistryEntry[]> {
  const fetchedRegistry = await fetchProjectRegistry();
  if (!fetchedRegistry?.length) {
    return [defaultProjectRegistryEntry()];
  }
  if (fetchedRegistry.some((entry) => entry.id === defaultProjectId())) {
    return fetchedRegistry;
  }
  return [defaultProjectRegistryEntry(), ...fetchedRegistry];
}

function defaultProjectConfigPath(): string {
  return location.hostname.endsWith("github.io")
    ? "./app_architecture/docs_browser/project.howl-docs.pages.json"
    : "./app_architecture/docs_browser/project.howl-docs.json";
}

function defaultProjectId(): string {
  return "howl-docs";
}

export function selectedProjectId(): string | null {
  const params = new URLSearchParams(location.search);
  return params.get("project");
}

export function canonicalizeProjectSelection(
): void {
  const params = new URLSearchParams(location.search);
  let changed = false;
  if (params.has("config")) {
    params.delete("config");
    changed = true;
  }
  if (!params.has("project")) {
    params.set("project", defaultProjectId());
    changed = true;
  }
  if (!changed) return;
  replaceSearchParams(params);
}

function replaceSearchParams(params: URLSearchParams): void {
  const search = params.toString();
  const nextUrl = `${location.pathname}${search ? `?${search}` : ""}${location.hash}`;
  history.replaceState(null, "", nextUrl);
}

export function projectUrl(projectId: string): string {
  const params = new URLSearchParams(location.search);
  params.set("project", projectId);
  params.delete("config");
  return `${location.pathname}?${params.toString()}${location.hash}`;
}

export async function selectedProjectConfigPath(
  registry?: ProjectRegistryEntry[],
): Promise<string> {
  const projectRegistry = registry ?? (await loadProjectRegistry());
  const projectId = selectedProjectId() ?? defaultProjectId();
  const selectedEntry = projectRegistry.find((entry) => entry.id === projectId);
  if (!selectedEntry) {
    throw new Error(`Unknown project id: ${projectId}`);
  }
  return selectedEntry.configPath;
}

function normalizeProjectConfig(args: {
  project: ProjectConfig;
  selectedProjectId: string | null;
  selectedRegistryEntry?: ProjectRegistryEntry;
}): ProjectConfig {
  const { project, selectedProjectId, selectedRegistryEntry } = args;
  const normalized: ProjectConfig = {
    ...project,
    id: project.id ?? selectedProjectId ?? undefined,
    category: project.category?.trim() || selectedRegistryEntry?.category || "Other",
  };

  if (selectedRegistryEntry?.repoBasePath) {
    normalized.repoBasePath = selectedRegistryEntry.repoBasePath;
    for (const key of ["icon", "docsIndexPath"] as const) {
      const value = normalized[key];
      if (typeof value === "string" && value.startsWith("/__repo_root/")) {
        normalized[key] = value.replace(
          "/__repo_root/",
          selectedRegistryEntry.repoBasePath,
        ) as typeof value;
      }
    }
  }

  return normalized;
}

export async function loadProjectConfig(registry?: ProjectRegistryEntry[]): Promise<{
  project: ProjectConfig;
  docs: string[];
  searchIndex: StaticSearchIndex | null;
}> {
  const projectRegistry = registry ?? (await loadProjectRegistry());
  const projectId = selectedProjectId() ?? defaultProjectId();
  const selectedEntry = projectRegistry.find((entry) => entry.id === projectId);
  const configPath = await selectedProjectConfigPath(projectRegistry);
  const rawProject = await fetchJson<ProjectConfig>(configPath);
  const project = normalizeProjectConfig({
    project: rawProject,
    selectedProjectId: projectId,
    selectedRegistryEntry: selectedEntry,
  });
  const docsIndexPath = new URL(
    project.docsIndexPath ?? "./docs-index.json",
    new URL(configPath, location.href),
  ).toString();
  const docs = await fetchJson<string[]>(docsIndexPath);
  const defaultSearchIndexPath = project.id
    ? `./search-index.${project.id}.json`
    : "./search-index.json";
  const searchIndexPath = new URL(
    project.searchIndexPath ?? defaultSearchIndexPath,
    new URL(configPath, location.href),
  ).toString();
  let searchIndex: StaticSearchIndex | null = null;
  try {
    searchIndex = await fetchJson<StaticSearchIndex>(searchIndexPath);
  } catch {
    searchIndex = null;
  }
  return { project, docs, searchIndex };
}
