import type {
  AppState,
  DocumentStatus,
  ProjectRegistryEntry,
  ProjectRuntime,
  SearchStatus,
  SearchHit,
  ThemeName,
  TextSearchState,
} from "./shared/types.js";

const sidebarWidthStorageKey = "howl_docs.sidebar_width";
const sidebarCollapsedStorageKey = "howl_docs.sidebar_collapsed";
const themeStorageKey = "howl_docs.theme";

export const layoutDefaults = {
  collapseBreakpoint: 1100,
  minSidebarWidth: 180,
  maxSidebarWidth: 760,
  defaultSidebarWidth: 320,
} as const;

export function createAppState(args?: {
  selectedProjectId?: string | null;
  availableProjectIds?: string[];
  projectEntries?: ProjectRegistryEntry[];
  projectRuntime?: ProjectRuntime | null;
}): AppState {
  const {
    selectedProjectId = null,
    availableProjectIds = [],
    projectEntries = [],
    projectRuntime = null,
  } = args ?? {};
  return {
    project: {
      selectedId: selectedProjectId,
      availableIds: availableProjectIds,
      entries: projectEntries,
      runtime: projectRuntime,
    },
    currentDoc: null,
    theme: preferredTheme(),
    document: {
      title: "Howl Docs",
      subtitle: "",
      rawLink: "#",
      status: "idle",
    },
    documentView: {
      html: "",
    },
    search: {
      query: "",
    },
    textSearch: {
      query: "",
      open: false,
      status: "idle",
      selectedIndex: -1,
      statusText: "Type to search across docs.",
      hits: [],
    },
    tree: {
      filter: "",
      activePath: null,
      expandedPaths: [],
    },
    sidebar: {
      width: preferredSidebarWidth(),
      collapsed: preferredSidebarCollapsed(),
    },
    optionsMenu: {
      open: false,
    },
  };
}

export function preferredTheme(): ThemeName {
  const stored = localStorage.getItem(themeStorageKey);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function preferredSidebarWidth(): number {
  const stored = Number(localStorage.getItem(sidebarWidthStorageKey));
  if (
    !Number.isNaN(stored) &&
    stored >= layoutDefaults.minSidebarWidth &&
    stored <= layoutDefaults.maxSidebarWidth
  ) {
    return stored;
  }
  return layoutDefaults.defaultSidebarWidth;
}

export function preferredSidebarCollapsed(): boolean {
  return localStorage.getItem(sidebarCollapsedStorageKey) === "true";
}

export function clampSidebarWidth(width: number): number {
  return Math.max(
    layoutDefaults.minSidebarWidth,
    Math.min(layoutDefaults.maxSidebarWidth, width),
  );
}

export function persistSidebarWidth(width: number): void {
  localStorage.setItem(sidebarWidthStorageKey, String(width));
}

export function persistSidebarCollapsed(collapsed: boolean): void {
  localStorage.setItem(
    sidebarCollapsedStorageKey,
    collapsed ? "true" : "false",
  );
}

export function persistTheme(theme: ThemeName): void {
  localStorage.setItem(themeStorageKey, theme);
}

export function setCurrentDoc(state: AppState, path: string | null): void {
  state.currentDoc = path;
}

export function setSelectedProjectId(
  state: AppState,
  selectedProjectId: string | null,
): void {
  state.project.selectedId = selectedProjectId;
}

export function setProjectRuntime(
  state: AppState,
  projectRuntime: ProjectRuntime | null,
): void {
  state.project.runtime = projectRuntime;
}

export function resetProjectSessionState(state: AppState): void {
  state.currentDoc = null;
  state.document = {
    title: "Howl Docs",
    subtitle: "",
    rawLink: "#",
    status: "idle",
  };
  state.documentView = {
    html: "",
  };
  state.search = {
    query: "",
  };
  state.textSearch = {
    query: "",
    open: false,
    status: "idle",
    selectedIndex: -1,
    statusText: "Type to search across docs.",
    hits: [],
  };
  state.tree = {
    filter: "",
    activePath: null,
    expandedPaths: [],
  };
  state.optionsMenu = {
    open: false,
  };
}

export function setSearchQuery(state: AppState, query: string): void {
  state.search.query = query;
}

export function setTextSearchState(
  state: AppState,
  nextSearch: TextSearchState,
): void {
  state.textSearch = nextSearch;
}

export function setTextSearchStatus(
  state: AppState,
  args: {
    status: SearchStatus;
    statusText: string;
  },
): void {
  state.textSearch.status = args.status;
  state.textSearch.statusText = args.statusText;
}

export function setTextSearchHits(
  state: AppState,
  args: {
    hits: SearchHit[];
    selectedIndex: number;
  },
): void {
  state.textSearch.hits = args.hits;
  state.textSearch.selectedIndex = args.selectedIndex;
}

export function setTreeFilter(state: AppState, filter: string): void {
  state.tree.filter = filter;
}

export function setTreeActivePath(
  state: AppState,
  activePath: string | null,
): void {
  state.tree.activePath = activePath;
}

export function setTreeExpandedPaths(
  state: AppState,
  expandedPaths: string[],
): void {
  state.tree.expandedPaths = expandedPaths;
}

export function setOptionsMenuOpen(state: AppState, open: boolean): void {
  state.optionsMenu.open = open;
}

export function setTheme(state: AppState, theme: ThemeName): void {
  state.theme = theme;
}

export function setDocumentState(
  state: AppState,
  nextDocument: {
    title: string;
    subtitle: string;
    rawLink: string;
    status: DocumentStatus;
  },
): void {
  state.document = nextDocument;
}

export function setViewerHtml(state: AppState, html: string): void {
  state.documentView.html = html;
}
