const fs = require("fs");
const path = require("path");
const { match, ok } = require("../helpers/assert");

const repoRoot = path.resolve(__dirname, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function testFeatureInstallersReturnDisposers() {
  const files = [
    "ts/layout.ts",
    "ts/options_menu.ts",
    "ts/theme/theme_controls.ts",
    "ts/search/doc_search.ts",
    "ts/docs/doc_routing.ts",
    "ts/shell/app_shell.ts",
  ];

  for (const file of files) {
    const source = read(file);
    ok(
      /import type\s*\{[\s\S]*\bDispose\b[\s\S]*\}\s*from/.test(source),
      `Feature installer file must import Dispose: ${file}`,
    );
    match(
      source,
      /export function install[A-Za-z0-9_]+\([\s\S]*?\):\s*Dispose\s*\{/,
      `Feature installer must return Dispose explicitly: ${file}`,
    );
    match(
      source,
      /return\s*\(\)\s*=>\s*\{/,
      `Feature installer must expose cleanup through a disposer: ${file}`,
    );
  }
}

module.exports = [
  {
    name: "runtime feature installers return disposers",
    run: testFeatureInstallersReturnDisposers,
  },
];
