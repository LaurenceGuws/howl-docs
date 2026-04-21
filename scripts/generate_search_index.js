#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

function usage() {
  console.error(
    "usage: node scripts/generate_search_index.js <project-manifest-path> [output-path]",
  );
}

function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/```[^\n]*\n([\s\S]*?)```/g, "\n$1\n")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSections(source) {
  const sections = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let current = null;

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      if (current) sections.push(current);
      const heading = headingMatch[2].trim();
      current = {
        id: slugify(heading),
        heading,
        text: "",
      };
      continue;
    }
    if (!current) continue;
    current.text += `${line}\n`;
  }

  if (current) sections.push(current);
  return sections
    .map((section) => ({
      ...section,
      text: normalizeText(section.text),
    }))
    .filter((section) => section.heading || section.text);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveDocsIndexPath(manifestPath, manifest) {
  if (manifest.docsIndexPath) {
    return path.resolve(path.dirname(manifestPath), manifest.docsIndexPath);
  }
  const manifestStem = path.basename(manifestPath, path.extname(manifestPath));
  const projectSuffix = manifestStem.replace(/^project\./, "");
  const projectSpecificPath = path.resolve(
    path.dirname(manifestPath),
    `./docs-index.${projectSuffix}.json`,
  );
  if (fs.existsSync(projectSpecificPath)) {
    return projectSpecificPath;
  }
  const rawDocsIndexPath = "./docs-index.json";
  return path.resolve(path.dirname(manifestPath), rawDocsIndexPath);
}

function resolveRepoRoot(manifestPath, manifest) {
  if (manifest.repoAbsolutePath) {
    return path.resolve(path.dirname(manifestPath), manifest.repoAbsolutePath);
  }

  try {
    const gitRoot = childProcess
      .execFileSync("git", ["-C", path.dirname(manifestPath), "rev-parse", "--show-toplevel"], {
        encoding: "utf8",
      })
      .trim();
    if (gitRoot) return path.resolve(gitRoot);
  } catch {}

  return path.dirname(manifestPath);
}

function titleFromSource(source, fallbackPath) {
  const match = /^#\s+(.+)$/m.exec(source);
  return match ? match[1].trim() : path.basename(fallbackPath);
}

function buildSearchIndex(manifestPath) {
  const resolvedManifestPath = path.resolve(manifestPath);
  const manifest = loadJson(resolvedManifestPath);
  const docsIndexPath = resolveDocsIndexPath(resolvedManifestPath, manifest);
  const repoRoot = resolveRepoRoot(resolvedManifestPath, manifest);
  const docs = loadJson(docsIndexPath);

  if (!Array.isArray(docs)) {
    throw new Error(`Docs index must be an array: ${docsIndexPath}`);
  }

  const projectId =
    manifest.id ||
    path.basename(resolvedManifestPath, path.extname(resolvedManifestPath)).replace(/^project\./, "");

  const documents = docs.map((docPath) => {
    if (typeof docPath !== "string") {
      throw new Error(`Invalid docs index entry: ${String(docPath)}`);
    }
    const resolvedDocPath = path.resolve(repoRoot, docPath);
    const source = fs.readFileSync(resolvedDocPath, "utf8");
    const sections = extractSections(source);
    return {
      path: docPath,
      title: titleFromSource(source, docPath),
      headings: sections.map((section) => section.heading),
      text: normalizeText(source),
      sections,
    };
  });

  return {
    version: 1,
    projectId,
    documents,
  };
}

function main(argv) {
  const manifestPath = argv[2];
  const outputPath = argv[3];

  if (!manifestPath) {
    usage();
    process.exitCode = 1;
    return;
  }

  const index = buildSearchIndex(manifestPath);
  const resolvedManifestPath = path.resolve(manifestPath);
  const defaultOutputPath = path.resolve(
    path.dirname(resolvedManifestPath),
    `search-index.${index.projectId}.json`,
  );
  const resolvedOutputPath = outputPath
    ? path.resolve(outputPath)
    : defaultOutputPath;

  fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(index, null, 2)}\n`);
  console.log(resolvedOutputPath);
}

main(process.argv);
