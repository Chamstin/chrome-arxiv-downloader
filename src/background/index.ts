import type { ExtensionMessage, ExtensionResponse } from "@/shared/messages";
import { getSettings } from "@/shared/storage";
import type { ExtensionSettings, PaperItem } from "@/shared/types";
import {
  getChatCompletionText,
  normalizeApiBase,
  renderPrompt,
} from "@/shared/utils";

chrome.runtime.onInstalled.addListener(() => {
  void getSettings();
});

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  void handleMessage(message)
    .then(sendResponse)
    .catch((error: unknown) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown background error",
      } satisfies ExtensionResponse);
    });

  return true;
});

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case "generate-preview":
      return generatePreview(message.paper);
    case "open-options":
      await chrome.runtime.openOptionsPage();
      return { ok: true };
    case "test-api":
      return testApi(message.settings);
    default:
      return {
        ok: false,
        error: "Unsupported message type",
      };
  }
}

async function generatePreview(paper: PaperItem): Promise<ExtensionResponse> {
  const settings = await getSettings();
  return summarizePaper(settings, paper);
}

async function testApi(settings: ExtensionSettings): Promise<ExtensionResponse> {
  const response = await summarizePaper(settings, {
    title: "Sparse Attention for Efficient Long-Context Reasoning",
    abstract:
      "We introduce a sparse attention strategy for long-context language modeling. Our approach preserves reasoning quality while reducing memory overhead and inference latency across benchmark tasks.",
  });

  return response;
}

async function summarizePaper(
  settings: ExtensionSettings,
  paper: Pick<PaperItem, "title" | "abstract">,
): Promise<ExtensionResponse> {
  if (!settings.apiBase.trim()) {
    return { ok: false, error: "API Base is not configured" };
  }

  if (!settings.apiKey.trim()) {
    return { ok: false, error: "API key is not configured" };
  }

  if (!settings.model.trim()) {
    return { ok: false, error: "Model is not configured" };
  }

  const endpoint = `${normalizeApiBase(settings.apiBase)}/chat/completions`;
  const prompt = renderPrompt(settings.prompt, paper);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: settings.model.trim(),
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You write concise one-sentence arXiv paper previews.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      ok: false,
      error: `Preview API request failed (${response.status}): ${detail.slice(0, 200)}`,
    };
  }

  const payload = (await response.json()) as unknown;
  const text = getChatCompletionText(payload);

  if (!text) {
    return {
      ok: false,
      error: "The API returned an empty preview",
    };
  }

  return {
    ok: true,
    text,
  };
}
