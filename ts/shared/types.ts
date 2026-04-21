export type ThemeName = "dark" | "light";
export type DocumentStatus = "idle" | "loading" | "ready" | "error";
export type SearchStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "unavailable";

// Only base palette tokens belong in project config. Derived shell/control/viewer
// materials remain CSS-owned so the tool keeps one design system instead of a
// per-project styling DSL.
export type ProjectPalette = {
  accent?: string;
  accentSoft?: string;
  accentStrong?: string;
  activeLink?: string;
  code?: string;
  ink?: string;
  line?: string;
  lineSoft?: string;
  muted?: string;
  panel?: string;
  panel2?: string;
  panel3?: string;
  bg?: string;
  bg2?: string;
  treeActive?: string;
};

export type ProjectThemeConfig = {
  dark?: ProjectPalette;
  light?: ProjectPalette;
};

export type ProjectConfig = {
  id?: string;
  category?: string;
  title: string;
  icon: string;
  brandWordmarkText?: string;
  repoBasePath: string;
  docsIndexPath?: string;
  searchIndexPath?: string;
  repoUrl?: string;
  supportUrl?: string;
  supportLabel?: string;
  runtimeMode?: string;
  defaultDoc: string;
  docRoots: string[];
  includeExtensions: string[];
  theme?: ProjectThemeConfig;
};

export type ProjectRegistryEntry = {
  id: string;
  label: string;
  category: string;
  configPath: string;
  repoBasePath?: string;
};

export type ProjectRuntime = {
  config: ProjectConfig;
  docs: string[];
  searchIndex: StaticSearchIndex | null;
};

export type StaticSearchSection = {
  id: string;
  heading: string;
  text: string;
};

export type StaticSearchDocument = {
  path: string;
  title: string;
  headings: string[];
  text: string;
  sections: StaticSearchSection[];
};

export type StaticSearchIndex = {
  version: number;
  projectId: string;
  documents: StaticSearchDocument[];
};

export type TextSearchState = {
  query: string;
  open: boolean;
  status: SearchStatus;
  selectedIndex: number;
  statusText: string;
  hits: SearchHit[];
};

export type AppState = {
  project: {
    selectedId: string | null;
    availableIds: string[];
    entries: ProjectRegistryEntry[];
    runtime: ProjectRuntime | null;
  };
  currentDoc: string | null;
  theme: ThemeName;
  document: {
    title: string;
    subtitle: string;
    rawLink: string;
    status: DocumentStatus;
  };
  documentView: {
    html: string;
  };
  search: {
    query: string;
  };
  textSearch: TextSearchState;
  tree: {
    filter: string;
    activePath: string | null;
    expandedPaths: string[];
  };
  sidebar: {
    width: number;
    collapsed: boolean;
  };
  optionsMenu: {
    open: boolean;
  };
};

export type AppShell = {
  rootEl: HTMLElement;
  appEl: HTMLElement;
  treeEl: HTMLElement;
  viewerEl: HTMLElement;
  titleEl: HTMLElement;
  subtitleEl: HTMLElement;
  rawLinkEl: HTMLAnchorElement;
  sourceLinkEl: HTMLAnchorElement;
  sourceLinkIconEl: HTMLElement;
  supportLinkEl: HTMLAnchorElement;
  supportLinkIconEl: HTMLElement;
  supportLinkLabelEl: HTMLElement;
  projectSwitchWrapEl: HTMLElement;
  projectSwitchToggleEl: HTMLButtonElement;
  projectSwitchLabelEl: HTMLElement;
  projectSwitchMenuEl: HTMLElement;
  projectSwitchGroupsEl: HTMLElement;
  searchEl: HTMLInputElement;
  globalSearchToggleEl: HTMLButtonElement;
  globalSearchToggleIconEl: HTMLElement;
  globalSearchEl: HTMLInputElement;
  globalSearchModalEl: HTMLElement;
  globalSearchResultsEl: HTMLElement;
  globalSearchStatusEl: HTMLElement;
  optionsToggleEl: HTMLButtonElement;
  optionsToggleIconEl: HTMLElement;
  optionsMenuEl: HTMLElement;
  themeRowEl: HTMLElement;
  themeToggleEl: HTMLButtonElement;
  sidebarToggleEl: HTMLButtonElement;
  sidebarToggleIconEl: HTMLElement;
  sidebarResizerEl: HTMLElement;
  faviconEl: HTMLLinkElement;
  highlightDarkThemeEl: HTMLLinkElement;
  highlightLightThemeEl: HTMLLinkElement;
};

export type DocController = {
  install: () => void;
  renderTree: () => void;
  renderCurrentDoc: () => Promise<void>;
  rerenderDiagramsForTheme: () => Promise<void>;
};

export type AppController = {
  install: () => void;
  start: () => Promise<void>;
  selectProject: (projectId: string) => void;
};

export type Dispose = () => void;

export type SearchHit = {
  path: string;
  line: number;
  column: number;
  preview: string;
  matchText: string;
  start: number;
  end: number;
};
