export type PreviewStatus = "idle" | "loading" | "ready" | "error";

export type DownloadStatus =
  | "idle"
  | "queued"
  | "downloading"
  | "saving"
  | "completed"
  | "error";

export type PaperDownloadState = {
  status: DownloadStatus;
  progress: number | null;
  receivedBytes: number;
  totalBytes: number | null;
  error?: string;
};

export type PaperItem = {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  absUrl: string;
  pdfUrl: string;
  sourcePageUrl: string;
  addedAt: number;
  preview?: string;
  previewStatus?: PreviewStatus;
  previewError?: string;
};

export type ExtensionSettings = {
  apiBase: string;
  apiKey: string;
  model: string;
  prompt: string;
  generatePreview: boolean;
};

export const SETTINGS_STORAGE_KEY = "axd-settings";
export const QUEUE_STORAGE_KEY = "axd-queue";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiBase: "",
  apiKey: "",
  model: "gpt-4o-mini",
  prompt:
    "请基于下面的论文标题和摘要，用简体中文总结成一句不超过 30 个字的研究亮点，不要输出多句话。\n\n标题：{{title}}\n\n摘要：{{abstract}}",
  generatePreview: true,
};
