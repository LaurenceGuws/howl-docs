const path = require("path");
const fs = require("fs");
const { equal } = require("../helpers/assert");

async function importBuiltModule(relativePath) {
  const absolutePath = path.resolve(__dirname, "../../build/js", relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
}

async function testRepoRelativeJoiningRules() {
  const { repoRelative, docFetchPath } = await importBuiltModule("shared/utils.js");

  equal(
    repoRelative(".", "README.md"),
    "./README.md",
    'Self-hosted repo paths should resolve from "." as "./<path>".',
  );
  equal(
    repoRelative("/__project_repo/zbar/", "README.md"),
    "/__project_repo/zbar/README.md",
    "Mounted repo paths should preserve trailing-slash roots cleanly.",
  );
  equal(
    repoRelative("/howl-docs", "README.md"),
    "/howl-docs/README.md",
    "Base paths without trailing slash should gain one separator.",
  );
  equal(
    docFetchPath(".", "/README.md"),
    "./README.md",
    "Document fetch paths should normalize leading slashes in doc paths.",
  );
}

module.exports = [
  {
    name: "repo-relative path joining stays explicit and stable",
    run: testRepoRelativeJoiningRules,
  },
];
