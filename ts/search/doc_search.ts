import {
  setTextSearchHits,
  setTextSearchState,
} from "../state.js";
import { docHash, escapeHtml } from "../shared/utils.js";
import type {
  AppShell,
  AppState,
  Dispose,
  SearchHit,
  StaticSearchDocument,
  TextSearchState,
} from "../shared/types.js";

const SEARCH_LIMIT = 80;
const SEARCH_DEBOUNCE_MS = 120;
const UNAVAILABLE_STATUS_TEXT = "Search index unavailable for this project.";
const STATIC_READY_STATUS_TEXT = "Type to search across indexed docs.";
const SNIPPET_WINDOW = 220;

type ScoredHit = SearchHit & {
  score: number;
};

type SearchCandidate = {
  preview: string;
  line: number;
  matchText: string;
  start: number;
  end: number;
};

function nextSearchState(
  current: TextSearchState,
  patch: Partial<TextSearchState>,
): TextSearchState {
  return {
    ...current,
    ...patch,
  };
}

function renderPreview(hit: SearchHit, query: string): string {
  const preview = hit.preview || "";
  const hasRange =
    hit.start >= 0 &&
    hit.end > hit.start &&
    hit.end <= preview.length;
  if (hasRange) {
    return (
      `${escapeHtml(preview.slice(0, hit.start))}` +
      `<mark>${escapeHtml(preview.slice(hit.start, hit.end))}</mark>` +
      `${escapeHtml(preview.slice(hit.end))}`
    );
  }
  const lowerPreview = preview.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerQuery ? lowerPreview.indexOf(lowerQuery) : -1;
  if (matchIndex < 0) return escapeHtml(preview);
  return (
    `${escapeHtml(preview.slice(0, matchIndex))}` +
    `<mark>${escapeHtml(preview.slice(matchIndex, matchIndex + query.length))}</mark>` +
    `${escapeHtml(preview.slice(matchIndex + query.length))}`
  );
}

function tokenizeQuery(query: string): string[] {
  return Array.from(new Set(
    query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .flatMap((token) => {
        if (!token) return [];
        if (/^[a-z0-9.-]+$/.test(token)) return [token];
        return token
          .split(/[^a-z0-9.-]+/)
          .filter((part) => part.length >= 2);
      }),
  ));
}

function buildSnippet(text: string, start: number, end: number): {
  preview: string;
  start: number;
  end: number;
} {
  const source = text.trim();
  if (!source) {
    return {
      preview: "",
      start: 0,
      end: 0,
    };
  }

  const maxStart = Math.max(0, source.length - SNIPPET_WINDOW);
  const centeredStart = Math.max(0, start - Math.floor((SNIPPET_WINDOW - (end - start)) / 2));
  let sliceStart = Math.min(centeredStart, maxStart);
  let sliceEnd = Math.min(source.length, sliceStart + SNIPPET_WINDOW);

  if (sliceStart > 0) {
    const nextSpace = source.indexOf(" ", sliceStart);
    if (nextSpace > -1 && nextSpace < sliceEnd - 20) {
      sliceStart = nextSpace + 1;
    }
  }
  if (sliceEnd < source.length) {
    const prevSpace = source.lastIndexOf(" ", sliceEnd);
    if (prevSpace > sliceStart + 20) {
      sliceEnd = prevSpace;
    }
  }

  const prefix = sliceStart > 0 ? "… " : "";
  const suffix = sliceEnd < source.length ? " …" : "";
  return {
    preview: `${prefix}${source.slice(sliceStart, sliceEnd)}${suffix}`,
    start: start - sliceStart + prefix.length,
    end: end - sliceStart + prefix.length,
  };
}

function scoreFieldMatch(
  text: string,
  tokens: string[],
): { start: number; end: number } | null {
  const lowerText = text.toLowerCase();
  const positions = tokens.map((token) => lowerText.indexOf(token));
  if (positions.some((position) => position < 0)) return null;

  const firstStart = Math.min(...positions);
  const firstToken = tokens[positions.indexOf(firstStart)] ?? tokens[0];
  return {
    start: firstStart,
    end: firstStart + firstToken.length,
  };
}

function pickBestCandidate(
  current: ScoredHit | null,
  next: SearchCandidate,
  path: string,
): ScoredHit {
  const snippet = buildSnippet(next.preview, next.start, next.end);
  const scoredHit: ScoredHit = {
    path,
    line: next.line,
    column: next.start + 1,
    preview: snippet.preview,
    matchText: next.matchText,
    start: snippet.start,
    end: snippet.end,
    score: 0,
  };

  if (!current) return scoredHit;
  if (scoredHit.line !== current.line) {
    return scoredHit.line < current.line ? scoredHit : current;
  }
  if (scoredHit.column !== current.column) {
    return scoredHit.column < current.column ? scoredHit : current;
  }
  return scoredHit.path.localeCompare(current.path) < 0 ? scoredHit : current;
}

function buildStaticHits(
  documents: StaticSearchDocument[],
  query: string,
): SearchHit[] {
  const normalizedQuery = query.trim().toLowerCase();
  const tokens = tokenizeQuery(query);
  if (!normalizedQuery || !tokens.length) return [];

  const hits = documents.flatMap((document) => {
    let best: ScoredHit | null = null;

    const pathMatch = scoreFieldMatch(document.path, tokens);
    if (pathMatch) {
      best = pickBestCandidate(best, {
        preview: document.path,
        line: 1,
        matchText: normalizedQuery,
        start: pathMatch.start,
        end: pathMatch.end,
      }, document.path);
    }

    const titleMatch = scoreFieldMatch(document.title, tokens);
    if (titleMatch) {
      best = pickBestCandidate(best, {
        preview: document.title,
        line: 1,
        matchText: normalizedQuery,
        start: titleMatch.start,
        end: titleMatch.end,
      }, document.path);
    }

    document.sections.forEach((section, index) => {
      if (section.heading) {
        const headingMatch = scoreFieldMatch(section.heading, tokens);
        if (headingMatch) {
          best = pickBestCandidate(best, {
            preview: section.heading,
            line: index + 2,
            matchText: normalizedQuery,
            start: headingMatch.start,
            end: headingMatch.end,
          }, document.path);
        }
      }

      const sectionText = section.heading
        ? `${section.heading} ${section.text}`
        : section.text;
      const sectionMatch = scoreFieldMatch(sectionText, tokens);
      if (sectionMatch) {
        best = pickBestCandidate(best, {
          preview: sectionText,
          line: index + 2,
          matchText: normalizedQuery,
          start: sectionMatch.start,
          end: sectionMatch.end,
        }, document.path);
      }
    });

    const bodyMatch = scoreFieldMatch(document.text, tokens);
    if (bodyMatch) {
      best = pickBestCandidate(best, {
        preview: document.text,
        line: 1,
        matchText: normalizedQuery,
        start: bodyMatch.start,
        end: bodyMatch.end,
      }, document.path);
    }

    return best ? [best] : [];
  });

  return hits
    .sort((a, b) =>
      a.path.localeCompare(b.path) ||
      a.line - b.line ||
      a.column - b.column,
    )
    .slice(0, SEARCH_LIMIT)
    .map(({ score: _score, ...hit }) => hit);
}

export function installDocSearch(args: {
  state: AppState;
  shell: AppShell;
}): Dispose {
  const { state, shell } = args;
  const projectRuntime = state.project.runtime;
  const staticSearchIndex = projectRuntime?.searchIndex ?? null;
  const hasStaticSearch = Boolean(staticSearchIndex?.documents.length);

  function renderHits(): void {
    const { hits, query, selectedIndex } = state.textSearch;
    shell.globalSearchResultsEl.innerHTML = hits
      .map((hit, index) => {
        const selected = index === selectedIndex;
        return `
          <button
            class="search-hit ${selected ? "active" : ""}"
            type="button"
            data-search-hit-index="${index}"
            role="option"
            aria-selected="${selected ? "true" : "false"}"
          >
            <span class="search-hit-path">${escapeHtml(hit.path)}</span>
            <span class="search-hit-meta">L${hit.line}:${hit.column}</span>
            <span class="search-hit-preview">${renderPreview(hit, query)}</span>
          </button>
        `;
      })
      .join("");
  }

  function renderSearchUi(): void {
    shell.globalSearchModalEl.hidden = !state.textSearch.open;
    shell.globalSearchToggleEl.setAttribute(
      "aria-expanded",
      state.textSearch.open ? "true" : "false",
    );
    shell.globalSearchStatusEl.textContent = state.textSearch.statusText;
    renderHits();
  }

  function setSearchUi(next: TextSearchState): void {
    setTextSearchState(state, next);
    renderSearchUi();
  }

  function scrollSelectedHitIntoView(): void {
    if (state.textSearch.selectedIndex < 0) return;
    const selectedEl = shell.globalSearchResultsEl.querySelector<HTMLElement>(
      `[data-search-hit-index="${state.textSearch.selectedIndex}"]`,
    );
    selectedEl?.scrollIntoView({ block: "nearest" });
  }

  function closeModal(): void {
    abortController?.abort();
    abortController = null;
    setSearchUi(nextSearchState(state.textSearch, {
      query: shell.globalSearchEl.value,
      open: false,
      selectedIndex: -1,
      hits: [],
    }));
  }

  function openModal(): void {
    setSearchUi(nextSearchState(state.textSearch, {
      open: true,
    }));
    queueMicrotask(() => {
      shell.globalSearchEl.focus();
      shell.globalSearchEl.select();
    });
  }

  function openSelectedHit(index: number): void {
    const hit = state.textSearch.hits[index];
    if (!hit) return;
    location.hash = docHash(hit.path, state.textSearch.query);
    shell.globalSearchEl.blur();
    closeModal();
  }

  if (!hasStaticSearch) {
    shell.globalSearchToggleEl.disabled = true;
    shell.globalSearchEl.disabled = true;
    shell.globalSearchEl.placeholder = "Search unavailable";
    setSearchUi({
      query: "",
      open: false,
      status: "unavailable",
      selectedIndex: -1,
      statusText: UNAVAILABLE_STATUS_TEXT,
      hits: [],
    });
    return () => {};
  }

  let debounceTimer = 0;
  let requestToken = 0;
  let abortController: AbortController | null = null;

  async function runSearch(query: string): Promise<void> {
    abortController?.abort();
    requestToken += 1;
    const token = requestToken;
    setTextSearchHits(state, { hits: [], selectedIndex: -1 });
    renderSearchUi();

    if (!query.trim()) {
      setSearchUi({
        query,
        open: false,
        status: "idle",
        selectedIndex: -1,
        statusText: STATIC_READY_STATUS_TEXT,
        hits: [],
      });
      return;
    }

    abortController = new AbortController();
    setSearchUi({
      query,
      open: true,
      status: "loading",
      selectedIndex: -1,
      statusText: `Searching ${staticSearchIndex?.documents.length ?? 0} indexed docs for “${query}”…`,
      hits: [],
    });

    try {
      if (!staticSearchIndex) {
        throw new Error("Search index unavailable.");
      }
      const hits = buildStaticHits(staticSearchIndex.documents, query);
      if (token !== requestToken) return;
      setSearchUi({
        query,
        open: true,
        status: "ready",
        selectedIndex: hits.length ? 0 : -1,
        statusText: hits.length
          ? `${hits.length} result${hits.length === 1 ? "" : "s"} for “${query}”.`
          : `No results for “${query}”.`,
        hits,
      });
      scrollSelectedHitIntoView();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setSearchUi({
        query,
        open: true,
        status: "error",
        selectedIndex: -1,
        statusText: `Search failed: ${String(err)}`,
        hits: [],
      });
    }
  }

  const handleFocus = (): void => {
    if (state.textSearch.query.trim()) {
      setSearchUi(nextSearchState(state.textSearch, { open: true }));
    }
  };

  const handleToggleClick = (): void => {
    if (state.textSearch.open) {
      closeModal();
      return;
    }
    openModal();
  };

  const handleInput = (): void => {
    window.clearTimeout(debounceTimer);
    const query = shell.globalSearchEl.value;
    debounceTimer = window.setTimeout(() => {
      void runSearch(query);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      closeModal();
      shell.globalSearchEl.value = "";
      setSearchUi({
        query: "",
        open: false,
        status: "idle",
        selectedIndex: -1,
        statusText: STATIC_READY_STATUS_TEXT,
        hits: [],
      });
      return;
    }

    if (!state.textSearch.hits.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.min(
        state.textSearch.hits.length - 1,
        Math.max(0, state.textSearch.selectedIndex + 1),
      );
      setSearchUi(nextSearchState(state.textSearch, { selectedIndex: nextIndex }));
      scrollSelectedHitIntoView();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.max(0, state.textSearch.selectedIndex - 1);
      setSearchUi(nextSearchState(state.textSearch, { selectedIndex: nextIndex }));
      scrollSelectedHitIntoView();
      return;
    }

    if (event.key === "Enter" && state.textSearch.selectedIndex >= 0) {
      event.preventDefault();
      openSelectedHit(state.textSearch.selectedIndex);
    }
  };

  const handleResultsClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLElement>("[data-search-hit-index]");
    if (!button) return;
    const index = Number(button.dataset.searchHitIndex);
    if (Number.isNaN(index)) return;
    openSelectedHit(index);
  };

  const handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (
      !shell.globalSearchModalEl.hidden &&
      !shell.globalSearchModalEl.contains(target) &&
      !shell.globalSearchEl.contains(target) &&
      !shell.globalSearchToggleEl.contains(target)
    ) {
      closeModal();
    }
  };

  shell.globalSearchEl.placeholder = hasStaticSearch
    ? "Search indexed docs..."
    : "Search docs...";

  shell.globalSearchEl.addEventListener("focus", handleFocus);
  shell.globalSearchToggleEl.addEventListener("click", handleToggleClick);
  shell.globalSearchEl.addEventListener("input", handleInput);
  shell.globalSearchEl.addEventListener("keydown", handleKeyDown);
  shell.globalSearchResultsEl.addEventListener("click", handleResultsClick);
  document.addEventListener("click", handleDocumentClick);

  setSearchUi({
    query: "",
    open: false,
    status: "idle",
    selectedIndex: -1,
    statusText: STATIC_READY_STATUS_TEXT,
    hits: [],
  });

  return () => {
    abortController?.abort();
    window.clearTimeout(debounceTimer);
    shell.globalSearchEl.removeEventListener("focus", handleFocus);
    shell.globalSearchToggleEl.removeEventListener("click", handleToggleClick);
    shell.globalSearchEl.removeEventListener("input", handleInput);
    shell.globalSearchEl.removeEventListener("keydown", handleKeyDown);
    shell.globalSearchResultsEl.removeEventListener("click", handleResultsClick);
    document.removeEventListener("click", handleDocumentClick);
  };
}
