# Store Listing Copy

## English

### Name

arXiv Batch Downloader

### Short description

Queue papers from arXiv search and list pages, generate one-line previews, and batch download PDFs.

### Detailed description

arXiv Batch Downloader helps researchers collect papers directly from arXiv search results and category listing pages.

Features:

- Add individual papers to a download queue
- Select multiple papers on the current page
- Stream PDFs inside the extension with per-paper progress before browser save
- Optionally generate one-line AI previews from paper abstracts
- Configure your own OpenAI-compatible API Base, API Key, model, and prompt

Privacy:

- Settings are stored locally in `chrome.storage.local`
- The extension does not send your API key or settings to any author-controlled server
- If AI preview is enabled, your browser sends requests directly to the API Base that you configure

### Privacy disclosure summary

This extension stores API settings locally on the user's device. It has no developer-operated backend. When AI preview is enabled, requests are sent directly from the user's browser to the user-configured API endpoint.

## 中文

### 名称

arXiv Batch Downloader

### 简短描述

在 arXiv 搜索页和列表页批量收集论文，生成一句话预览，并批量下载 PDF。

### 详细描述

arXiv Batch Downloader 用于帮助研究者直接在 arXiv 搜索结果页和分类列表页中收集论文并批量下载。

功能包括：

- 单篇论文加入候选下载列表
- 当前页面多选论文
- 在扩展内流式下载 PDF，并为每篇论文显示进度后再交给浏览器保存
- 可选地基于论文摘要生成一句话 AI 预览
- 支持自定义 OpenAI 兼容 API Base、API Key、模型和 Prompt

隐私说明：

- 设置保存在本地 `chrome.storage.local`
- 扩展不会把你的 API Key 或设置上传到作者控制的服务器
- 如果开启 AI 预览，请求会由浏览器直接发送到你自己配置的 API 接口

### 隐私摘要

本扩展将 API 设置保存在用户本地设备中，不依赖作者后端服务。开启 AI 预览后，请求会由用户浏览器直接发送到用户配置的 API 端点。
