# Privacy Policy / 隐私政策

## English

### Summary

arXiv Batch Downloader stores your configuration locally on your device. The extension has no author-operated backend service.

### What is stored locally

- API Base
- API Key
- Model name
- Prompt template
- Download folder preference
- Preview toggle
- Current download queue

These values are stored in Chrome extension storage on your local device.

### What is not sent to the author

- Your API Key is not uploaded to any server controlled by the author.
- Your prompts are not uploaded to any server controlled by the author.
- Your paper queue is not uploaded to any server controlled by the author.

### Network requests

The extension makes network requests only in these cases:

1. To read arXiv page content and paper abstract pages on `arxiv.org`.
2. If AI preview is enabled, to send a request directly from your browser to the API Base that you configured.

If you enable AI preview, the configured API endpoint will receive the request payload needed to generate the summary. This typically includes:

- The paper title
- The paper abstract
- Your configured API key in the request header

### Data sharing position

The extension does not provide any developer-controlled relay server and does not forward your settings to the author. API traffic goes directly from your browser to the endpoint that you choose.

### Contact

Author: `@chamstin`  
GitHub: [https://github.com/Chamstin](https://github.com/Chamstin)

## 中文

### 概要

arXiv Batch Downloader 会将你的配置保存在本地设备中。这个扩展没有作者运营的后端服务。

### 本地存储的内容

- API Base
- API Key
- 模型名称
- Prompt 模板
- 是否开启预览
- 当前候选下载队列

这些数据保存在 Chrome 扩展的本地存储中。

### 不会发送给作者的内容

- API Key 不会上传到作者控制的服务器
- Prompt 不会上传到作者控制的服务器
- 论文候选队列不会上传到作者控制的服务器

### 网络请求

扩展只会在以下情况下发起网络请求：

1. 读取 `arxiv.org` 页面内容和论文摘要页。
2. 如果启用 AI 预览，由你的浏览器直接向你自己配置的 API Base 发送请求。

如果你开启 AI 预览，所配置的 API 端点会收到生成摘要所需的请求内容，通常包括：

- 论文标题
- 论文摘要
- 请求头中的 API Key

### 数据流说明

本扩展不提供作者控制的转发服务，也不会把你的设置中转给作者。API 流量会由你的浏览器直接发送到你自己选择的接口。

### 联系方式

作者：`@chamstin`  
GitHub：[https://github.com/Chamstin](https://github.com/Chamstin)
