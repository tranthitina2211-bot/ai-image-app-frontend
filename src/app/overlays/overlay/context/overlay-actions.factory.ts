import { OverlayAction } from '@models/overlay-action.model';
import { OverlayContext } from '@models/overlay-payload.model';

function createActions(): OverlayAction[] {
  return [
    { id: 'variation', label: 'Variation', icon: 'auto_fix_high' },
    { id: 'upscale', label: 'Upscale', icon: 'zoom_in' },
    {
      id: 'image-to-video',
      label: 'Image → Video',
      icon: 'movie',
      visible: ({ item }) => item.type === 'image'
    },
    {
      id: 'drop-out',
      label: 'Drop out',
      icon: 'reply',
      visible: ({ stackSize }) => stackSize >= 2
    },
    { id: 'view-detail', label: 'View detail', icon: 'info' },
    { id: 'delete', label: 'Delete', icon: 'delete' }
  ];
}

function myImagesActions(): OverlayAction[] {
  return [
    { id: 'copy-prompt', label: 'Copy prompt', icon: 'content_copy' },
    { id: 'variation', label: 'Variation', icon: 'auto_fix_high' },
    { id: 'upscale', label: 'Upscale', icon: 'zoom_in' },
    {
      id: 'image-to-video',
      label: 'Image → Video',
      icon: 'movie',
      visible: ({ item }) => item.type === 'image'
    },
    { id: 'add-to-collection', label: 'Add to collection', icon: 'folder' },
    { id: 'download', label: 'Download', icon: 'download' },
    { id: 'view-detail', label: 'View detail', icon: 'info' },
    { id: 'delete', label: 'Delete', icon: 'delete' }
  ];
}

function favoritesActions(): OverlayAction[] {
  return [
    { id: 'copy-prompt', label: 'Copy prompt', icon: 'content_copy' },
    { id: 'add-to-collection', label: 'Add to collection', icon: 'folder' },
    { id: 'download', label: 'Download', icon: 'download' },
    { id: 'view-detail', label: 'View detail', icon: 'info' }
  ];
}

function collectionActions(): OverlayAction[] {
  return [
    { id: 'copy-prompt', label: 'Copy prompt', icon: 'content_copy' },
    { id: 'download', label: 'Download', icon: 'download' },
    { id: 'view-detail', label: 'View detail', icon: 'info' },
    { id: 'delete', label: 'Delete', icon: 'delete' }
  ];
}

function presetActions(): OverlayAction[] {
  return [
    { id: 'copy-prompt', label: 'Copy preset text', icon: 'content_copy' },
    { id: 'use-preset', label: 'Use preset', icon: 'bolt' },
    { id: 'view-detail', label: 'View detail', icon: 'info' }
  ];
}

export function getOverlayActions(ctx?: OverlayContext): OverlayAction[] {
  switch (ctx) {
    case 'create':
      return createActions();
    case 'my-images':
      return myImagesActions();
    case 'favorites':
      return favoritesActions();
    case 'collection':
      return collectionActions();
    case 'presets':
      return presetActions();
    default:
      return createActions();
  }
}
