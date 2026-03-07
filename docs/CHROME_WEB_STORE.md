# Chrome Web Store Release Guide

## English

### What is already prepared in this repository

- Manifest V3 build pipeline
- Chrome Web Store upload ZIP packaging
- Local CRX packaging for sideload testing
- Extension icons
- Privacy disclosure files
- Bilingual store listing copy
- Author metadata pointing to `@chamstin`

### Files to use

- Chrome Web Store upload package:
  - `release/arxiv-batch-downloader-webstore-v<version>.zip`
- Local test package:
  - `release/arxiv-batch-downloader-local-v<version>.crx`
- Privacy policy:
  - `PRIVACY.md`
- Suggested listing copy:
  - `docs/STORE_LISTING_COPY.md`

### Important packaging rule

Chrome Web Store accepts a ZIP file whose root contains `manifest.json`.

Do not upload:

- a ZIP that contains `dist/manifest.json`
- a CRX file

Upload:

- the generated `*-webstore-*.zip`

### Manual steps that still require the Chrome Developer Dashboard

1. Register the Chrome Web Store developer account.
2. Open the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Upload `release/arxiv-batch-downloader-webstore-v<version>.zip`.
4. Fill in the listing fields using `docs/STORE_LISTING_COPY.md`.
5. Add screenshots.
6. Add the privacy policy URL.
7. Review permission warnings and submit for review.

### Notes about CRX

- The `.crx` file generated in this repo is for local testing or enterprise-style side loading.
- The Chrome Web Store itself still expects a ZIP upload and will generate store-hosted distribution.

### Notes about keys and extension IDs

- The local CRX uses a locally generated PEM key in `release/private/`.
- Keep that PEM private.
- The Chrome Web Store manages its own published item identity in the dashboard flow.

## 中文

### 这个仓库里已经准备好的内容

- Manifest V3 构建流程
- Chrome Web Store 可上传 ZIP 打包流程
- 本地侧载测试用 CRX 打包流程
- 扩展图标
- 隐私说明文件
- 中英文商店文案草稿
- 指向 `@chamstin` 的作者信息

### 需要使用的文件

- Chrome 商店上传包：
  - `release/arxiv-batch-downloader-webstore-v<version>.zip`
- 本地测试安装包：
  - `release/arxiv-batch-downloader-local-v<version>.crx`
- 隐私政策：
  - `PRIVACY.md`
- 建议的商店文案：
  - `docs/STORE_LISTING_COPY.md`

### 一个关键规则

Chrome Web Store 要求上传的 ZIP 根目录直接包含 `manifest.json`。

不要上传：

- 含有 `dist/manifest.json` 这一层目录的 ZIP
- `.crx` 文件

应该上传：

- 生成好的 `*-webstore-*.zip`

### 仍然需要你在开发者后台手动完成的步骤

1. 注册 Chrome Web Store 开发者账号。
2. 打开 [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)。
3. 上传 `release/arxiv-batch-downloader-webstore-v<version>.zip`。
4. 按照 `docs/STORE_LISTING_COPY.md` 填写商店描述。
5. 上传截图。
6. 填写隐私政策 URL。
7. 检查权限警告并提交审核。

### 关于 CRX

- 仓库里生成的 `.crx` 用于本地测试或企业侧载，不是 Chrome 商店上传格式。
- Chrome 商店仍然要求 ZIP，上传后由商店托管分发。

### 关于密钥和扩展 ID

- 本地 CRX 使用 `release/private/` 下自动生成的 PEM 私钥。
- 这个 PEM 只能本地保存，不要提交到仓库。
- Chrome 商店正式发布时，发布项身份由开发者后台管理。
