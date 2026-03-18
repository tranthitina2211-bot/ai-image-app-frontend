import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GeneratePayload } from './generate.types';
import { MediaType } from '@models/media.model';

export type PollingJobStatus = 'queued' | 'generating' | 'done' | 'failed' | 'cancelled';

export interface GenerationCreateResponse {
  jobId: string;
  status?: PollingJobStatus;
  progress?: number;
  mediaItemId?: string;
}

export interface GenerationMultiCreateResponse {
  jobs: Array<{
    jobId: string;
    status?: PollingJobStatus;
    progress?: number;
    mediaItemId?: string;
  }>;
}

export interface GenerationStatusResponse {
  jobId: string;
  status: PollingJobStatus;
  progress: number;
  error?: string | null;
  providerJobId?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  cancelledAt?: string | null;
  mediaItemId?: string | null;
  resultUrl?: string | null;
  mediaStatus?: 'processing' | 'success' | 'error' | null;
  mediaType?: MediaType | null;
}

export interface GenerationCancelResponse {
  jobId: string;
  status: PollingJobStatus;
  progress: number;
  error?: string | null;
  mediaItemId?: string | null;
  resultUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class GenerateApiService {
  constructor(private http: HttpClient) {}

  createJob(payload: GeneratePayload): Observable<GenerationCreateResponse> {
    if (payload.fileAttach) {
      const form = new FormData();
      form.append('prompt', payload.prompt);
      form.append('ratio', payload.ratio);
      form.append('mode', payload.mode);

      if (payload.resolution) form.append('resolution', payload.resolution);
      if (payload.seed != null) form.append('seed', String(payload.seed));

      form.append('fileAttach', payload.fileAttach);
      return this.http.post<GenerationCreateResponse>('/api/generate', form);
    }

    return this.http.post<GenerationCreateResponse>('/api/generate', payload);
  }

  variation(mediaId: string): Observable<GenerationMultiCreateResponse> {
    return this.http.post<GenerationMultiCreateResponse>(`/api/media/${mediaId}/variation`, {});
  }

  upscale(mediaId: string): Observable<GenerationCreateResponse> {
    return this.http.post<GenerationCreateResponse>(`/api/media/${mediaId}/upscale`, {});
  }

  imageToVideo(mediaId: string): Observable<GenerationCreateResponse> {
    return this.http.post<GenerationCreateResponse>(`/api/media/${mediaId}/image-to-video`, {});
  }

  checkStatus(jobId: string): Observable<GenerationStatusResponse> {
    return this.http.get<GenerationStatusResponse>(`/api/generate/${jobId}`);
  }

  cancel(jobId: string): Observable<GenerationCancelResponse> {
    return this.http.post<GenerationCancelResponse>(`/api/jobs/${jobId}/cancel`, {});
  }
}
