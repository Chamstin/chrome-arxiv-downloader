import {
  DEFAULT_SETTINGS,
  QUEUE_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  type ExtensionSettings,
  type PaperItem,
} from "@/shared/types";

export async function getSettings(): Promise<ExtensionSettings> {
  // Migrate any previously synced settings to local-only storage.
  const [localStored, legacySyncStored] = await Promise.all([
    chrome.storage.local.get(SETTINGS_STORAGE_KEY),
    chrome.storage.sync.get(SETTINGS_STORAGE_KEY),
  ]);

  const localSettings = localStored[SETTINGS_STORAGE_KEY] as Partial<ExtensionSettings> | undefined;

  if (localSettings) {
    return {
      ...DEFAULT_SETTINGS,
      ...localSettings,
    };
  }

  const legacySettings = legacySyncStored[SETTINGS_STORAGE_KEY] as
    | Partial<ExtensionSettings>
    | undefined;

  if (legacySettings) {
    const migratedSettings = {
      ...DEFAULT_SETTINGS,
      ...legacySettings,
    };

    await chrome.storage.local.set({
      [SETTINGS_STORAGE_KEY]: migratedSettings,
    });
    await chrome.storage.sync.remove(SETTINGS_STORAGE_KEY);

    return migratedSettings;
  }

  return {
    ...DEFAULT_SETTINGS,
  };
}

export async function setSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: settings,
  });
  await chrome.storage.sync.remove(SETTINGS_STORAGE_KEY);
}

export async function getQueue(): Promise<PaperItem[]> {
  const stored = await chrome.storage.local.get(QUEUE_STORAGE_KEY);
  return sortQueue((stored[QUEUE_STORAGE_KEY] as PaperItem[] | undefined) ?? []);
}

export async function setQueue(queue: PaperItem[]): Promise<void> {
  await chrome.storage.local.set({
    [QUEUE_STORAGE_KEY]: sortQueue(queue),
  });
}

export function sortQueue(queue: PaperItem[]): PaperItem[] {
  return [...queue].sort((left, right) => right.addedAt - left.addedAt);
}

export function upsertQueueItems(
  currentQueue: PaperItem[],
  incomingItems: PaperItem[],
): PaperItem[] {
  const mapped = new Map(currentQueue.map((item) => [item.id, item]));

  for (const incoming of incomingItems) {
    const previous = mapped.get(incoming.id);

    mapped.set(incoming.id, {
      ...previous,
      ...incoming,
      addedAt: previous?.addedAt ?? incoming.addedAt,
      preview: incoming.preview ?? previous?.preview,
      previewStatus: incoming.previewStatus ?? previous?.previewStatus ?? "idle",
      previewError: incoming.previewError ?? previous?.previewError,
    });
  }

  return sortQueue([...mapped.values()]);
}
