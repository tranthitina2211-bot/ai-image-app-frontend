import { Injectable, NgZone } from '@angular/core';

import { MediaService } from '@services/media.service';
import { OverlayService } from '@services/overlay.service';
import { SettingsService } from '@services/settings.service';

import { MediaItem } from '@models/media.model';
import { GeneratePayload } from 'src/app/core/generate/generate.types';
import { GenerateApiService } from './generate-api.service';

@Injectable({ providedIn: 'root' })
export class GenerateService {
  private jobs = new Map<string, any>();

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
      next: (res) => {
        const item = this.extractMedia(res)[0];
        if (item) {
          this.mediaService.add(item);
        }
        const jobIds = this.extractJobIds(res);
        jobIds.forEach(jobId => this.startPolling(jobId, item?.id));
      },
      error: (error) => console.error('[GENERATE] create job failed', error)
    });
  }

  upscale(base: MediaItem) {
    console.log('[GENERATE] upscale', base);
    this.generateApi.upscale(base.id).subscribe({
      next: (res) => this.handleDerivedJobCreated(res, base),
      error: (error) => console.error('[GENERATE] upscale failed', error)
    });
  }

  variation(base: MediaItem) {
    console.log('[GENERATE] variation x4 start', base);
    this.generateApi.variation(base.id).subscribe({
      next: (res) => this.handleDerivedJobCreated(res, base),
      error: (error) => console.error('[GENERATE] variation failed', error)
    });
  }

  imageToVideo(base: MediaItem) {
    console.log('[GENERATE] image to video', base);
    this.generateApi.imageToVideo(base.id).subscribe({
      next: (res) => this.handleDerivedJobCreated(res, base),
      error: (error) => console.error('[GENERATE] image to video failed', error)
    });
  }

  cancel(item: MediaItem) {
    const jobId = item.jobId;
    if (!jobId) return;

    console.log('[GENERATE] cancel requested', { itemId: item.id, jobId });
    const timer = this.jobs.get(jobId);
    if (timer) {
      clearInterval(timer);
      this.jobs.delete(jobId);
    }

    this.mediaService.remove(item.id, false);
    this.generateApi.cancel(jobId).subscribe({
      next: () => console.log('[GENERATE] cancel success', { jobId }),
      error: (error) => {
        console.error('[GENERATE] cancel failed', error);
        this.mediaService.refresh();
      }
    });
  }

  private handleDerivedJobCreated(res: any, base: MediaItem): void {
    const items = this.extractMedia(res);
    items.forEach((item, index) => {
      item.order_in_board = base.order_in_board;
      item.order_in_stack = (base.order_in_stack ?? 0) + index + 1;
      this.mediaService.add(item);
    });

    const jobIds = this.extractJobIds(res);
    jobIds.forEach((jobId, index) => this.startPolling(jobId, items[index]?.id, base.id_stack));
  }

  private extractJobIds(res: any): string[] {
    if (Array.isArray(res?.jobIds)) {
      return res.jobIds.filter((value: unknown): value is string => typeof value === 'string');
    }

    if (Array.isArray(res?.jobs?.data)) {
      return res.jobs.data.map((job: any) => job?.id).filter((value: unknown): value is string => typeof value === 'string');
    }
    const single = res?.jobId ?? res?.job?.id;
    return single ? [single] : [];
  }

  private startPolling(jobId: string, optimisticMediaId?: string, stackIdForAutoOpen?: string): void {
    const tick = setInterval(() => {
      this.generateApi.checkStatus(jobId).subscribe({
        next: (job) => {
          const status = job?.status;
          const results = Array.isArray(job?.results?.data)
            ? job.results.data
            : Array.isArray(job?.results)
              ? job.results
              : [];

          const first = results[0] as MediaItem | undefined;
          if (first) {
            if (optimisticMediaId && optimisticMediaId !== first.id) {
              this.mediaService.remove(optimisticMediaId, false);
            }
            const existing = this.mediaService.getById(first.id);
            if (existing) {
              this.mediaService.patch(first.id, first);
            } else {
              this.mediaService.add(first);
            }
          } else if (optimisticMediaId) {
            const processing = this.mediaService.getById(optimisticMediaId);
            if (processing) {
              const nextProgress = Math.min(95, Math.max(processing.progress ?? 0, (job?.progress ?? 0) || 15));
              this.mediaService.patch(optimisticMediaId, { progress: nextProgress });
            }
          }

          if (status === 'done' || status === 'failed' || status === 'cancelled') {
            clearInterval(tick);
            this.jobs.delete(jobId);
            console.log('[GENERATE] polling finished', { jobId, status });
            if (status === 'cancelled' && optimisticMediaId) {
              this.mediaService.remove(optimisticMediaId, false);
            } else {
              this.mediaService.refresh();
            }
            if (status === 'done' && first) {
              this.tryAutoOpenResult(first, stackIdForAutoOpen ?? first.id_stack);
            }
          }
        },
        error: (error) => {
          clearInterval(tick);
          this.jobs.delete(jobId);
          console.error('[GENERATE] polling failed', { jobId, error });
        }
      });
    }, 1200);

    this.jobs.set(jobId, tick);
  }

  private extractMedia(res: any): MediaItem[] {
    const jobList = Array.isArray(res?.jobs) ? res.jobs : Array.isArray(res?.jobs?.data) ? res.jobs.data : null;
    if (jobList) {
      return jobList.flatMap((job: any) => Array.isArray(job?.results?.data)
        ? job.results.data
        : Array.isArray(job?.results)
          ? job.results
          : []);
    }

    const results = Array.isArray(res?.job?.results?.data)
      ? res.job.results.data
      : Array.isArray(res?.job?.results)
        ? res.job.results
        : [];

    return results ?? [];
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
