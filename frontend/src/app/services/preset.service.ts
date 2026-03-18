import { Injectable } from '@angular/core';

import { PRESETS_MOCK } from 'src/app/core/data/presets.data';
import { mapPresetToCardVm, PresetCardVm } from 'src/app/core/mappers/preset.mapper';

import { MediaItem } from '@models/media.model';
import { Preset, PresetCategory } from '@models/preset.model';
import { PromptBridgeValue } from '@models/prompt-bridge.model';

import { MediaService } from '@services/media.service';

@Injectable({ providedIn: 'root' })
export class PresetService {
  private readonly presets = PRESETS_MOCK.slice();

  constructor(private mediaService: MediaService) {}

  getAll(): Preset[] {
    return this.presets.slice();
  }

  getById(id: string): Preset | undefined {
    return this.presets.find(preset => preset.id === id);
  }

  getCategories(): PresetCategory[] {
    const seen = new Set<PresetCategory>();
    const ordered: PresetCategory[] = [];

    for (const preset of this.presets) {
      if (!seen.has(preset.category)) {
        seen.add(preset.category);
        ordered.push(preset.category);
      }
    }

    return ordered;
  }

  getByCategory(category: PresetCategory | 'all'): Preset[] {
    if (category === 'all') return this.getAll();
    return this.presets.filter(preset => preset.category === category);
  }

  getPreviewItems(preset: Preset): MediaItem[] {
    return this.mediaService.getManyByIds(preset.previewIds);
  }

  getPreviewItem(preset: Preset): MediaItem | null {
    return this.getPreviewItems(preset)[0] ?? null;
  }

  getCardVmList(category: PresetCategory | 'all' = 'all'): PresetCardVm[] {
    return this.getByCategory(category).map(preset =>
      mapPresetToCardVm(preset, (id: string) => this.mediaService.getById(id))
    );
  }

  toPromptBridgeValue(preset: Preset): PromptBridgeValue {
    return {
      source: 'preset',
      prompt: preset.prompt,
      type: preset.type,
      ratio: preset.ratio,
      seed: preset.seed,
      presetId: preset.id,
      presetName: preset.name
    };
  }
}
