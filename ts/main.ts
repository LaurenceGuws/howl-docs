import { startApp } from "./app.js";

startApp().catch((err: unknown) => {
  const viewerEl = document.getElementById("viewer");
  if (!viewerEl) return;
  viewerEl.replaceChildren(renderStartupError(String(err)));
});

function renderStartupError(message: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const callout = document.createElement("div");
  callout.className = "callout";
  callout.textContent = "Failed to initialize docs explorer.";

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = message;
  pre.append(code);

  fragment.append(callout, pre);
  return fragment;
}
