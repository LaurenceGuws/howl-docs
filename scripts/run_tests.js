const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const testsRoot = path.join(repoRoot, "tests");
const filter = process.argv[2] || "";

function collectTestFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith(".test.js")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

async function main() {
  const files = collectTestFiles(testsRoot).filter((file) => file.includes(filter));
  let failures = 0;

  for (const file of files) {
    const suite = require(file);
    const tests = Array.isArray(suite) ? suite : [suite];
    const relative = path.relative(repoRoot, file);

    for (const test of tests) {
      try {
        await test.run();
        console.log(`PASS ${relative} :: ${test.name}`);
      } catch (error) {
        failures += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`FAIL ${relative} :: ${test.name}`);
        console.error(message);
      }
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`PASS all tests (${files.length} files)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
