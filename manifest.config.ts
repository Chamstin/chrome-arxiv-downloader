import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "arXiv Batch Downloader",
  short_name: "arXiv DL",
  version: "0.1.0",
  description:
    "Queue papers from arXiv search and list pages, generate one-line AI previews, and batch download PDFs.",
  homepage_url: "https://github.com/Chamstin",
  minimum_chrome_version: "116",
  permissions: ["storage"],
  host_permissions: ["https://arxiv.org/*"],
  optional_host_permissions: ["https://*/*", "http://*/*"],
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  action: {
    default_title: "Open arXiv Batch Downloader settings",
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
    },
  },
  options_page: "src/options/index.html",
  content_scripts: [
    {
      matches: ["https://arxiv.org/search/*", "https://arxiv.org/list/*"],
      js: ["src/content/index.tsx"],
      run_at: "document_idle",
    },
  ],
});
