import { Injectable, computed, signal } from '@angular/core';
import { GeneratedImage } from '../models/generated-image.model';
import { GenerateRequest } from '../models/generate-request.model';
import { ImageStack } from '../models/image-stack.model';



@Injectable({ providedIn: 'root' })
export class GenerationStoreService  {
  /* =======================
   STATE
  ======================= */

  private readonly _images = signal<GeneratedImage[]>([]);
  readonly images$ = this._images.asReadonly();

  /* =======================
   STACKS (GROUP BY SEED)
  ======================= */

  readonly stacks$ = computed<ImageStack[]>(() => {
    const map = new Map<string, GeneratedImage[]>();

    for (const img of this._images()) {
      if (!map.has(img.seed)) {
        map.set(img.seed, []);
      }
      map.get(img.seed)!.push(img);
    }

    return Array.from(map.entries()).map(([seed, images]) => ({
      seed,
      images
    }));
  });

  /* =======================
   GENERATE
  ======================= */

  generate(payload: GenerateRequest) {
    const seed = crypto.randomUUID();

    const job: GeneratedImage = {
      id: crypto.randomUUID(),
      seed,
      prompt: payload.prompt,
      status: 'generating',
      progress: 0
    };

    this._images.update(list => [job, ...list]);
    this.fakeProgress(job.id);
  }

  generateFromSeed(seed: string, type: 'upscale' | 'variant') {
    const job: GeneratedImage = {
      id: crypto.randomUUID(),
      seed,
      prompt: `${type.toUpperCase()} result`,
      status: 'generating',
      progress: 0
    };

    this._images.update(list => [job, ...list]);
    this.fakeProgress(job.id);
  }

  /* =======================
   FAKE PROGRESS
  ======================= */

  private fakeProgress(id: string) {
    let progress = 0;

    const timer = setInterval(() => {
      progress += 10;

      this._images.update(list =>
        list.map(img =>
          img.id === id ? { ...img, progress } : img
        )
      );

      if (progress >= 100) {
        clearInterval(timer);
        this.finishJob(id);
      }
    }, 300);
  }

  private finishJob(id: string) {
    this._images.update(list =>
      list.map(img =>
        img.id === id
          ? {
              ...img,
              status: 'done',
              progress: 100,
              imageUrl: this.fakeImage()
            }
          : img
      )
    );
  }

  private fakeImage(): string {
    return `https://picsum.photos/600/600?random=${Math.random()}`;
  }
}
