const path = require("path");
const fs = require("fs");
const { equal } = require("../helpers/assert");

async function importBuiltModule(relativePath) {
  const absolutePath = path.resolve(__dirname, "../../build/js", relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
}

async function testBrandingFallbackIsNeutralAndShared() {
  const { NEUTRAL_PROJECT_ICON_PATH, resolveProjectIcon, resolveProjectWordmark } =
    await importBuiltModule("shared/branding.js");

  equal(
    NEUTRAL_PROJECT_ICON_PATH,
    "./assets/icons/folder.svg",
    "Branding fallback icon should stay a shared neutral asset.",
  );

  equal(
    resolveProjectIcon({
      title: "Example",
      icon: "",
      repoBasePath: ".",
      defaultDoc: "README.md",
      docRoots: [],
      includeExtensions: [],
    }),
    "./assets/icons/folder.svg",
    "Projects without an explicit icon should use the neutral shared fallback.",
  );

  equal(
    resolveProjectWordmark({
      title: "Example",
      icon: "",
      brandWordmarkText: "   ",
      repoBasePath: ".",
      defaultDoc: "README.md",
      docRoots: [],
      includeExtensions: [],
    }),
    undefined,
    "Blank wordmark text should not synthesize runtime branding text.",
  );
}

module.exports = [
  {
    name: "branding fallback stays neutral and shared",
    run: testBrandingFallbackIsNeutralAndShared,
  },
];
