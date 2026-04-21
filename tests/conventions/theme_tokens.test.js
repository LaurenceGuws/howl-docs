const fs = require("fs");
const path = require("path");
const { match, ok } = require("../helpers/assert");

const repoRoot = path.resolve(__dirname, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function extractRuleBlock(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, "m");
  const match = source.match(pattern);
  ok(match, `Missing CSS rule for selector: ${selector}`);
  return match[1];
}

function testNoLiteralColorsOutsideTheme() {
  const styleDir = path.join(repoRoot, "styles");
  const files = fs.readdirSync(styleDir).filter((file) => file.endsWith(".css"));
  const literalColorPattern = /#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/;

  for (const file of files) {
    if (file === "theme.css") continue;
    const source = fs.readFileSync(path.join(styleDir, file), "utf8");
    ok(
      !literalColorPattern.test(source),
      `Component stylesheet must not contain raw color literals: styles/${file}`,
    );
  }
}

function testTreeActiveStateUsesThemeTokens() {
  const source = read("styles/tree.css");

  const activeLinkBlock = extractRuleBlock(source, ".tree a.active");
  match(
    activeLinkBlock,
    /background:\s*var\(--tree-link-active-bg\)/,
    "Active tree links must use the semantic active background token.",
  );
  match(
    activeLinkBlock,
    /color:\s*var\(--active-link\)/,
    "Active tree links must use the active link foreground token.",
  );

  const activeStemBlock = extractRuleBlock(source, ".tree-folder.active-branch > .folder-children");
  match(
    activeStemBlock,
    /border-left-color:\s*var\(--tree-connector-active\)/,
    "Active tree branches must use the active connector token.",
  );

  const nestedRowBlock = extractRuleBlock(
    source,
    ".folder-children > .folder-dir-list > .tree-item,\n.folder-children > .folder-file-list > .tree-item",
  );
  match(
    nestedRowBlock,
    /padding-left:\s*6px/,
    "Nested tree rows should use simple indentation instead of custom connector geometry.",
  );
}

function testSearchHighlightStatesUseSemanticTokens() {
  const controlsSource = read("styles/controls.css");
  const viewerSource = read("styles/viewer.css");

  match(
    controlsSource,
    /\.search-hit\.active\s*\{[\s\S]*?box-shadow:\s*inset 2px 0 0 var\(--search-result-active-rail\)/,
    "Active search results must use the semantic search active rail token.",
  );

  const searchMarkBlock = extractRuleBlock(controlsSource, ".search-hit-preview mark");
  match(
    searchMarkBlock,
    /background:\s*var\(--search-result-mark-bg\)/,
    "Search result highlights must use the semantic search highlight background token.",
  );
  match(
    searchMarkBlock,
    /color:\s*var\(--search-result-mark-ink\)/,
    "Search result highlights must use the semantic search highlight ink token.",
  );

  const viewerSearchHitBlock = extractRuleBlock(viewerSource, ".viewer-search-hit");
  match(
    viewerSearchHitBlock,
    /background:\s*var\(--search-result-mark-bg\)/,
    "Viewer search hits must use the semantic search highlight background token.",
  );
  match(
    viewerSearchHitBlock,
    /color:\s*var\(--search-result-mark-ink\)/,
    "Viewer search hits must use the semantic search highlight ink token.",
  );
  match(
    viewerSearchHitBlock,
    /box-shadow:\s*0 0 0 1px var\(--search-result-mark-ring\)/,
    "Viewer search hits must use the semantic search highlight ring token.",
  );
}

function testControlInteractionStatesUseSemanticTokens() {
  const controlsSource = read("styles/controls.css");
  const treeSource = read("styles/tree.css");
  const responsiveSource = read("styles/responsive.css");

  match(
    controlsSource,
    /\.project-switch-toggle:focus\s*\{[\s\S]*?border-color:\s*var\(--control-focus-border\)[\s\S]*?box-shadow:\s*inset 0 0 0 1px var\(--control-focus-ring\)/,
    "Project chooser focus must use semantic control focus tokens.",
  );
  match(
    controlsSource,
    /\.spotlight-search-input:focus\s*\{[\s\S]*?border-color:\s*var\(--control-focus-border\)[\s\S]*?box-shadow:\s*inset 0 0 0 1px var\(--control-focus-ring\)/,
    "Spotlight input focus must use semantic control focus tokens.",
  );
  match(
    treeSource,
    /#search:focus\s*\{[\s\S]*?border-color:\s*var\(--control-focus-border\)[\s\S]*?box-shadow:\s*inset 0 0 0 1px var\(--control-focus-ring\)/,
    "Tree filter focus must use semantic control focus tokens.",
  );
  match(
    controlsSource,
    /\.support-link:hover\s*\{[\s\S]*?border-color:\s*var\(--control-accent-hover-border\)[\s\S]*?color:\s*var\(--control-accent-hover-ink\)/,
    "Support link hover must use semantic control hover tokens.",
  );
  match(
    controlsSource,
    /\.sidebar-toggle:hover\s*\{[\s\S]*?border-color:\s*var\(--control-accent-hover-border\)[\s\S]*?color:\s*var\(--control-accent-hover-ink\)/,
    "Sidebar toggle hover must use semantic control hover tokens.",
  );
  match(
    controlsSource,
    /\.theme-switch-thumb\s*\{[\s\S]*?background:\s*var\(--control-accent-soft-bg\)[\s\S]*?border:\s*1px solid var\(--control-accent-soft-border\)/,
    "Theme switch thumb must use semantic control accent-soft tokens.",
  );
  match(
    controlsSource,
    /:root\[data-theme="dark"\] \.theme-switch-option-dark,\s*:root\[data-theme="light"\] \.theme-switch-option-light\s*\{[\s\S]*?color:\s*var\(--control-accent-soft-ink\)/,
    "Theme switch active label must use semantic control accent-soft ink token.",
  );
  match(
    responsiveSource,
    /\.app\[data-sidebar-collapsed="true"\] \.sidebar-toggle\s*\{[\s\S]*?color:\s*var\(--control-accent-hover-ink\)[\s\S]*?border-color:\s*color-mix\(in srgb, var\(--control-accent-hover-border\) 30%, transparent 70%\)/,
    "Collapsed sidebar toggle state must derive from semantic control hover tokens.",
  );
}

module.exports = [
  {
    name: "component styles stay token-driven",
    run: testNoLiteralColorsOutsideTheme,
  },
  {
    name: "tree active state uses semantic theme tokens",
    run: testTreeActiveStateUsesThemeTokens,
  },
  {
    name: "search highlight states use semantic tokens",
    run: testSearchHighlightStatesUseSemanticTokens,
  },
  {
    name: "control interaction states use semantic tokens",
    run: testControlInteractionStatesUseSemanticTokens,
  },
];
