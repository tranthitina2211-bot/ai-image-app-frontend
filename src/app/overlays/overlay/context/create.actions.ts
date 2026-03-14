import { OverlayAction } from '@models/overlay-action.model';
import { MediaItem } from '@models/media.model';
import { StackItem } from '@models/stack.model';

export const createActions: OverlayAction[] = [
  {
    id: 'variation',
    label: 'Variation',
    icon: 'auto_fix_high'
  },
  {
    id: 'upscale',
    label: 'Upscale',
    icon: 'zoom_in'
  },
  {
    id: 'image-to-video',
    label: 'Video',
    icon: 'movie',
    visible: ({ item }) => (item as MediaItem).type === 'image'
  },
  {
    id: 'drop-out',
    label: 'Drop out',
    icon: 'reply', // icon Material hợp lệ
    visible: ({ stackSize }) => stackSize >= 2
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'delete'
  }
];
