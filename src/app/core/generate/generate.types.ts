export type GenerateMode = 'image' | 'video';

export interface GeneratePayload {
  prompt: string;
  ratio: string;
  mode: GenerateMode;
  resolution?: string;
  fileAttach?: File | null;
  seed?: number;
}
