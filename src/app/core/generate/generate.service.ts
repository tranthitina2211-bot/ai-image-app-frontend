import { Injectable, NgZone } from '@angular/core';

import { MediaService } from '@services/media.service';
import { OverlayService } from '@services/overlay.service';
import { SettingsService } from '@services/settings.service';

import { MediaItem, MediaType } from '@models/media.model';
import { GeneratePayload } from 'src/app/core/generate/generate.types';
import { GenerateApiService } from './generate-api.service';

type PollingJobStatus = 'queued' | 'generating' | 'done' | 'failed' | 'cancelled';

interface GenerationCreateResponse {
  jobId?: string;
  status?: PollingJobStatus;
  progress?: number;
  mediaItemId?: string;
}

interface GenerationMultiCreateResponse {
  jobs?: Array<{
    jobId?: string;
    status?: PollingJobStatus;
    progress?: number;
    mediaItemId?: string;
  }>;
}

interface GenerationStatusResponse {
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

@Injectable({ providedIn: 'root' })
export class GenerateService {
  private jobs = new Map<string, number>();
  private pending = new Set<string>();

  constructor(
    private mediaService: MediaService,
    private overlayService: OverlayService,
    private settingsService: SettingsService,
    private ngZone: NgZone,
    private generateApi: GenerateApiService
  ) {}

  generate(payload: GeneratePayload) {
    console.log('[GENERATE] create job', payload);

    this.generateApi.createJob(payload).subscribe({
      next: (res: GenerationCreateResponse) => {
        const jobId = typeof res?.jobId === 'string' ? res.jobId : '';
        if (!jobId) {
          console.error('[GENERATE] create job response missing jobId', res);
          return;
        }

        const optimistic = this.createOptimisticFromPayload(jobId, payload, res);
        this.mediaService.add(optimistic);
        this.startPolling(jobId, optimistic.id);
      },
      error: (error) => console.error('[GENERATE] create job failed', error)
    });
  }

  upscale(base: MediaItem) {
    console.log('[GENERATE] upscale', base);

    this.generateApi.upscale(base.id).subscribe({
      next: (res: GenerationCreateResponse) => {
        const jobId = typeof res?.jobId === 'string' ? res.jobId : '';
        if (!jobId) {
          console.error('[GENERATE] upscale response missing jobId', res);
          return;
        }

        const optimistic = this.createOptimisticFromBase(jobId, base, res, base.type, {
          url: base.url,
          parentId: base.id
        });

        this.mediaService.add(optimistic);
        this.startPolling(jobId, optimistic.id, base.id_stack);
      },
      error: (error) => console.error('[GENERATE] upscale failed', error)
    });
  }

  variation(base: MediaItem) {
    console.log('[GENERATE] variation x4 start', base);

    this.generateApi.variation(base.id).subscribe({
      next: (res: GenerationMultiCreateResponse) => {
        const jobs = Array.isArray(res?.jobs) ? res.jobs : [];
        if (!jobs.length) {
          console.error('[GENERATE] variation response missing jobs', res);
          return;
        }

        jobs.forEach((jobRes, index) => {
          const jobId = typeof jobRes?.jobId === 'string' ? jobRes.jobId : '';
          if (!jobId) return;

          const optimistic = this.createOptimisticFromBase(jobId, base, jobRes, base.type, {
            url: base.url,
            parentId: base.id,
            orderOffset: index + 1
          });

          this.mediaService.add(optimistic);
          this.startPolling(jobId, optimistic.id, base.id_stack);
        });
      },
      error: (error) => console.error('[GENERATE] variation failed', error)
    });
  }

  imageToVideo(base: MediaItem) {
    console.log('[GENERATE] image to video', base);

    this.generateApi.imageToVideo(base.id).subscribe({
      next: (res: GenerationCreateResponse) => {
        const jobId = typeof res?.jobId === 'string' ? res.jobId : '';
        if (!jobId) {
          console.error('[GENERATE] image to video response missing jobId', res);
          return;
        }

        const optimistic = this.createOptimisticFromBase(jobId, base, res, 'video', {
          url: base.url,
          parentId: base.id
        });

        this.mediaService.add(optimistic);
        this.startPolling(jobId, optimistic.id, base.id_stack);
      },
      error: (error) => console.error('[GENERATE] image to video failed', error)
    });
  }

  cancel(item: MediaItem) {
    const jobId = item.jobId;
    if (!jobId) return;

    console.log('[GENERATE] cancel requested', { itemId: item.id, jobId });
    this.stopPolling(jobId);

    this.mediaService.remove(item.id, false);
    this.generateApi.cancel(jobId).subscribe({
      next: () => console.log('[GENERATE] cancel success', { jobId }),
      error: (error) => {
        console.error('[GENERATE] cancel failed', error);
        this.mediaService.refresh();
      }
    });
  }

  private startPolling(jobId: string, mediaId: string, stackIdForAutoOpen?: string): void {
    if (!jobId) return;

    this.stopPolling(jobId);
    this.scheduleNextPoll(jobId, mediaId, stackIdForAutoOpen, 0);
  }

  private scheduleNextPoll(
    jobId: string,
    mediaId: string,
    stackIdForAutoOpen?: string,
    delayMs = 1200
  ): void {
    const timeoutId = window.setTimeout(() => {
      this.pollOnce(jobId, mediaId, stackIdForAutoOpen);
    }, delayMs);

    this.jobs.set(jobId, timeoutId);
  }

  private pollOnce(jobId: string, mediaId: string, stackIdForAutoOpen?: string): void {
    if (this.pending.has(jobId)) {
      this.scheduleNextPoll(jobId, mediaId, stackIdForAutoOpen, 1200);
      return;
    }

    this.pending.add(jobId);

    this.generateApi.checkStatus(jobId).subscribe({
      next: (job: GenerationStatusResponse) => {
        this.pending.delete(jobId);

        const status = job?.status;
        const progress = Number(job?.progress ?? 0);

        this.patchProcessingMedia(mediaId, {
          progress: this.normalizeProgress(progress),
          status: this.toMediaStatus(status),
          jobId
        });

        if (status === 'done') {
          this.handleDone(jobId, mediaId, job, stackIdForAutoOpen);
          return;
        }

        if (status === 'failed' || status === 'cancelled') {
          this.handleTerminalFailure(jobId, mediaId, status, job?.error);
          return;
        }

        this.scheduleNextPoll(jobId, mediaId, stackIdForAutoOpen, 1200);
      },
      error: (error) => {
        this.pending.delete(jobId);
        this.stopPolling(jobId);
        console.error('[GENERATE] polling failed', { jobId, error });

        this.patchProcessingMedia(mediaId, {
          status: 'error'
        });
      }
    });
  }

  private handleDone(
    jobId: string,
    mediaId: string,
    job: GenerationStatusResponse,
    stackIdForAutoOpen?: string
  ): void {
    this.stopPolling(jobId);

    const patch: Partial<MediaItem> = {
      jobId,
      status: 'success',
      progress: 100,
      type: job?.mediaType ?? this.mediaService.getById(mediaId)?.type ?? 'image'
    };

    if (job?.resultUrl) {
      patch.url = job.resultUrl;
    }

    this.patchProcessingMedia(mediaId, patch);

    const latest = this.mediaService.getById(mediaId);
    if (latest) {
      this.tryAutoOpenResult(latest, stackIdForAutoOpen ?? latest.id_stack);
    }

    this.mediaService.refresh();
    console.log('[GENERATE] polling finished', { jobId, status: 'done' });
  }

  private handleTerminalFailure(
    jobId: string,
    mediaId: string,
    status: 'failed' | 'cancelled',
    error?: string | null
  ): void {
    this.stopPolling(jobId);

    if (status === 'cancelled') {
      this.mediaService.remove(mediaId, false);
    } else {
      this.patchProcessingMedia(mediaId, {
        status: 'error'
      });
    }

    console.error('[GENERATE] polling finished', { jobId, status, error });
    this.mediaService.refresh();
  }

  private stopPolling(jobId: string): void {
    const timer = this.jobs.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.jobs.delete(jobId);
    }
    this.pending.delete(jobId);
  }

  private createOptimisticFromPayload(
    jobId: string,
    payload: GeneratePayload,
    res: GenerationCreateResponse
  ): MediaItem {
    const mediaId = this.resolveMediaId(jobId, res?.mediaItemId);

    return {
      id: mediaId,
      kind: 'media',
      url: '',
      type: 'image',
      prompt: (payload as any)?.prompt ?? '',
      ratio: (payload as any)?.ratio ?? '1:1',
      resolution: (payload as any)?.resolution ?? '',
      seed: (payload as any)?.seed,
      createdAt: new Date(),
      favorite: false,
      status: 'processing',
      progress: this.normalizeProgress(res?.progress ?? 0),
      id_stack: mediaId,
      order_in_stack: 1,
      order_in_board: Date.now(),
      jobId
    };
  }

  private createOptimisticFromBase(
    jobId: string,
    base: MediaItem,
    res: GenerationCreateResponse | { mediaItemId?: string },
    type: MediaType,
    options?: {
      url?: string;
      parentId?: string;
      orderOffset?: number;
    }
  ): MediaItem {
    const mediaId = this.resolveMediaId(jobId, res?.mediaItemId);
    const offset = options?.orderOffset ?? 1;

    return {
      id: mediaId,
      kind: 'media',
      url: options?.url ?? '',
      type,
      prompt: base.prompt,
      ratio: base.ratio,
      resolution: base.resolution,
      seed: base.seed,
      createdAt: new Date(),
      favorite: false,
      status: 'processing',
      progress: this.normalizeProgress((res as any)?.progress ?? 0),
      id_stack: base.id_stack,
      order_in_stack: (base.order_in_stack ?? 0) + offset,
      order_in_board: base.order_in_board ?? Date.now(),
      jobId,
      parentId: options?.parentId
    };
  }

  private resolveMediaId(jobId: string, mediaItemId?: string | null): string {
    return (typeof mediaItemId === 'string' && mediaItemId.trim()) ? mediaItemId : `temp-${jobId}`;
  }

  private normalizeProgress(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private toMediaStatus(status?: PollingJobStatus): MediaItem['status'] {
    if (status === 'done') return 'success';
    if (status === 'failed') return 'error';
    return 'processing';
  }

  private patchProcessingMedia(id: string, partial: Partial<MediaItem>): void {
    const existing = this.mediaService.getById(id);
    if (existing) {
      this.mediaService.patch(id, partial);
      return;
    }

    const fallback: MediaItem = {
      id,
      kind: 'media',
      url: partial.url ?? '',
      type: partial.type ?? 'image',
      createdAt: new Date(),
      favorite: false,
      status: partial.status ?? 'processing',
      progress: partial.progress ?? 0,
      id_stack: id,
      order_in_stack: 1,
      order_in_board: Date.now(),
      jobId: partial.jobId
    };

    this.mediaService.add(fallback);
  }

  private tryAutoOpenResult(real: MediaItem, targetStackId: string): void {
    const autoOpen = this.settingsService.getSnapshot().autoOpenResult;
    if (!autoOpen) return;

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          const snapshot = this.mediaService.snapshot();
          const latest = snapshot.find(x => x.id === real.id);
          if (!latest || latest.status !== 'success') return;

          const stack = snapshot
            .filter(x => x.id_stack === targetStackId)
            .sort((a, b) => a.order_in_stack - b.order_in_stack);

          if (stack.length > 1) {
            const index = stack.findIndex(x => x.id === latest.id);
            this.overlayService.openList(stack, index >= 0 ? index : 0, undefined, 'create');
          } else {
            this.overlayService.open({ mode: 'stack', context: 'create', data: [latest] });
          }
        });
      }, 120);
    });
  }
}
