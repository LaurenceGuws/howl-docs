const fs = require("fs");
const path = require("path");
const { equal, ok } = require("../helpers/assert");

const repoRoot = path.resolve(__dirname, "../..");

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function loadExternalJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function testProjectManifestsExposeDeterministicCategories() {
  const repoProject = loadJson("app_architecture/docs_browser/project.howl-docs.json");
  equal(
    repoProject.category,
    "Infrastructure",
    "Repo-local project manifest should declare the infrastructure category.",
  );

  const externalProjects = [
    {
      path: "/home/home/personal/zbar/tools/docs_browser/project.zbar.json",
      category: "Applications",
    },
    {
      path: "/home/home/personal/zide/app_architecture/docs_browser/project.zide.json",
      category: "Applications",
    },
    {
      path: "/home/home/personal/cwatch/tools/docs_browser/project.cwatch.json",
      category: "Applications",
    },
    {
      path: "/home/home/personal/wayspot/tools/docs_browser/project.wayspot.json",
      category: "Services",
    },
  ];

  for (const project of externalProjects) {
    ok(fs.existsSync(project.path), `Expected active test project manifest to exist: ${project.path}`);
    const manifest = loadExternalJson(project.path);
    equal(
      manifest.category,
      project.category,
      `Expected ${path.basename(project.path)} to declare category ${project.category}.`,
    );
  }
}

module.exports = [
  {
    name: "project manifests expose deterministic categories",
    run: testProjectManifestsExposeDeterministicCategories,
  },
];
