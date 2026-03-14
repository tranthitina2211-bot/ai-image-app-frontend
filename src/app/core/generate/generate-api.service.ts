import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GeneratePayload } from './generate.types';

@Injectable({ providedIn: 'root' })
export class GenerateApiService {
  constructor(private http: HttpClient) {}

  createJob(payload: GeneratePayload) {
    if (payload.fileAttach) {
      const form = new FormData();
      form.append('prompt', payload.prompt);
      form.append('ratio', payload.ratio);
      form.append('mode', payload.mode);
      if (payload.resolution) form.append('resolution', payload.resolution);
      if (payload.seed != null) form.append('seed', String(payload.seed));
      form.append('fileAttach', payload.fileAttach);
      return this.http.post<any>('/api/generate', form);
    }
    return this.http.post<any>('/api/generate', payload);
  }

  variation(mediaId: string) {
    return this.http.post<any>(`/api/media/${mediaId}/variation`, {});
  }

  upscale(mediaId: string) {
    return this.http.post<any>(`/api/media/${mediaId}/upscale`, {});
  }

  imageToVideo(mediaId: string) {
    return this.http.post<any>(`/api/media/${mediaId}/image-to-video`, {});
  }

  checkStatus(jobId: string) {
    return this.http.get<any>(`/api/generate/${jobId}`);
  }

  cancel(jobId: string) {
    return this.http.post<any>(`/api/jobs/${jobId}/cancel`, {});
  }
}
