import { setOptionsMenuOpen as setOptionsMenuState } from "./state.js";
import type { AppState, Dispose } from "./shared/types.js";

export function installOptionsMenu(args: {
  state: AppState;
  optionsToggleEl: HTMLButtonElement;
  optionsMenuEl: HTMLElement;
  onThemeToggle: (registerClose: () => void) => void;
}): Dispose {
  const { state, optionsToggleEl, optionsMenuEl, onThemeToggle } = args;

  const handleMenuClick = (event: MouseEvent): void => {
    event.stopPropagation();
  };

  const handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (
      !optionsMenuEl.hidden &&
      !optionsMenuEl.contains(target) &&
      !optionsToggleEl.contains(target)
    ) {
      setOptionsMenuOpen(state, optionsToggleEl, optionsMenuEl, false);
    }
  };

  const handleToggleClick = (): void => {
    setOptionsMenuOpen(
      state,
      optionsToggleEl,
      optionsMenuEl,
      optionsMenuEl.hidden,
    );
  };

  onThemeToggle(() => {
    setOptionsMenuOpen(state, optionsToggleEl, optionsMenuEl, false);
  });

  optionsMenuEl.addEventListener("click", handleMenuClick);
  document.addEventListener("click", handleDocumentClick);
  optionsToggleEl.addEventListener("click", handleToggleClick);

  return () => {
    optionsMenuEl.removeEventListener("click", handleMenuClick);
    document.removeEventListener("click", handleDocumentClick);
    optionsToggleEl.removeEventListener("click", handleToggleClick);
  };
}

export function setOptionsMenuOpen(
  state: AppState,
  optionsToggleEl: HTMLButtonElement,
  optionsMenuEl: HTMLElement,
  open: boolean,
): void {
  setOptionsMenuState(state, open);
  optionsMenuEl.hidden = !open;
  optionsToggleEl.setAttribute("aria-expanded", open ? "true" : "false");
}
