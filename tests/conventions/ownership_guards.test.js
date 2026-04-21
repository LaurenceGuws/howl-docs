const fs = require("fs");
const path = require("path");
const { equal, ok } = require("../helpers/assert");

const repoRoot = path.resolve(__dirname, "../..");

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

function relative(absolutePath) {
  return path.relative(repoRoot, absolutePath);
}

function read(absolutePath) {
  return fs.readFileSync(absolutePath, "utf8");
}

function assertRestrictedUsage(pattern, allowedFiles, message) {
  const files = collectTsFiles(path.join(repoRoot, "ts"));
  const offenders = [];
  const actualOwners = [];

  for (const file of files) {
    const source = read(file);
    if (!pattern.test(source)) continue;
    const rel = relative(file);
    actualOwners.push(rel);
    ok(allowedFiles.has(rel), `${message}: ${rel}`);
  }

  equal(
    actualOwners.length,
    allowedFiles.size,
    `${message}: allowlist must match actual usage exactly.`,
  );
}

function testLocalStorageOwnership() {
  assertRestrictedUsage(
    /\blocalStorage\./,
    new Set(["ts/state.ts"]),
    "localStorage access must stay in the state seam",
  );
}

function testHistoryOwnership() {
  assertRestrictedUsage(
    /\bhistory\.(pushState|replaceState)\b/,
    new Set(["ts/app_controller.ts", "ts/config.ts"]),
    "history mutation must stay in routing/controller seams",
  );
}

function testDocumentLevelQueryOwnership() {
  assertRestrictedUsage(
    /\bdocument\.(querySelector|querySelectorAll|getElementById)\b/,
    new Set(["ts/shell/shell_dom.ts", "ts/main.ts"]),
    "document-level queries must stay in named ownership seams",
  );
}

function testDocumentLevelListenerOwnership() {
  assertRestrictedUsage(
    /\bdocument\.addEventListener\b/,
    new Set(["ts/options_menu.ts", "ts/search/doc_search.ts"]),
    "document-level listeners must stay in named ownership seams",
  );
}

function testWindowLevelListenerOwnership() {
  assertRestrictedUsage(
    /\bwindow\.addEventListener\b/,
    new Set(["ts/app_controller.ts", "ts/docs/doc_routing.ts"]),
    "window-level listeners must stay in named ownership seams",
  );
}

module.exports = [
  {
    name: "localStorage ownership stays in state.ts",
    run: testLocalStorageOwnership,
  },
  {
    name: "history ownership stays in controller/config seams",
    run: testHistoryOwnership,
  },
  {
    name: "document-level query ownership stays in named seams",
    run: testDocumentLevelQueryOwnership,
  },
  {
    name: "document-level listener ownership stays in named seams",
    run: testDocumentLevelListenerOwnership,
  },
  {
    name: "window-level listener ownership stays in named seams",
    run: testWindowLevelListenerOwnership,
  },
];
