import type { PaperItem } from "@/shared/types";
import { cleanText, extractArxivIdFromUrl, makeAbsoluteUrl } from "@/shared/utils";

export type ParsedPaper = {
  paper: PaperItem;
  controlTarget: HTMLElement;
  pageType: "search" | "list";
};

export function detectPageType(): "search" | "list" | null {
  if (location.pathname.startsWith("/search")) {
    return "search";
  }

  if (location.pathname.startsWith("/list")) {
    return "list";
  }

  return null;
}

export function parseCurrentPage(): ParsedPaper[] {
  const pageType = detectPageType();

  if (pageType === "search") {
    return parseSearchPage();
  }

  if (pageType === "list") {
    return parseListPage();
  }

  return [];
}

function parseSearchPage(): ParsedPaper[] {
  const parsed: ParsedPaper[] = [];

  for (const result of document.querySelectorAll<HTMLElement>("li.arxiv-result")) {
    const absLink = result.querySelector<HTMLAnchorElement>("p.list-title a[href*='/abs/']");
    const pdfLink = result.querySelector<HTMLAnchorElement>("p.list-title a[href*='/pdf/']");
    const titleNode = result.querySelector<HTMLElement>("p.title");
    const abstractNode =
      result.querySelector<HTMLElement>("span.abstract-full") ??
      result.querySelector<HTMLElement>("span.abstract-short");

    if (!absLink || !pdfLink || !titleNode) {
      continue;
    }

    const paper = buildPaperItem({
      absUrl: absLink.href,
      pdfUrl: pdfLink.href,
      title: getNodeText(titleNode),
      abstract: abstractNode ? getNodeText(abstractNode, ["a"]) : "",
      authors: getAuthors(result),
    });

    parsed.push({
      paper,
      controlTarget: result,
      pageType: "search",
    });
  }

  return parsed;
}

function parseListPage(): ParsedPaper[] {
  const parsed: ParsedPaper[] = [];

  for (const term of document.querySelectorAll<HTMLElement>("#articles > dt")) {
    const detail = term.nextElementSibling;

    if (!(detail instanceof HTMLElement) || detail.tagName !== "DD") {
      continue;
    }

    const absLink = term.querySelector<HTMLAnchorElement>("a[href^='/abs/']");
    const pdfLink = term.querySelector<HTMLAnchorElement>("a[href^='/pdf/']");
    const titleNode = detail.querySelector<HTMLElement>(".list-title");

    if (!absLink || !pdfLink || !titleNode) {
      continue;
    }

    const paper = buildPaperItem({
      absUrl: makeAbsoluteUrl(absLink.getAttribute("href") ?? absLink.href),
      pdfUrl: makeAbsoluteUrl(pdfLink.getAttribute("href") ?? pdfLink.href),
      title: getNodeText(titleNode, [".descriptor"]),
      abstract: "",
      authors: getAuthors(detail),
    });

    parsed.push({
      paper,
      controlTarget: term,
      pageType: "list",
    });
  }

  return parsed;
}

function buildPaperItem({
  absUrl,
  pdfUrl,
  title,
  abstract,
  authors,
}: {
  absUrl: string;
  pdfUrl: string;
  title: string;
  abstract: string;
  authors: string[];
}): PaperItem {
  const absoluteAbsUrl = makeAbsoluteUrl(absUrl);

  return {
    id: extractArxivIdFromUrl(absoluteAbsUrl),
    title: cleanText(title),
    authors,
    abstract: cleanText(abstract),
    absUrl: absoluteAbsUrl,
    pdfUrl: makeAbsoluteUrl(pdfUrl),
    sourcePageUrl: location.href,
    addedAt: Date.now(),
    previewStatus: "idle",
  };
}

function getAuthors(root: ParentNode): string[] {
  return [...root.querySelectorAll<HTMLAnchorElement>(".list-authors a")]
    .map((anchor) => cleanText(anchor.textContent ?? ""))
    .filter(Boolean);
}

function getNodeText(node: HTMLElement, selectorsToRemove: string[] = []): string {
  const clone = node.cloneNode(true) as HTMLElement;

  for (const selector of selectorsToRemove) {
    clone.querySelectorAll(selector).forEach((matched) => matched.remove());
  }

  return cleanText(clone.textContent ?? "");
}
