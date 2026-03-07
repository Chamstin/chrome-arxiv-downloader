import { useEffect, useState } from "react";

import type { ExtensionResponse } from "@/shared/messages";
import { getSettings, setSettings } from "@/shared/storage";
import { DEFAULT_SETTINGS, type ExtensionSettings } from "@/shared/types";
import { getOriginPermissionPattern, normalizeApiBase } from "@/shared/utils";

type Notice = {
  tone: "success" | "error" | "info";
  text: string;
} | null;

export default function App() {
  const [form, setForm] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    const settings = await getSettings();
    setForm(settings);
    setLoaded(true);
  }

  function patchForm<Key extends keyof ExtensionSettings>(
    key: Key,
    value: ExtensionSettings[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function requestApiPermission(apiBase: string): Promise<void> {
    const pattern = getOriginPermissionPattern(apiBase);

    if (!pattern) {
      return;
    }

    const alreadyGranted = await chrome.permissions.contains({
      origins: [pattern],
    });

    if (alreadyGranted) {
      return;
    }

    const granted = await chrome.permissions.request({
      origins: [pattern],
    });

    if (!granted) {
      throw new Error("未授予 API 域名访问权限，无法调用摘要接口。");
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const nextSettings: ExtensionSettings = {
        ...form,
        apiBase: normalizeApiBase(form.apiBase),
      };

      if (nextSettings.generatePreview && nextSettings.apiBase) {
        await requestApiPermission(nextSettings.apiBase);
      }

      await setSettings(nextSettings);
      setForm(nextSettings);
      setNotice({
        tone: "success",
        text: "设置已保存。",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "保存失败",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestApi() {
    setTesting(true);
    setNotice(null);
    setTestResult("");

    try {
      const nextSettings: ExtensionSettings = {
        ...form,
        apiBase: normalizeApiBase(form.apiBase),
      };

      await requestApiPermission(nextSettings.apiBase);

      const response = (await chrome.runtime.sendMessage({
        type: "test-api",
        settings: nextSettings,
      })) as ExtensionResponse;

      if (!response.ok) {
        throw new Error(response.error);
      }

      setTestResult(response.text ?? "");
      setNotice({
        tone: "success",
        text: "接口测试成功。",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "接口测试失败",
      });
    } finally {
      setTesting(false);
    }
  }

  if (!loaded) {
    return (
      <main className="axd-flex axd-min-h-screen axd-items-center axd-justify-center">
        <div className="axd-rounded-4xl axd-bg-white/90 axd-px-8 axd-py-6 axd-text-sm axd-shadow-glow">
          正在加载设置...
        </div>
      </main>
    );
  }

  return (
    <main className="axd-min-h-screen axd-px-6 axd-py-10">
      <div className="axd-mx-auto axd-flex axd-max-w-7xl axd-flex-col axd-gap-6">
        <section className="axd-relative axd-overflow-hidden axd-rounded-[2rem] axd-bg-gradient-to-br axd-from-brand-900 axd-via-brand-700 axd-to-accent-600 axd-p-8 axd-text-white axd-shadow-glow">
          <div className="axd-absolute axd-right-0 axd-top-0 axd-h-48 axd-w-48 axd-rounded-full axd-bg-white/10 axd-blur-3xl" />
          <div className="axd-relative axd-grid axd-gap-8 lg:axd-grid-cols-[1.4fr_0.8fr]">
            <div className="axd-space-y-4">
              <div className="axd-inline-flex axd-items-center axd-gap-2 axd-rounded-full axd-bg-white/10 axd-px-4 axd-py-2 axd-text-xs axd-font-medium axd-tracking-[0.18em]">
                arXiv Batch Downloader
              </div>
              <div className="axd-space-y-3">
                <h1 className="axd-font-display axd-text-4xl axd-font-bold">
                  管理批量下载与 AI 预览
                </h1>
                <p className="axd-max-w-3xl axd-text-sm axd-leading-7 axd-text-white/85">
                  这个页面负责配置 OpenAI 兼容接口和预览 Prompt。PDF 由插件自身流式下载，
                  进度会显示在右侧面板中；最终保存仍由浏览器处理。设置保存在本地设备中，不会上传到作者控制的服务器。
                </p>
              </div>
            </div>
            <div className="axd-grid axd-gap-3 sm:axd-grid-cols-3 lg:axd-grid-cols-1">
              <MetricCard label="生效页面" value="search / list" />
              <MetricCard label="下载方式" value="stream + browser save" />
              <MetricCard label="预览来源" value="论文摘要" />
            </div>
          </div>
        </section>

        <div className="axd-grid axd-gap-6 xl:axd-grid-cols-[1.2fr_0.8fr]">
          <form
            className="axd-space-y-6 axd-rounded-[2rem] axd-bg-white/90 axd-p-7 axd-shadow-glow axd-backdrop-blur"
            onSubmit={handleSave}
          >
            <SectionTitle
              title="接口与下载设置"
              description="保存后，内容脚本和后台脚本会读取这些配置。"
            />

            {notice ? (
              <div
                className={[
                  "axd-rounded-3xl axd-border axd-px-4 axd-py-3 axd-text-sm",
                  notice.tone === "success"
                    ? "axd-border-emerald-200 axd-bg-emerald-50 axd-text-emerald-700"
                    : notice.tone === "error"
                      ? "axd-border-red-200 axd-bg-red-50 axd-text-red-700"
                      : "axd-border-brand-200 axd-bg-brand-50 axd-text-brand-700",
                ].join(" ")}
              >
                {notice.text}
              </div>
            ) : null}

            <div className="axd-grid axd-gap-5 md:axd-grid-cols-2">
              <Field label="API Base" hint="例如 https://api.openai.com/v1">
                <input
                  className={inputClassName}
                  value={form.apiBase}
                  onChange={(event) => patchForm("apiBase", event.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </Field>

              <Field label="模型" hint="OpenAI 兼容接口通常需要显式传 model">
                <input
                  className={inputClassName}
                  value={form.model}
                  onChange={(event) => patchForm("model", event.target.value)}
                  placeholder="gpt-4o-mini"
                />
              </Field>
            </div>

            <Field label="API Key" hint="仅保存在 chrome.storage.local 中">
              <div className="axd-flex axd-gap-3">
                <input
                  className={`${inputClassName} axd-flex-1`}
                  type={showApiKey ? "text" : "password"}
                  value={form.apiKey}
                  onChange={(event) => patchForm("apiKey", event.target.value)}
                  placeholder="sk-..."
                />
                <button
                  className="axd-rounded-2xl axd-border axd-border-slate-200 axd-bg-slate-50 axd-px-4 axd-text-sm axd-font-medium axd-text-slate-700 hover:axd-bg-slate-100"
                  onClick={() => setShowApiKey((current) => !current)}
                  type="button"
                >
                  {showApiKey ? "隐藏" : "显示"}
                </button>
              </div>
            </Field>

            <Field
              label="Prompt"
              hint="支持 {{title}} 和 {{abstract}} 占位符，用于生成一句话预览"
            >
              <textarea
                className={`${inputClassName} axd-min-h-40 axd-resize-y`}
                value={form.prompt}
                onChange={(event) => patchForm("prompt", event.target.value)}
              />
            </Field>

            <label className="axd-flex axd-items-start axd-gap-3 axd-rounded-3xl axd-border axd-border-slate-200 axd-bg-slate-50 axd-p-4">
              <input
                className="axd-mt-1 axd-h-4 axd-w-4"
                type="checkbox"
                checked={form.generatePreview}
                onChange={(event) => patchForm("generatePreview", event.target.checked)}
              />
              <span className="axd-space-y-1">
                <span className="axd-block axd-text-sm axd-font-semibold axd-text-slate-900">
                  在加入候选下载时生成一句话预览
                </span>
                <span className="axd-block axd-text-sm axd-text-slate-600">
                  关闭后，右侧候选栏只显示论文标题，不调用摘要接口。
                </span>
              </span>
            </label>

            <div className="axd-rounded-3xl axd-border axd-border-amber-200 axd-bg-amber-50 axd-p-4 axd-text-sm axd-leading-7 axd-text-amber-900">
              <div className="axd-font-semibold">隐私 / Privacy</div>
              <p className="axd-mt-2">
                API Base、API Key、Prompt 和下载设置仅保存在本地 `chrome.storage.local`
                中，不会上传到作者控制的服务器。
              </p>
              <p className="axd-mt-2">
                Your API Base, API Key, prompt, and download settings are stored locally in
                `chrome.storage.local`. They are not uploaded to any server operated by the
                author.
              </p>
              <p className="axd-mt-2">
                如果开启 AI 预览，请求会由浏览器直接发送到你自己配置的 API Base。
              </p>
              <p className="axd-mt-2">
                If AI preview is enabled, requests are sent directly from your browser to the
                API endpoint that you configured.
              </p>
            </div>

            <div className="axd-flex axd-flex-wrap axd-gap-3">
              <button
                className="axd-rounded-2xl axd-bg-brand-600 axd-px-5 axd-py-3 axd-text-sm axd-font-semibold axd-text-white hover:axd-bg-brand-700 disabled:axd-cursor-not-allowed disabled:axd-opacity-60"
                disabled={saving}
                type="submit"
              >
                {saving ? "保存中..." : "保存设置"}
              </button>

              <button
                className="axd-rounded-2xl axd-border axd-border-brand-200 axd-bg-brand-50 axd-px-5 axd-py-3 axd-text-sm axd-font-semibold axd-text-brand-700 hover:axd-bg-brand-100 disabled:axd-cursor-not-allowed disabled:axd-opacity-60"
                disabled={testing || !form.apiBase || !form.apiKey || !form.model}
                onClick={handleTestApi}
                type="button"
              >
                {testing ? "测试中..." : "测试摘要接口"}
              </button>
            </div>
          </form>

          <aside className="axd-space-y-6">
            <div className="axd-rounded-[2rem] axd-bg-white/90 axd-p-7 axd-shadow-glow axd-backdrop-blur">
              <SectionTitle
                title="配置提示"
                description="几个和 Chrome 能力边界直接相关的说明。"
              />
              <div className="axd-space-y-4 axd-text-sm axd-leading-7 axd-text-slate-600">
                <TipItem>
                  自定义下载器会显示逐篇 PDF 的实时进度条，但最终保存位置仍遵循浏览器默认下载行为。
                </TipItem>
                <TipItem>
                  预览摘要基于页面摘要文本，不解析 PDF，也不会抓取 introduction。
                </TipItem>
                <TipItem>
                  只有 arXiv 搜索页和列表页会激活插件内容脚本，其他页面不会注入。
                </TipItem>
                <TipItem>
                  API 设置保存在本地；开启预览时，请求会直接发往你自己配置的 API Base。
                </TipItem>
              </div>
            </div>

            <div className="axd-rounded-[2rem] axd-bg-white/90 axd-p-7 axd-shadow-glow axd-backdrop-blur">
              <SectionTitle
                title="测试结果"
                description="调用你当前填写的 API 配置做一次示例摘要。"
              />
              <div className="axd-rounded-3xl axd-border axd-border-slate-200 axd-bg-slate-50 axd-p-5 axd-text-sm axd-leading-7 axd-text-slate-700">
                {testResult || "点击“测试摘要接口”后会在这里显示示例结果。"}
              </div>
            </div>

            <div className="axd-rounded-[2rem] axd-bg-ink axd-p-7 axd-text-white axd-shadow-glow">
              <SectionTitle
                className="axd-text-white"
                descriptionClassName="axd-text-white/70"
                title="占位符速查"
                description="Prompt 里可直接引用下面两个变量。"
              />
              <div className="axd-space-y-3 axd-text-sm">
                <CodePill text="{{title}}" />
                <CodePill text="{{abstract}}" />
              </div>
              <div className="axd-mt-6 axd-text-sm axd-leading-7 axd-text-white/75">
                Author / 作者: <a className="axd-underline" href="https://github.com/Chamstin"> @chamstin </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="axd-rounded-3xl axd-border axd-border-white/15 axd-bg-white/10 axd-p-4">
      <div className="axd-text-xs axd-uppercase axd-tracking-[0.2em] axd-text-white/60">{label}</div>
      <div className="axd-mt-2 axd-font-display axd-text-lg axd-font-semibold">{value}</div>
    </div>
  );
}

function SectionTitle({
  title,
  description,
  className = "",
  descriptionClassName = "",
}: {
  title: string;
  description: string;
  className?: string;
  descriptionClassName?: string;
}) {
  return (
    <div className="axd-space-y-1">
      <h2 className={`axd-font-display axd-text-2xl axd-font-bold axd-text-slate-900 ${className}`}>
        {title}
      </h2>
      <p className={`axd-text-sm axd-leading-7 axd-text-slate-500 ${descriptionClassName}`}>
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="axd-block axd-space-y-2">
      <div className="axd-flex axd-items-end axd-justify-between axd-gap-4">
        <span className="axd-text-sm axd-font-semibold axd-text-slate-900">{label}</span>
        <span className="axd-text-xs axd-leading-5 axd-text-slate-500">{hint}</span>
      </div>
      {children}
    </label>
  );
}

function TipItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="axd-rounded-3xl axd-border axd-border-slate-200 axd-bg-slate-50 axd-p-4">
      {children}
    </div>
  );
}

function CodePill({ text }: { text: string }) {
  return (
    <div className="axd-inline-flex axd-rounded-2xl axd-bg-white/10 axd-px-4 axd-py-3 axd-font-mono axd-text-sm">
      {text}
    </div>
  );
}

const inputClassName =
  "axd-w-full axd-rounded-2xl axd-border axd-border-slate-200 axd-bg-white axd-px-4 axd-py-3 axd-text-sm axd-text-slate-900 axd-shadow-sm focus:axd-border-brand-400 focus:axd-outline-none focus:axd-ring-4 focus:axd-ring-brand-100";
