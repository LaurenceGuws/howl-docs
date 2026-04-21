import { applySidebarWidth, syncResponsiveSidebarState } from "../layout.js";
import { injectShellIcons } from "./shell_icons.js";
import { applyProjectTheme } from "../theme/project_theme.js";
import { syncThemeVariables, updateThemeToggle } from "../theme/theme.js";
import { resolveProjectIcon } from "../shared/branding.js";
import type {
  AppShell,
  AppState,
  Dispose,
  ProjectConfig,
} from "../shared/types.js";

export async function initializeAppShell(args: {
  shell: AppShell;
  project: ProjectConfig;
  state: AppState;
}): Promise<void> {
  const { shell, project, state } = args;
  document.title = project.title;
  shell.faviconEl.href = resolveProjectIcon(project);
  shell.sourceLinkEl.href = project.repoUrl ?? "#";
  if (project.supportUrl) {
    shell.supportLinkEl.href = project.supportUrl;
    shell.supportLinkLabelEl.textContent = project.supportLabel ?? "Support";
    shell.supportLinkEl.hidden = false;
  } else {
    shell.supportLinkEl.hidden = true;
  }
  await injectShellIcons({
    sourceLinkIconEl: shell.sourceLinkIconEl,
    supportLinkIconEl: shell.supportLinkIconEl,
    optionsToggleIconEl: shell.optionsToggleIconEl,
    sidebarToggleIconEl: shell.sidebarToggleIconEl,
    globalSearchToggleIconEl: shell.globalSearchToggleIconEl,
  });

  applyProjectTheme(shell.rootEl, project);
  shell.rootEl.dataset.theme = state.theme;
  syncThemeVariables(shell.rootEl, state.theme);
  syncHighlightTheme(shell, state.theme);
  applySidebarWidth(shell.appEl, state, state.sidebar.width);
  syncResponsiveSidebarState(shell.appEl, state);
  updateThemeToggle(shell.themeToggleEl, state.theme);
}

export function syncHighlightTheme(
  shell: AppShell,
  theme: AppState["theme"],
): void {
  const isDark = theme === "dark";
  shell.highlightDarkThemeEl.disabled = !isDark;
  shell.highlightLightThemeEl.disabled = isDark;
}

export function installProjectSwitcher(args: {
  shell: AppShell;
  state: AppState;
  onSelectProject: (projectId: string) => void;
}): Dispose {
  const { shell, state, onSelectProject } = args;
  const projects = state.project.entries;
  const selectedProjectId = state.project.selectedId;
  if (projects.length <= 1) {
    shell.projectSwitchWrapEl.hidden = true;
    return () => {};
  }

  shell.projectSwitchWrapEl.hidden = false;
  shell.projectSwitchLabelEl.textContent = selectedProjectLabel(
    projects,
    selectedProjectId,
  );
  shell.projectSwitchGroupsEl.innerHTML = renderProjectSwitchGroups(
    projects,
    selectedProjectId,
  );
  shell.projectSwitchMenuEl.hidden = true;
  shell.projectSwitchToggleEl.setAttribute("aria-expanded", "false");

  const handleToggle = (): void => {
    const nextOpen = shell.projectSwitchMenuEl.hidden;
    shell.projectSwitchMenuEl.hidden = !nextOpen;
    shell.projectSwitchToggleEl.setAttribute(
      "aria-expanded",
      nextOpen ? "true" : "false",
    );
  };

  const handleClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLElement>("[data-project-id]");
    const projectId = button?.dataset.projectId;
    if (!projectId) return;
    shell.projectSwitchMenuEl.hidden = true;
    shell.projectSwitchToggleEl.setAttribute("aria-expanded", "false");
    onSelectProject(projectId);
  };

  const handleFocusOut = (event: FocusEvent): void => {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && shell.projectSwitchWrapEl.contains(relatedTarget)) {
      return;
    }
    shell.projectSwitchMenuEl.hidden = true;
    shell.projectSwitchToggleEl.setAttribute("aria-expanded", "false");
  };

  const handleEscape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    shell.projectSwitchMenuEl.hidden = true;
    shell.projectSwitchToggleEl.setAttribute("aria-expanded", "false");
    shell.projectSwitchToggleEl.focus();
  };

  shell.projectSwitchToggleEl.addEventListener("click", handleToggle);
  shell.projectSwitchGroupsEl.addEventListener("click", handleClick);
  shell.projectSwitchWrapEl.addEventListener("focusout", handleFocusOut);
  shell.projectSwitchWrapEl.addEventListener("keydown", handleEscape);

  return () => {
    shell.projectSwitchToggleEl.removeEventListener("click", handleToggle);
    shell.projectSwitchGroupsEl.removeEventListener("click", handleClick);
    shell.projectSwitchWrapEl.removeEventListener("focusout", handleFocusOut);
    shell.projectSwitchWrapEl.removeEventListener("keydown", handleEscape);
  };
}

function selectedProjectLabel(
  projects: AppState["project"]["entries"],
  selectedProjectId: string | null,
): string {
  return projects.find((project) => project.id === selectedProjectId)?.label
    ?? "Choose project";
}

function renderProjectSwitchGroups(
  projects: AppState["project"]["entries"],
  selectedProjectId: string | null,
): string {
  const groupedProjects = new Map<string, typeof projects>();

  for (const project of [...projects].sort((a, b) =>
    a.category.localeCompare(b.category) ||
    a.label.localeCompare(b.label) ||
    a.id.localeCompare(b.id),
  )) {
    const category = project.category || "Other";
    const group = groupedProjects.get(category);
    if (group) {
      group.push(project);
      continue;
    }
    groupedProjects.set(category, [project]);
  }

  return [...groupedProjects.entries()]
    .map(([category, categoryProjects]) => {
      const items = categoryProjects
        .map((project) => {
          const selected = project.id === selectedProjectId ? " active" : "";
          const current = project.id === selectedProjectId ? ' aria-current="true"' : "";
          return `<button class="project-switch-item${selected}" type="button" data-project-id="${escapeAttribute(project.id)}"${current}>${escapeHtml(project.label)}</button>`;
        })
        .join("");
      return `<section class="project-switch-group"><div class="project-switch-group-label">${escapeHtml(category)}</div><div class="project-switch-group-items">${items}</div></section>`;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
