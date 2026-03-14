import { MediaItem } from '@models/media.model';

export type OverlayActionId =
  | 'upscale'
  | 'variation'
  | 'image-to-video'
  | 'drop-out'
  | 'delete'
  | 'copy-prompt'
  | 'toggle-favorite'
  | 'use-preset'
  | 'add-to-collection'
  | 'download'
  | 'view-detail';

export interface OverlayAction {
  id: OverlayActionId;
  label: string;
  icon?: string;
  visible?: (ctx: { item: MediaItem; stackSize: number }) => boolean;
}
