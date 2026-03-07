import type { PaperItem } from "@/shared/types";

export function extractArxivIdFromUrl(url: string): string {
  const match = url.match(/\/(?:abs|pdf)\/([^/?#]+)/);
  return match?.[1]?.replace(/\.pdf$/i, "") ?? url;
}

export function makeAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return new URL(url, "https://arxiv.org").toString();
}

export function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").replace(/^Abstract:\s*/i, "").trim();
}

export function sanitizeFilename(input: string, maxLength = 160): string {
  const sanitized = input
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.slice(0, maxLength) || "paper";
}

export function normalizeApiBase(input: string): string {
  return input.trim().replace(/\/+$/, "");
}

export function getOriginPermissionPattern(apiBase: string): string | null {
  if (!apiBase.trim()) {
    return null;
  }

  try {
    const url = new URL(apiBase);
    return `${url.origin}/*`;
  } catch {
    return null;
  }
}

export function renderPrompt(template: string, paper: Pick<PaperItem, "title" | "abstract">): string {
  if (template.includes("{{title}}") || template.includes("{{abstract}}")) {
    return template
      .replaceAll("{{title}}", paper.title)
      .replaceAll("{{abstract}}", paper.abstract);
  }

  return `${template}\n\n标题：${paper.title}\n\n摘要：${paper.abstract}`;
}

export function getChatCompletionText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const data = payload as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
    output_text?: string;
  };

  if (typeof data.output_text === "string") {
    return cleanText(data.output_text);
  }

  const content = data.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return cleanText(content);
  }

  if (Array.isArray(content)) {
    return cleanText(
      content
        .map((part) => part.text ?? "")
        .join(" ")
        .trim(),
    );
  }

  return "";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}
