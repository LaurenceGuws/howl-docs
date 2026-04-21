const fs = require("fs");
const path = require("path");
const { equal, ok } = require("../helpers/assert");

const repoRoot = path.resolve(__dirname, "../..");

const allowedInnerHtmlOwners = new Set([
  "ts/docs/viewer_state.ts",
  "ts/docs/highlight.ts",
  "ts/docs/mermaid.ts",
  "ts/docs/markdown.ts",
  "ts/shell/shell_icons.ts",
  "ts/tree/tree.ts",
  "ts/shell/app_shell.ts",
  "ts/search/doc_search.ts",
  "ts/docs/view_state.ts",
]);

function collectTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function testInnerHtmlUsageHasExplicitOwners() {
  const tsRoot = path.join(repoRoot, "ts");
  const files = collectTsFiles(tsRoot);
  const offenders = [];

  for (const absolutePath of files) {
    const relativePath = path.relative(repoRoot, absolutePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    const matches = source.match(/\binnerHTML\b/g) ?? [];
    if (matches.length === 0) continue;
    ok(
      allowedInnerHtmlOwners.has(relativePath),
      `innerHTML usage requires explicit ownership: ${relativePath}`,
    );
    offenders.push(relativePath);
  }

  equal(
    offenders.length,
    allowedInnerHtmlOwners.size,
    "Allowed innerHTML owner list must match actual owned usage exactly.",
  );
}

module.exports = [
  {
    name: "markup ownership restricts innerHTML to named files",
    run: testInnerHtmlUsageHasExplicitOwners,
  },
];
