# arXiv Batch Downloader

Batch-download arXiv papers from search and list pages, queue PDFs in a modern side panel, and optionally generate one-line AI previews from abstracts.

在 arXiv 搜索页和列表页批量收集论文，使用右侧候选面板统一下载 PDF，并可选地基于摘要生成一句话 AI 预览。

## Author / 作者

- `@chamstin`
- GitHub: [https://github.com/Chamstin](https://github.com/Chamstin)

## Features / 功能

- Works on `https://arxiv.org/search/*` and `https://arxiv.org/list/*`
- Injects per-paper checkbox and queue button
- Shows a modern right-side download queue
- Supports current-page bulk select and bulk queue
- Streams each PDF inside the extension and shows per-paper progress before browser save
- Supports OpenAI-compatible API Base, API Key, model, and prompt
- Generates one-line previews from paper abstracts
- Stores settings locally on the device

## Privacy / 隐私

### English

- API Base, API Key, prompt, and download settings are stored locally in `chrome.storage.local`
- The extension does not send your settings to any server controlled by the author
- If AI preview is enabled, requests are sent directly from your browser to the API endpoint that you configure

### 中文

- API Base、API Key、Prompt 和下载设置保存在本地 `chrome.storage.local`
- 扩展不会把这些设置上传到作者控制的服务器
- 如果开启 AI 预览，请求会由浏览器直接发送到你自己配置的 API 端点

Full policy / 完整隐私政策: [PRIVACY.md](./PRIVACY.md)

## Stack / 技术栈

- React 18
- TypeScript 5
- Vite 6
- Tailwind CSS 3
- `@crxjs/vite-plugin`
- `crx3`

## Development / 开发

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

Build output:

```text
dist/
```

## Release Packaging / 发布打包

### Chrome Web Store ZIP

```bash
npm run package:webstore
```

Output:

```text
release/arxiv-batch-downloader-webstore-v0.1.0.zip
```

This is the file to upload to Chrome Web Store.

这个 ZIP 才是应该上传到 Chrome Web Store 的文件。

### Local CRX

```bash
npm run package:crx
```

Outputs:

```text
release/arxiv-batch-downloader-local-v0.1.0.crx
release/private/arxiv-batch-downloader.pem
```

The `.crx` file is only for local sideload testing.

`.crx` 仅用于本地测试安装，不是 Chrome 商店上传格式。

### Build both

```bash
npm run package:all
```

## Load in Chrome / 在 Chrome 中加载

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the local `dist` directory

## Chrome Web Store Notes / 商店上架说明

- Chrome Web Store wants a ZIP whose root contains `manifest.json`
- Do not upload a ZIP that contains a parent `dist/` folder
- Do not upload the `.crx`
- Use the generated `release/*-webstore-*.zip`

详细步骤见 / Full guide:

- [docs/CHROME_WEB_STORE.md](./docs/CHROME_WEB_STORE.md)
- [docs/STORE_LISTING_COPY.md](./docs/STORE_LISTING_COPY.md)

## Repository Notes / 仓库说明

- `.github/workflows/release.yml` builds the web store ZIP on tags
- `.gitignore` excludes build output, release archives, keys, and local dependencies
- The manifest includes icons and homepage metadata for publication readiness

## Verified / 已验证

Verified locally:

```bash
npm run build
npm run package:all
```

These commands produce:

- `dist/`
- a Chrome Web Store ZIP
- a local CRX

## Limits / 限制

- Preview generation uses paper abstracts, not PDF parsing
- Download folder is relative to Chrome's default download directory
- If AI preview is enabled, your configured API endpoint receives the request directly from your browser
