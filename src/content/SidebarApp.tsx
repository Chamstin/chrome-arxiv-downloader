import { useEffect, useState } from "react";

import type { ArxivPageController, ControllerSnapshot } from "./controller";

export function SidebarApp({ controller }: { controller: ArxivPageController }) {
  const [snapshot, setSnapshot] = useState<ControllerSnapshot>(controller.getSnapshot());
  const downloadEntries = Object.values(snapshot.downloadStates);
  const completedCount = downloadEntries.filter((entry) => entry.status === "completed").length;
  const activeCount = downloadEntries.filter(
    (entry) => entry.status === "downloading" || entry.status === "saving" || entry.status === "queued",
  ).length;

  useEffect(() => controller.subscribe(() => setSnapshot(controller.getSnapshot())), [controller]);

  if (snapshot.collapsed) {
    return (
      <button
        className="axd-fixed axd-right-4 axd-top-28 axd-z-[2147483647] axd-flex axd-items-center axd-gap-3 axd-rounded-full axd-bg-ink axd-px-4 axd-py-3 axd-font-sans axd-text-sm axd-font-semibold axd-text-white axd-shadow-glow"
        onClick={() => controller.toggleCollapsed()}
        type="button"
      >
        <span>候选下载</span>
        <span className="axd-rounded-full axd-bg-white/10 axd-px-2 axd-py-1 axd-text-xs">
          {snapshot.queue.length}
        </span>
      </button>
    );
  }

  return (
    <aside className="axd-fixed axd-right-4 axd-top-20 axd-z-[2147483647] axd-flex axd-h-[calc(100vh-96px)] axd-w-[380px] axd-max-w-[calc(100vw-20px)] axd-flex-col axd-overflow-hidden axd-rounded-[2rem] axd-border axd-border-white/60 axd-bg-white/88 axd-font-sans axd-text-ink axd-shadow-glow axd-backdrop-blur-xl">
      <header className="axd-bg-gradient-to-br axd-from-brand-900 axd-via-brand-700 axd-to-accent-600 axd-p-5 axd-text-white">
        <div className="axd-flex axd-items-start axd-justify-between axd-gap-4">
          <div className="axd-space-y-2">
            <div className="axd-inline-flex axd-rounded-full axd-bg-white/10 axd-px-3 axd-py-1 axd-text-[11px] axd-font-semibold axd-tracking-[0.18em]">
              arXiv Queue
            </div>
            <div>
              <h2 className="axd-font-display axd-text-2xl axd-font-bold">候选下载</h2>
              <p className="axd-text-sm axd-text-white/80">
                {snapshot.queue.length} 篇已入队，{snapshot.selectedCount} 篇已勾选
              </p>
              {snapshot.downloadBusy || completedCount > 0 ? (
                <p className="axd-text-xs axd-text-white/70">
                  下载状态: {completedCount} 已完成 / {activeCount} 进行中
                </p>
              ) : null}
            </div>
          </div>
          <button
            className="axd-rounded-full axd-bg-white/10 axd-p-2 axd-text-white/90 hover:axd-bg-white/20"
            onClick={() => controller.toggleCollapsed()}
            type="button"
          >
            收起
          </button>
        </div>
      </header>

      <div className="axd-grid axd-grid-cols-2 axd-gap-2 axd-border-b axd-border-slate-200 axd-bg-slate-50 axd-p-4">
        <ActionButton label="全选本页" onClick={() => controller.selectAllOnPage()} />
        <ActionButton label="清空勾选" onClick={() => controller.clearSelection()} />
        <ActionButton label="加入已选" onClick={() => void controller.addSelected()} />
        <ActionButton label="整页加入" onClick={() => void controller.addAllPage()} />
      </div>

      {snapshot.status ? <StatusBanner snapshot={snapshot} /> : null}

      <div className="axd-flex-1 axd-overflow-y-auto axd-p-4 axd-pr-3">
        {snapshot.queue.length === 0 ? (
          <div className="axd-flex axd-h-full axd-flex-col axd-items-center axd-justify-center axd-rounded-[1.75rem] axd-border axd-border-dashed axd-border-slate-200 axd-bg-slate-50 axd-p-8 axd-text-center">
            <div className="axd-font-display axd-text-2xl axd-font-bold axd-text-slate-900">
              还没有候选论文
            </div>
            <p className="axd-mt-3 axd-max-w-xs axd-text-sm axd-leading-7 axd-text-slate-500">
              先点击每篇论文左侧的加入按钮，或者勾选后使用“加入已选 / 整页加入”。
            </p>
          </div>
        ) : (
          <div className="axd-space-y-3">
            {snapshot.queue.map((paper) => (
              <article
                className="axd-rounded-[1.6rem] axd-border axd-border-slate-200 axd-bg-white axd-p-4 axd-shadow-sm"
                key={paper.id}
              >
                <div className="axd-flex axd-items-start axd-gap-3">
                  <div className="axd-min-w-0 axd-flex-1">
                    <div className="axd-mb-2 axd-flex axd-items-center axd-gap-2">
                      <span className="axd-rounded-full axd-bg-brand-50 axd-px-2.5 axd-py-1 axd-text-[11px] axd-font-semibold axd-text-brand-700">
                        {paper.id}
                      </span>
                      <a
                        className="axd-text-[11px] axd-font-medium axd-text-slate-500 hover:axd-text-brand-700"
                        href={paper.absUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        打开
                      </a>
                    </div>
                    <h3
                      className="axd-overflow-hidden axd-font-display axd-text-base axd-font-bold axd-leading-6 axd-text-slate-900"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {paper.title}
                    </h3>
                    {paper.preview ? (
                      <p className="axd-mt-2 axd-text-sm axd-leading-6 axd-text-slate-600">
                        {paper.preview}
                      </p>
                    ) : paper.previewStatus === "loading" ? (
                      <p className="axd-mt-2 axd-text-sm axd-text-brand-700">正在生成一句话预览...</p>
                    ) : paper.previewError ? (
                      <p className="axd-mt-2 axd-text-sm axd-text-red-600">
                        预览失败: {paper.previewError}
                      </p>
                    ) : !snapshot.settings.generatePreview ? null : (
                      <p className="axd-mt-2 axd-text-sm axd-text-slate-400">等待生成预览...</p>
                    )}

                    {snapshot.downloadStates[paper.id] ? (
                      <DownloadProgress state={snapshot.downloadStates[paper.id]} />
                    ) : null}
                  </div>

                  <button
                    className="axd-shrink-0 axd-rounded-full axd-bg-slate-100 axd-px-3 axd-py-2 axd-text-xs axd-font-semibold axd-text-slate-600 hover:axd-bg-slate-200"
                    onClick={() => void controller.removeFromQueue(paper.id)}
                    type="button"
                  >
                    移除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <footer className="axd-border-t axd-border-slate-200 axd-bg-white/90 axd-p-4">
        <div className="axd-flex axd-gap-2">
          <button
            className="axd-flex-1 axd-rounded-2xl axd-bg-brand-600 axd-px-4 axd-py-3 axd-text-sm axd-font-semibold axd-text-white hover:axd-bg-brand-700 disabled:axd-cursor-not-allowed disabled:axd-opacity-50"
            disabled={snapshot.downloadBusy || snapshot.queue.length === 0}
            onClick={() => void controller.downloadAll()}
            type="button"
          >
            {snapshot.downloadBusy ? "提交中..." : "下载全部 PDF"}
          </button>
          <button
            className="axd-rounded-2xl axd-border axd-border-slate-200 axd-bg-slate-50 axd-px-4 axd-py-3 axd-text-sm axd-font-semibold axd-text-slate-700 hover:axd-bg-slate-100"
            onClick={() => void controller.openOptions()}
            type="button"
          >
            设置
          </button>
        </div>
        <button
          className="axd-mt-2 axd-w-full axd-rounded-2xl axd-bg-transparent axd-px-4 axd-py-2 axd-text-xs axd-font-semibold axd-text-slate-500 hover:axd-text-slate-700"
          onClick={() => void controller.clearQueue()}
          type="button"
        >
          清空候选列表
        </button>
      </footer>
    </aside>
  );
}

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="axd-rounded-2xl axd-border axd-border-slate-200 axd-bg-white axd-px-3 axd-py-3 axd-text-sm axd-font-semibold axd-text-slate-700 hover:axd-border-brand-200 hover:axd-bg-brand-50 hover:axd-text-brand-700"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function StatusBanner({ snapshot }: { snapshot: ControllerSnapshot }) {
  const toneClassName =
    snapshot.status?.tone === "success"
      ? "axd-border-emerald-200 axd-bg-emerald-50 axd-text-emerald-700"
      : snapshot.status?.tone === "error"
        ? "axd-border-red-200 axd-bg-red-50 axd-text-red-700"
        : "axd-border-brand-200 axd-bg-brand-50 axd-text-brand-700";

  return (
    <div className={`axd-border-b axd-px-4 axd-py-3 axd-text-sm ${toneClassName}`}>
      {snapshot.status?.text}
    </div>
  );
}

function DownloadProgress({ state }: { state: ControllerSnapshot["downloadStates"][string] }) {
  const width = state.progress === null ? "40%" : `${state.progress}%`;
  const barToneClassName =
    state.status === "completed"
      ? "axd-bg-emerald-500"
      : state.status === "error"
        ? "axd-bg-red-500"
        : "axd-bg-brand-500";

  return (
    <div className="axd-mt-3 axd-space-y-2">
      <div className="axd-flex axd-items-center axd-justify-between axd-gap-3 axd-text-[11px] axd-font-semibold">
        <span className="axd-text-slate-600">{getDownloadStatusText(state.status)}</span>
        <span className="axd-text-slate-500">
          {state.progress === null ? formatBytes(state.receivedBytes) : `${state.progress}%`}
        </span>
      </div>
      <div className="axd-h-2 axd-overflow-hidden axd-rounded-full axd-bg-slate-100">
        <div
          className={`axd-h-full axd-rounded-full ${barToneClassName} ${
            state.progress === null && state.status === "downloading" ? "axd-animate-pulse" : ""
          }`}
          style={{ width }}
        />
      </div>
      <div className="axd-text-[11px] axd-text-slate-500">
        {state.totalBytes
          ? `${formatBytes(state.receivedBytes)} / ${formatBytes(state.totalBytes)}`
          : `${formatBytes(state.receivedBytes)} 已接收`}
        {state.error ? ` · ${state.error}` : ""}
      </div>
    </div>
  );
}

function getDownloadStatusText(status: ControllerSnapshot["downloadStates"][string]["status"]) {
  switch (status) {
    case "queued":
      return "排队中";
    case "downloading":
      return "下载中";
    case "saving":
      return "保存中";
    case "completed":
      return "已完成";
    case "error":
      return "下载失败";
    default:
      return "待开始";
  }
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${bytes} B`;
}
