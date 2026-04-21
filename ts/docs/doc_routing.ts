import { setSearchQuery } from "../state.js";
import { updateTreeFilter } from "../tree/tree_state.js";
import type { AppState, Dispose } from "../shared/types.js";

export function applySearchQuery(args: {
  state: AppState;
  query: string;
  renderTree: () => void;
}): void {
  const { state, query, renderTree } = args;
  setSearchQuery(state, query);
  updateTreeFilter(state, query);
  renderTree();
}

export function installDocRouting(args: {
  searchEl: HTMLInputElement;
  renderCurrentDoc: () => Promise<void>;
  onSearchQuery: (query: string) => void;
}): Dispose {
  const { searchEl, renderCurrentDoc, onSearchQuery } = args;

  const handleInput = (): void => {
    onSearchQuery(searchEl.value);
  };
  const handleHashChange = (): void => {
    void renderCurrentDoc();
  };

  searchEl.addEventListener("input", handleInput);
  window.addEventListener("hashchange", handleHashChange);

  return () => {
    searchEl.removeEventListener("input", handleInput);
    window.removeEventListener("hashchange", handleHashChange);
  };
}
