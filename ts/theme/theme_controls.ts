import { renderHighlightedCode } from "../docs/highlight.js";
import { installOptionsMenu } from "../options_menu.js";
import { persistTheme, setTheme } from "../state.js";
import type {
  AppShell,
  AppState,
  DocController,
  Dispose,
  ThemeName,
} from "../shared/types.js";
import type { HighlightJsApi } from "../shared/vendor_types.js";
import { applyTheme } from "./theme.js";

export function installThemeControls(args: {
  state: AppState;
  shell: AppShell;
  docController: DocController;
  hljs?: HighlightJsApi;
  onThemeApplied?: () => void;
}): Dispose {
  const { state, shell, docController, hljs, onThemeApplied } = args;
  let removeThemeListeners: Dispose = () => {};
  const cleanupOptionsMenu = installOptionsMenu({
    state,
    optionsToggleEl: shell.optionsToggleEl,
    optionsMenuEl: shell.optionsMenuEl,
    onThemeToggle(registerClose: () => void) {
      const handleThemeToggle = async (): Promise<void> => {
        const nextTheme: ThemeName = state.theme === "dark" ? "light" : "dark";
        registerClose();
        setTheme(state, nextTheme);
        await applyTheme(
          shell.rootEl,
          shell.themeToggleEl,
          state.theme,
          persistTheme,
          () => docController.rerenderDiagramsForTheme(),
        );
        onThemeApplied?.();
        renderHighlightedCode(hljs, shell.viewerEl);
      };

      const handleThemeToggleClick = async (event: MouseEvent): Promise<void> => {
        event.stopPropagation();
        await handleThemeToggle();
      };
      const handleThemeRowClick = async (): Promise<void> => {
        await handleThemeToggle();
      };

      shell.themeToggleEl.addEventListener("click", handleThemeToggleClick);
      shell.themeRowEl.addEventListener("click", handleThemeRowClick);
      removeThemeListeners = () => {
        shell.themeToggleEl.removeEventListener("click", handleThemeToggleClick);
        shell.themeRowEl.removeEventListener("click", handleThemeRowClick);
      };
    },
  });

  return () => {
    removeThemeListeners();
    cleanupOptionsMenu();
  };
}
