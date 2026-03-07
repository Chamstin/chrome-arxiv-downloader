import type { ExtensionResponse } from "@/shared/messages";
import { getQueue, getSettings, setQueue, sortQueue, upsertQueueItems } from "@/shared/storage";
import {
  QUEUE_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  type ExtensionSettings,
  type PaperDownloadState,
  type PaperItem,
} from "@/shared/types";
import { cleanText, sanitizeFilename, sleep } from "@/shared/utils";

import type { ParsedPaper } from "./page-parser";

type Listener = () => void;

export type StatusNotice = {
  tone: "info" | "success" | "error";
  text: string;
} | null;

export type ControllerSnapshot = {
  queue: PaperItem[];
  downloadStates: Record<string, PaperDownloadState>;
  selectedCount: number;
  pageCount: number;
  collapsed: boolean;
  downloadBusy: boolean;
  settings: ExtensionSettings;
  status: StatusNotice;
};

export class ArxivPageController {
  private pagePapers = new Map<string, ParsedPaper>();
  private queue: PaperItem[] = [];
  private settings: ExtensionSettings;
  private selectedIds = new Set<string>();
  private downloadStates: Record<string, PaperDownloadState> = {};
  private collapsed = false;
  private downloadBusy = false;
  private status: StatusNotice = null;
  private listeners = new Set<Listener>();
  private previewWaiting: string[] = [];
  private previewInFlight = new Set<string>();
  private statusTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  constructor(parsedPapers: ParsedPaper[], initialSettings: ExtensionSettings) {
    this.settings = initialSettings;

    for (const parsedPaper of parsedPapers) {
      this.pagePapers.set(parsedPaper.paper.id, parsedPaper);
    }
  }

  async init() {
    const [settings, queue] = await Promise.all([getSettings(), getQueue()]);
    this.settings = settings;
    this.queue = queue;
    chrome.storage.onChanged.addListener(this.handleStorageChanged);
    this.syncInjectedControls();
    this.queueMissingPreviews();
    this.emit();
  }

  dispose() {
    chrome.storage.onChanged.removeListener(this.handleStorageChanged);

    if (this.statusTimer !== null) {
      globalThis.clearTimeout(this.statusTimer);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): ControllerSnapshot {
    return {
      queue: this.queue,
      downloadStates: this.downloadStates,
      selectedCount: this.selectedIds.size,
      pageCount: this.pagePapers.size,
      collapsed: this.collapsed,
      downloadBusy: this.downloadBusy,
      settings: this.settings,
      status: this.status,
    };
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    this.emit();
  }

  selectAllOnPage() {
    this.selectedIds = new Set(this.pagePapers.keys());
    this.syncInjectedControls();
    this.emit();
  }

  clearSelection() {
    this.selectedIds.clear();
    this.syncInjectedControls();
    this.emit();
  }

  toggleSelection(id: string, checked: boolean) {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }

    this.syncInjectedControls();
    this.emit();
  }

  async addPaper(id: string) {
    const parsedPaper = this.pagePapers.get(id);

    if (!parsedPaper) {
      return;
    }

    const alreadyQueued = this.queue.some((paper) => paper.id === id);
    const nextQueue = upsertQueueItems(this.queue, [
      {
        ...parsedPaper.paper,
        addedAt: Date.now(),
        sourcePageUrl: location.href,
      },
    ]);

    await this.persistQueue(nextQueue);
    this.queueMissingPreviews([id]);
    this.setStatus({
      tone: "success",
      text: alreadyQueued ? "论文已在候选列表中。" : "已加入候选下载。",
    });
  }

  async addSelected() {
    const selectedPapers = [...this.selectedIds]
      .map((id) => this.pagePapers.get(id)?.paper)
      .filter((paper): paper is PaperItem => Boolean(paper))
      .map((paper) => ({
        ...paper,
        addedAt: Date.now(),
        sourcePageUrl: location.href,
      }));

    if (selectedPapers.length === 0) {
      this.setStatus({
        tone: "info",
        text: "请先勾选本页论文。",
      });
      return;
    }

    await this.persistQueue(upsertQueueItems(this.queue, selectedPapers));
    this.queueMissingPreviews(selectedPapers.map((paper) => paper.id));
    this.setStatus({
      tone: "success",
      text: `已加入 ${selectedPapers.length} 篇论文。`,
    });
  }

  async addAllPage() {
    const allPapers = [...this.pagePapers.values()].map(({ paper }) => ({
      ...paper,
      addedAt: Date.now(),
      sourcePageUrl: location.href,
    }));

    if (allPapers.length === 0) {
      return;
    }

    await this.persistQueue(upsertQueueItems(this.queue, allPapers));
    this.queueMissingPreviews(allPapers.map((paper) => paper.id));
    this.setStatus({
      tone: "success",
      text: `整页 ${allPapers.length} 篇论文已加入候选。`,
    });
  }

  async removeFromQueue(id: string) {
    delete this.downloadStates[id];
    await this.persistQueue(this.queue.filter((paper) => paper.id !== id));
  }

  async clearQueue() {
    this.downloadStates = {};
    await this.persistQueue([]);
    this.setStatus({
      tone: "info",
      text: "候选下载列表已清空。",
    });
  }

  async downloadAll() {
    if (this.queue.length === 0) {
      this.setStatus({
        tone: "info",
        text: "候选下载列表为空。",
      });
      return;
    }

    this.downloadBusy = true;
    this.downloadStates = Object.fromEntries(
      this.queue.map((paper) => [
        paper.id,
        {
          status: "queued",
          progress: 0,
          receivedBytes: 0,
          totalBytes: null,
        } satisfies PaperDownloadState,
      ]),
    );
    this.emit();

    let completed = 0;

    try {
      for (const paper of this.queue) {
        const result = await this.downloadPaper(paper);

        if (result.ok) {
          completed += 1;
        }
      }

      if (completed === this.queue.length) {
        this.setStatus({
          tone: "success",
          text: `已完成 ${completed} / ${this.queue.length} 篇 PDF 下载。`,
        });
      } else if (completed > 0) {
        this.setStatus({
          tone: "info",
          text: `已完成 ${completed} / ${this.queue.length} 篇 PDF，部分下载失败。`,
        });
      } else {
        this.setStatus({
          tone: "error",
          text: "所有 PDF 下载都失败了。",
        });
      }
    } catch (error) {
      this.setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "下载任务提交失败。",
      });
    } finally {
      this.downloadBusy = false;
      this.emit();
    }
  }

  async openOptions() {
    await chrome.runtime.sendMessage({
      type: "open-options",
    });
  }

  private async persistQueue(nextQueue: PaperItem[]) {
    this.queue = sortQueue(nextQueue);
    await setQueue(this.queue);
    this.syncInjectedControls();
    this.emit();
  }

  private async patchQueueItem(id: string, patch: Partial<PaperItem>) {
    const nextQueue = this.queue.map((paper) =>
      paper.id === id
        ? {
            ...paper,
            ...patch,
          }
        : paper,
    );

    await this.persistQueue(nextQueue);
  }

  private queueMissingPreviews(ids?: string[]) {
    if (!this.settings.generatePreview) {
      return;
    }

    if (!this.settings.apiBase || !this.settings.apiKey || !this.settings.model) {
      return;
    }

    const targetIds = ids ?? this.queue.map((paper) => paper.id);

    for (const id of targetIds) {
      const queuePaper = this.queue.find((paper) => paper.id === id);

      if (!queuePaper) {
        continue;
      }

      if (queuePaper.preview || queuePaper.previewStatus === "loading") {
        continue;
      }

      if (this.previewWaiting.includes(id) || this.previewInFlight.has(id)) {
        continue;
      }

      this.previewWaiting.push(id);
    }

    this.runPreviewQueue();
  }

  private runPreviewQueue() {
    while (this.previewInFlight.size < 2 && this.previewWaiting.length > 0) {
      const id = this.previewWaiting.shift();

      if (!id) {
        return;
      }

      this.previewInFlight.add(id);

      void this.generatePreview(id).finally(() => {
        this.previewInFlight.delete(id);
        this.runPreviewQueue();
      });
    }
  }

  private async generatePreview(id: string) {
    const existing = this.queue.find((paper) => paper.id === id);

    if (!existing) {
      return;
    }

    await this.patchQueueItem(id, {
      previewStatus: "loading",
      previewError: undefined,
    });

    let current = this.queue.find((paper) => paper.id === id);

    if (!current) {
      return;
    }

    if (!current.abstract.trim()) {
      const abstract = await fetchAbstract(current.absUrl);

      if (abstract) {
        await this.patchQueueItem(id, {
          abstract,
        });
        current = this.queue.find((paper) => paper.id === id) ?? {
          ...current,
          abstract,
        };
      }
    }

    if (!current.abstract.trim()) {
      await this.patchQueueItem(id, {
        previewStatus: "error",
        previewError: "未能读取论文摘要。",
      });
      return;
    }

    const response = (await chrome.runtime.sendMessage({
      type: "generate-preview",
      paper: current,
    })) as ExtensionResponse;

    if (!response.ok) {
      await this.patchQueueItem(id, {
        previewStatus: "error",
        previewError: response.error,
      });
      return;
    }

    await this.patchQueueItem(id, {
      preview: response.text,
      previewStatus: "ready",
      previewError: undefined,
    });
  }

  private handleStorageChanged = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName === "local" && changes[SETTINGS_STORAGE_KEY]) {
      this.settings = {
        ...this.settings,
        ...(changes[SETTINGS_STORAGE_KEY].newValue as Partial<ExtensionSettings> | undefined),
      };
      this.queueMissingPreviews();
    }

    if (areaName === "local" && changes[QUEUE_STORAGE_KEY]) {
      this.queue = sortQueue((changes[QUEUE_STORAGE_KEY].newValue as PaperItem[] | undefined) ?? []);
      this.syncInjectedControls();
    }

    this.emit();
  };

  private setStatus(status: StatusNotice) {
    this.status = status;
    this.emit();

    if (this.statusTimer !== null) {
      globalThis.clearTimeout(this.statusTimer);
    }

    this.statusTimer = globalThis.setTimeout(() => {
      this.status = null;
      this.emit();
    }, 4200);
  }

  private syncInjectedControls() {
    const queuedIds = new Set(this.queue.map((paper) => paper.id));

    for (const id of this.pagePapers.keys()) {
      const button = document.querySelector<HTMLButtonElement>(
        `.axd-queue-button[data-paper-id="${CSS.escape(id)}"]`,
      );
      const checkbox = document.querySelector<HTMLInputElement>(
        `.axd-select-checkbox[data-paper-id="${CSS.escape(id)}"]`,
      );

      if (button) {
        const queued = queuedIds.has(id);
        button.dataset.queued = queued ? "true" : "false";
        button.textContent = queued ? "已加入" : "+ 加入候选";
      }

      if (checkbox) {
        checkbox.checked = this.selectedIds.has(id);
      }
    }
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private async downloadPaper(paper: PaperItem): Promise<ExtensionResponse> {
    this.setDownloadState(paper.id, {
      status: "downloading",
      progress: 0,
      receivedBytes: 0,
      totalBytes: null,
      error: undefined,
    });

    try {
      const response = await fetch(paper.pdfUrl, {
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error(`下载失败 (${response.status})`);
      }

      const totalBytesHeader = response.headers.get("content-length");
      const totalBytes = totalBytesHeader ? Number(totalBytesHeader) : null;

      if (!response.body) {
        const blob = await response.blob();
        await this.saveDownloadedBlob(paper, blob);
        this.setDownloadState(paper.id, {
          status: "completed",
          progress: 100,
          receivedBytes: blob.size,
          totalBytes: blob.size,
        });
        return { ok: true, count: 1 };
      }

      const reader = response.body.getReader();
      const chunks: ArrayBuffer[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        if (!value) {
          continue;
        }

        const stableChunk = Uint8Array.from(value);
        chunks.push(stableChunk.buffer);
        receivedBytes += stableChunk.byteLength;

        this.setDownloadState(paper.id, {
          status: "downloading",
          progress: totalBytes ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : null,
          receivedBytes,
          totalBytes,
        });
      }

      const blob = new Blob(chunks, {
        type: "application/pdf",
      });

      this.setDownloadState(paper.id, {
        status: "saving",
        progress: 100,
        receivedBytes,
        totalBytes: totalBytes ?? receivedBytes,
      });

      await this.saveDownloadedBlob(paper, blob);

      this.setDownloadState(paper.id, {
        status: "completed",
        progress: 100,
        receivedBytes,
        totalBytes: totalBytes ?? receivedBytes,
      });

      return { ok: true, count: 1 };
    } catch (error) {
      this.setDownloadState(paper.id, {
        status: "error",
        progress: 0,
        receivedBytes: 0,
        totalBytes: null,
        error: error instanceof Error ? error.message : "下载失败",
      });

      return {
        ok: false,
        error: error instanceof Error ? error.message : "下载失败",
      };
    }
  }

  private async saveDownloadedBlob(paper: PaperItem, blob: Blob) {
    const filename = `${sanitizeFilename(`${paper.id} - ${paper.title}`)}.pdf`;
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    await sleep(180);
    link.remove();

    globalThis.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 60_000);
  }

  private setDownloadState(id: string, state: PaperDownloadState) {
    this.downloadStates = {
      ...this.downloadStates,
      [id]: state,
    };
    this.emit();
  }
}

async function fetchAbstract(absUrl: string): Promise<string> {
  try {
    const response = await fetch(absUrl, {
      credentials: "omit",
    });

    if (!response.ok) {
      return "";
    }

    const html = await response.text();
    const documentFragment = new DOMParser().parseFromString(html, "text/html");
    const block = documentFragment.querySelector<HTMLElement>(
      "blockquote.abstract, blockquote.abstract.mathjax",
    );

    if (!block) {
      return "";
    }

    const clone = block.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".descriptor").forEach((element) => element.remove());
    return cleanText(clone.textContent ?? "");
  } catch (error) {
    console.error("Failed to fetch abstract", absUrl, error);
    return "";
  }
}
