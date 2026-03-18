import { MediaItem } from '@models/media.model';
import { Preset } from '@models/preset.model';

export type OverlayMode = 'stack' | 'list';
export type OverlayContext = 'create' | 'my-images' | 'favorites' | 'presets' | 'collection';

export interface OverlayPayload {
  mode: OverlayMode;
  data: MediaItem[];
  startIndex?: number;
  title?: string;
  context?: OverlayContext;
  rect?: DOMRect;

  preset?: Preset | null;
  presets?: Preset[];
}
