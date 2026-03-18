import { MediaType } from '@models/media.model';

export interface PromptBridgeValue {
  source: 'manual' | 'media' | 'preset';
  prompt?: string;
  type?: MediaType;
  ratio?: string;
  seed?: number;

  mediaId?: string;
  presetId?: string;
  presetName?: string;
}
