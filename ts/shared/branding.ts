import type { ProjectConfig } from "./types.js";

export const NEUTRAL_PROJECT_ICON_PATH = "./assets/icons/folder.svg";

export function resolveProjectIcon(project: ProjectConfig): string {
  const icon = project.icon?.trim();
  return icon || NEUTRAL_PROJECT_ICON_PATH;
}

export function resolveProjectWordmark(project: ProjectConfig): string | undefined {
  const wordmark = project.brandWordmarkText?.trim();
  return wordmark || undefined;
}
