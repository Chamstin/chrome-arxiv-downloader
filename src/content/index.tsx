import React from "react";
import ReactDOM from "react-dom/client";

import { getSettings } from "@/shared/storage";
import contentStyles from "@/content/content.css?inline";

import { SidebarApp } from "./SidebarApp";
import { ArxivPageController } from "./controller";
import { parseCurrentPage } from "./page-parser";

const ROOT_ID = "axd-content-root";
const CONTROL_STYLE_ID = "axd-control-styles";

void bootstrap();

async function bootstrap() {
  if (window.top !== window) {
    return;
  }

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const parsedPapers = parseCurrentPage();

  if (parsedPapers.length === 0) {
    return;
  }

  injectControlStyles();

  const settings = await getSettings();
  const controller = new ArxivPageController(parsedPapers, settings);
  injectInlineControls(parsedPapers, controller);
  await controller.init();
  mountSidebar(controller);
}

function mountSidebar(controller: ArxivPageController) {
  const host = document.createElement("div");
  host.id = ROOT_ID;
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({
    mode: "open",
  });

  const styleElement = document.createElement("style");
  styleElement.textContent = contentStyles;
  shadowRoot.appendChild(styleElement);

  const reactMount = document.createElement("div");
  reactMount.className = "axd-root";
  shadowRoot.appendChild(reactMount);

  ReactDOM.createRoot(reactMount).render(
    <React.StrictMode>
      <SidebarApp controller={controller} />
    </React.StrictMode>,
  );
}

function injectInlineControls(
  parsedPapers: ReturnType<typeof parseCurrentPage>,
  controller: ArxivPageController,
) {
  for (const parsedPaper of parsedPapers) {
    const existing = parsedPaper.controlTarget.querySelector(".axd-row-toolbar");

    if (existing) {
      continue;
    }

    const toolbar = document.createElement("div");
    toolbar.className = `axd-row-toolbar axd-row-toolbar--${parsedPaper.pageType}`;

    const checkbox = document.createElement("input");
    checkbox.className = "axd-select-checkbox";
    checkbox.dataset.paperId = parsedPaper.paper.id;
    checkbox.type = "checkbox";
    checkbox.title = "勾选到本页批量候选";
    checkbox.addEventListener("change", () => {
      controller.toggleSelection(parsedPaper.paper.id, checkbox.checked);
    });

    const button = document.createElement("button");
    button.className = "axd-queue-button";
    button.dataset.paperId = parsedPaper.paper.id;
    button.type = "button";
    button.textContent = "+ 加入候选";
    button.title = "加入右侧候选下载列表";
    button.addEventListener("click", () => {
      void controller.addPaper(parsedPaper.paper.id);
    });

    toolbar.appendChild(checkbox);
    toolbar.appendChild(button);

    parsedPaper.controlTarget.prepend(toolbar);
  }
}

function injectControlStyles() {
  if (document.getElementById(CONTROL_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = CONTROL_STYLE_ID;
  style.textContent = `
    .axd-row-toolbar {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-right: 10px;
      margin-bottom: 10px;
      vertical-align: middle;
    }

    li.arxiv-result > .axd-row-toolbar {
      display: flex;
      margin-bottom: 14px;
    }

    .axd-select-checkbox {
      width: 16px;
      height: 16px;
      accent-color: #2462cc;
      cursor: pointer;
    }

    .axd-queue-button {
      appearance: none;
      border: 1px solid rgba(36, 98, 204, 0.12);
      border-radius: 999px;
      background: linear-gradient(135deg, #ffffff 0%, #f1f7ff 100%);
      color: #173b7d;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      padding: 10px 14px;
      transition: all 160ms ease;
      box-shadow: 0 8px 24px rgba(17, 32, 49, 0.08);
    }

    .axd-queue-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 28px rgba(17, 32, 49, 0.12);
    }

    .axd-queue-button[data-queued="true"] {
      background: linear-gradient(135deg, #dcebff 0%, #ffffff 100%);
      color: #1d4da2;
    }

    #articles > dt {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
  `;

  document.head.appendChild(style);
}
