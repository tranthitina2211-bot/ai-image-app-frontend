import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { PresetCategory, Preset } from '@models/preset.model';
import { OverlayPayload } from '@models/overlay-payload.model';

import { PresetService } from '@services/preset.service';
import { PromptBridgeService } from '@services/promptbridge.service';
import { OverlayService } from '@services/overlay.service';

import { PresetCardVm } from 'src/app/core/mappers/preset.mapper';

type PresetTab = 'all' | PresetCategory;

@Component({
  selector: 'app-presets',
  templateUrl: './presets.component.html',
  styleUrls: ['./presets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetsComponent implements OnInit {
  tabs: Array<{ key: PresetTab; label: string }> = [];
  activeTab: PresetTab = 'all';
  cards: PresetCardVm[] = [];

  constructor(
    private presetService: PresetService,
    private promptBridge: PromptBridgeService,
    private overlayService: OverlayService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tabs = [
      { key: 'all', label: 'All' },
      ...this.presetService.getCategories().map(category => ({
        key: category,
        label: this.toCategoryLabel(category)
      }))
    ];

    this.refreshCards();
  }

  setTab(tab: PresetTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.refreshCards();
  }

  trackByPreset(_: number, vm: PresetCardVm): string {
    return vm.preset.id;
  }

  async copyPrompt(preset: Preset): Promise<void> {
    const text = (preset.prompt ?? '').trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }

  usePreset(preset: Preset): void {
    this.promptBridge.setValue(this.presetService.toPromptBridgeValue(preset));
    this.router.navigate(['/app/create']);
  }

  openPreset(vm: PresetCardVm): void {
    const overlayItems = this.cards
      .map(card => card.cover)
      .filter((item): item is NonNullable<typeof item> => !!item);

    if (!overlayItems.length) return;

    const presets = this.cards
      .filter(card => !!card.cover)
      .map(card => card.preset);

    const startIndex = presets.findIndex(p => p.id === vm.preset.id);

    this.overlayService.open({
      mode: 'list',
      context: 'presets',
      title: vm.preset.name,
      data: overlayItems,
      startIndex: startIndex >= 0 ? startIndex : 0,
      preset: vm.preset,
      presets
    });
  }

  private refreshCards(): void {
    this.cards = this.presetService.getCardVmList(this.activeTab);
  }

  private toCategoryLabel(value: PresetCategory): string {
    switch (value) {
      case 'anime':
        return 'Anime';
      case 'realistic':
        return 'Realistic';
      case 'myth':
        return 'Myth';
      case 'cinematic':
        return 'Cinematic';
      case 'product':
        return 'Product';
      default:
        return value;
    }
  }
}
