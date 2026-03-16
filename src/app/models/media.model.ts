export type MediaType = 'image' | 'video';
export type MediaStatus = 'processing' | 'success' | 'error';

export interface MediaItem {
  id: string;
  kind: 'media';

  url: string;
  type: MediaType;

  prompt?: string;
  ratio?: string;
  resolution?: string;
  seed?: number;

  createdAt?: Date | string;
  favorite: boolean;

  status: MediaStatus;
  progress?: number;

  id_stack: string;
  order_in_stack: number;
  order_in_board?: number;
  jobId?: string;
  parentId?: string;
  ghostOf?: string;
}
