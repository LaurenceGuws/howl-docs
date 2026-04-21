const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const { JSDOM } = require("jsdom");
const { equal } = require("../helpers/assert");

async function importBuiltModule(relativePath) {
  const absolutePath = path.resolve(__dirname, "../../build/js", relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
}

async function testProjectThemeSwitchClearsStaleOverrides() {
  const dom = new JSDOM("<!doctype html><div id=\"root\"></div>");
  const { window } = dom;
  const previousWindow = global.window;
  const previousDocument = global.document;
  const previousGetComputedStyle = global.getComputedStyle;

  global.window = window;
  global.document = window.document;
  global.getComputedStyle = window.getComputedStyle.bind(window);

  try {
    const rootEl = window.document.getElementById("root");
    rootEl.dataset.theme = "dark";
    rootEl.style.setProperty("--tree-active", "stale-value");

    const { applyProjectTheme } = await importBuiltModule("theme/project_theme.js");
    const { syncThemeVariables } = await importBuiltModule("theme/theme.js");

    const firstProject = {
      title: "First",
      icon: "",
      repoBasePath: ".",
      docsIndexPath: "./docs.json",
      runtimeMode: "local-dev",
      defaultDoc: "README.md",
      theme: {
        dark: {
          accent: "#d47a45",
          treeActive: "rgba(212, 122, 69, 0.55)",
        },
      },
    };

    const secondProject = {
      title: "Second",
      icon: "",
      repoBasePath: ".",
      docsIndexPath: "./docs.json",
      runtimeMode: "local-dev",
      defaultDoc: "README.md",
      theme: {
        dark: {
          accent: "#47b8ff",
        },
      },
    };

    applyProjectTheme(rootEl, firstProject);
    syncThemeVariables(rootEl, "dark");
    equal(
      rootEl.style.getPropertyValue("--accent-dark"),
      "#d47a45",
      "First project should install scoped accent override.",
    );
    equal(
      rootEl.style.getPropertyValue("--tree-active-dark"),
      "rgba(212, 122, 69, 0.55)",
      "First project should install scoped tree active override.",
    );

    applyProjectTheme(rootEl, secondProject);
    syncThemeVariables(rootEl, "dark");

    equal(
      rootEl.style.getPropertyValue("--accent-dark"),
      "#47b8ff",
      "Second project should replace scoped accent override.",
    );
    equal(
      rootEl.style.getPropertyValue("--tree-active-dark"),
      "",
      "Second project must clear stale scoped tree active overrides when it does not provide one.",
    );
    equal(
      rootEl.style.getPropertyValue("--tree-active"),
      "",
      "Resolved tree active var must be cleared when the next project does not provide an override.",
    );
  } finally {
    global.window = previousWindow;
    global.document = previousDocument;
    global.getComputedStyle = previousGetComputedStyle;
    window.close();
  }
}

module.exports = [
  {
    name: "project theme switching clears stale overrides",
    run: testProjectThemeSwitchClearsStaleOverrides,
  },
];
