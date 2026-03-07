import type { ExtensionSettings, PaperItem } from "@/shared/types";

export type GeneratePreviewMessage = {
  type: "generate-preview";
  paper: PaperItem;
};

export type OpenOptionsMessage = {
  type: "open-options";
};

export type TestApiMessage = {
  type: "test-api";
  settings: ExtensionSettings;
};

export type ExtensionMessage =
  | GeneratePreviewMessage
  | OpenOptionsMessage
  | TestApiMessage;

export type ExtensionResponse =
  | {
      ok: true;
      text?: string;
      count?: number;
    }
  | {
      ok: false;
      error: string;
    };
