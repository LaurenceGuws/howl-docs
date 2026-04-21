const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { equal, ok } = require("../helpers/assert");

const repoRoot = path.resolve(__dirname, "../..");

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function tokenizeQuery(query) {
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

function scoreFieldMatch(text, tokens) {
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

function buildStaticHitPaths(index, query) {
  const normalizedQuery = query.trim().toLowerCase();
  const tokens = tokenizeQuery(query);
  if (!normalizedQuery || !tokens.length) return [];

  const hits = index.documents.flatMap((document) => {
    const sections = document.sections ?? [];
    if (scoreFieldMatch(document.path, tokens)) return [document.path];
    if (scoreFieldMatch(document.title, tokens)) return [document.path];
    for (const section of sections) {
      if (section.heading && scoreFieldMatch(section.heading, tokens)) {
        return [document.path];
      }
      const sectionText = section.heading
        ? `${section.heading} ${section.text}`
        : section.text;
      if (scoreFieldMatch(sectionText, tokens)) {
        return [document.path];
      }
    }
    if (scoreFieldMatch(document.text, tokens)) return [document.path];
    return [];
  });

  return Array.from(new Set(hits)).sort((a, b) => a.localeCompare(b));
}

function buildRgHitPaths(query, docs) {
  let output = "";
  try {
    output = execFileSync("rg", ["-l", "-i", "-F", query, ...docs], {
      cwd: repoRoot,
      encoding: "utf8",
    });
  } catch (error) {
    if (error && typeof error === "object" && error.status === 1) {
      return [];
    }
    throw error;
  }
  return output
    .trim()
    .split("\n")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function testSearchRecallAgainstRg() {
  const docs = loadJson("app_architecture/docs_browser/docs-index.howl-docs.json");
  const index = loadJson("app_architecture/docs_browser/search-index.howl-docs.json");
  const queries = ["zide", "~/.config/zide/lua/zide-meta", "zide-meta"];

  for (const query of queries) {
    const rgHits = buildRgHitPaths(query, docs);
    const staticHits = buildStaticHitPaths(index, query);
    const staticHitSet = new Set(staticHits);
    const missing = rgHits.filter((hit) => !staticHitSet.has(hit));
    ok(
      missing.length === 0,
      `Static search must not under-recall indexed docs for query "${query}". Missing: ${missing.join(", ")}`,
    );
    equal(
      staticHits.length,
      rgHits.length,
      `Static search hit count should match rg for query "${query}".`,
    );
  }
}

module.exports = [
  {
    name: "static search recall matches rg on indexed docs",
    run: testSearchRecallAgainstRg,
  },
];
