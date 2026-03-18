import { MediaItem } from '@models/media.model';
import { Preset } from '@models/preset.model';

export interface PresetCardVm {
  preset: Preset;
  cover: MediaItem | null;
  previewItems: MediaItem[];
  previewCount: number;
  hasVideo: boolean;
}

export function resolvePresetPreviewItems(
  preset: Preset,
  mediaById: (id: string) => MediaItem | undefined
): MediaItem[] {
  return preset.previewIds
    .map(id => mediaById(id))
    .filter((item): item is MediaItem => !!item);
}

export function mapPresetToCardVm(
  preset: Preset,
  mediaById: (id: string) => MediaItem | undefined
): PresetCardVm {
  const previewItems = resolvePresetPreviewItems(preset, mediaById);

  return {
    preset,
    cover: previewItems[0] ?? null,
    previewItems,
    previewCount: previewItems.length,
    hasVideo: previewItems.some(item => item.type === 'video')
  };
}
