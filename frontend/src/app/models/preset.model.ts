export type PresetCategory =
  | 'anime'
  | 'realistic'
  | 'myth'
  | 'cinematic'
  | 'product';

export type PresetType = 'image' | 'video';

export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  prompt: string;
  ratio?: string;
  seed?: number;
  type: PresetType;
  previewIds: string[];
}
