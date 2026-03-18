import {
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  OnInit,
  OnDestroy,
  AfterViewInit
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

import { GeneratePayload } from 'src/app/core/generate/generate.types';
import { GenerateService } from 'src/app/core/generate/generate.service';

import { PromptBridgeService } from '@services/promptbridge.service';
import { MediaService } from '@services/media.service';
import { OverlayService } from '@services/overlay.service';
import { SettingsService } from '@services/settings.service';

import { MediaItem } from '@models/media.model';
import { PromptBridgeValue } from '@models/prompt-bridge.model';

type ProcessingThumbVM =
  | { kind: 'processing'; progress: number }
  | { kind: 'more'; progress: number; moreCount: number };

  type PromptThumbVM =
    | { id: string; kind: 'processing'; progress: number; type: 'image' | 'video' }
    | { id: string; kind: 'done'; type: 'image' | 'video'; url?: string }
    | { kind: 'more'; moreCount: number; type: 'image' | 'video'; url?: string; progress?: number };

@Component({
  selector: 'app-prompt-bar',
  templateUrl: './prompt-bar.component.html',
  styleUrls: ['./prompt-bar.component.scss']
})
export class PromptBarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('promptInput') promptInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('optionsPanel') optionsPanel!: ElementRef<HTMLElement>;

  prompt = '';
  showOptions = false;
  panelPos = { top: 0, left: 0 };

  credits = 2;
  creditPulse = false;

  durations = ['6s', '10s'];
  resolutions = ['480p', '720p'];
  ratio = [
    { key: '1:1', label: '1:1', cls: 'ratio-1-1' },
    { key: '3:4', label: '3:4', cls: 'ratio-3-4' },
    { key: '4:3', label: '4:3', cls: 'ratio-4-3' },
    { key: '16:9', label: '16:9', cls: 'ratio-16-9' },
    { key: '9:16', label: '9:16', cls: 'ratio-9-16' }
  ];

  fileAttach: File | null = null;
  presetSeed?: number | null = null;

  selected = {
    mode: 'Image' as 'Image' | 'Video',
    duration: '6s',
    resolution: '480p',
    ratio: '1:1'
  };

  previewUrl: string | null = null;
  selectedFile?: File;

  private processingList: MediaItem[] = [];
  private recentList: MediaItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private promptBridge: PromptBridgeService,
    private generateService: GenerateService,
    private mediaService: MediaService,
    private overlayService: OverlayService,
    private settingsService: SettingsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.selected.ratio = settings.defaultRatio;
        this.updateCredits();

        if (!settings.autoSavePrompt) {
          this.prompt = '';
          this.presetSeed = null;
          if (this.promptInput?.nativeElement) {
            const textarea = this.promptInput.nativeElement;
            textarea.value = '';
            textarea.style.height = 'auto';
          }
        }
      });

      this.mediaService.list$
        .pipe(takeUntil(this.destroy$))
        .subscribe((list: MediaItem[]) => {

          const visibleJobs = list
            .filter((i: MediaItem) => {

              // hide REAL processing child jobs
              if (
                i.status === 'processing' &&
                i.jobId &&
                !i.ghostOf &&
                i.parentId
              ) {
                return false;
              }

              // hide ghost success (sau khi job xong)
              if (i.status === 'success' && i.ghostOf) {
                return false;
              }

              return true;
            })
            .sort((a, b) => (b.order_in_board ?? 0) - (a.order_in_board ?? 0));

            this.processingList = visibleJobs
              .filter(i => i.status === 'processing')
              .slice(0,4);
          this.recentList = visibleJobs.slice(0, 20);
        });

    this.promptBridge.value$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: PromptBridgeValue | null) => {
        if (!value) return;
        this.applyBridgeValue(value, false);
      });
  }

  ngAfterViewInit(): void {
    const current = this.promptBridge.snapshot();
    if (current) {
      this.applyBridgeValue(current, true);
      return;
    }

    const settings = this.settingsService.getSnapshot();
    this.selected.ratio = settings.defaultRatio;
    this.updateCredits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyBridgeValue(value: PromptBridgeValue, focusInput: boolean): void {
    this.prompt = value.prompt ?? this.prompt;
    this.presetSeed = value.seed ?? null;

    if (value.type === 'video') {
      this.selectMode('Video', false);
      this.selectResolution('720p', false);
    } else if (value.type === 'image') {
      this.selectMode('Image', false);
      this.selectResolution('720p', false);
    }

    if (value.ratio) {
      this.selectRatio(value.ratio, false);
    }

    this.updateCredits();

    if (this.promptInput?.nativeElement) {
      const textarea = this.promptInput.nativeElement;
      textarea.value = this.prompt;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

      if (focusInput) {
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        });
      }
    }
  }

  onPromptThumbClick(vm: PromptThumbVM) {
    if (vm.kind === 'more') {
      this.router.navigate(['/app/create']);
      return;
    }

    const item = this.recentList.find(i => i.id === vm.id);
    if (!item) return;

    this.overlayService.open({
      mode: 'stack',
      context: 'create',
      data: [item]
    });
  }


  get promptThumbs(): PromptThumbVM[] {
    const list = this.recentList;
    const max = 4;
    if (!list.length) return [];

    const toVM = (it: MediaItem): PromptThumbVM => {
      if (it.status === 'processing') {
        return {
          id: it.id,
          kind: 'processing',
          progress: it.progress ?? 0,
          type: it.type
        };
      }

      return {
        id: it.id,
        kind: 'done',
        type: it.type,
        url: it.url
      };
    };

    if (list.length <= max) {
      return list.slice(0, max).map(toVM);
    }

    const shown = list.slice(0, max);
    const moreCount = list.length - max;

    const vm = shown.map(toVM);
    const last = vm[max - 1];
    if (last.kind === 'processing') {
      vm[max - 1] = { kind: 'more', moreCount, type: last.type, progress: last.progress };
    } else {
      vm[max - 1] = { kind: 'more', moreCount, type: last.type, url: last.url };
    }
    return vm;
  }

  get processingThumbs(): ProcessingThumbVM[] {
    const list = this.processingList;
    const max = 4;

    if (list.length === 0) return [];

    if (list.length <= max) {
      return list.slice(0, max).map((i: MediaItem) => ({
        kind: 'processing',
        progress: i.progress ?? 0
      }));
    }

    const shown = list.slice(0, max);
    const moreCount = list.length - max;

    return [
      { kind: 'processing', progress: shown[0].progress ?? 0 },
      { kind: 'processing', progress: shown[1].progress ?? 0 },
      { kind: 'processing', progress: shown[2].progress ?? 0 },
      { kind: 'more', progress: shown[3].progress ?? 0, moreCount }
    ];
  }

  onGenerate() {
    const trimmedPrompt = (this.prompt ?? '').trim();
    const inferredMode = this.fileAttach && !trimmedPrompt ? 'video' : (this.selected.mode === 'Image' ? 'image' : 'video');

    const payload: GeneratePayload = {
      prompt: trimmedPrompt,
      ratio: this.selected.ratio,
      mode: inferredMode,
      resolution: this.selected.resolution,
      fileAttach: this.fileAttach,
      seed: this.presetSeed ?? undefined
    };

    const autoSavePrompt = this.settingsService.getSnapshot().autoSavePrompt;

    if (autoSavePrompt) {
      this.promptBridge.setValue({
        source: 'manual',
        prompt: trimmedPrompt,
        type: payload.mode,
        ratio: payload.ratio,
        seed: payload.seed
      });
    }

    this.generateService.generate(payload);
    setTimeout(() => this.promptInput?.nativeElement.focus(), 1200);
  }

  toggleOptions(event: MouseEvent) {
    event.stopPropagation();

    const btn = event.currentTarget as HTMLElement;

    if (this.showOptions) {
      this.showOptions = false;
      return;
    }

    const rect = btn.getBoundingClientRect();
    this.panelPos = { top: rect.top - 8, left: rect.left };
    this.showOptions = true;
  }

  selectMode(mode: 'Image' | 'Video', close = true) {
    this.selected.mode = mode;
    if (mode === 'Image') this.selected.duration = '6s';
    this.updateCredits();
    if (close) this.closePanel();
  }

  selectDuration(value: string) {
    this.selected.duration = value;
    this.updateCredits();
    this.closePanel();
  }

  selectResolution(value: string, close = true) {
    this.selected.resolution = value;
    this.updateCredits();
    if (close) this.closePanel();
  }

  selectRatio(value: string, close = true) {
    this.selected.ratio = value;
    if (close) this.closePanel();
  }

  private closePanel() {
    this.showOptions = false;
    setTimeout(() => this.promptInput?.nativeElement.focus(), 0);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.showOptions) return;

    const target = event.target as HTMLElement;

    if (this.optionsPanel?.nativeElement.contains(target) || target.closest('.mode-btn')) {
      return;
    }

    this.closePanel();
  }

  private updateCredits() {
    let base = this.selected.mode === 'Video' ? 4 : 2;
    if (this.selected.resolution === '720p') base += 2;
    if (this.selected.duration === '10s') base += 2;

    this.credits = base;

    this.creditPulse = true;
    setTimeout(() => (this.creditPulse = false), 300);
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    this.selectedFile = input.files[0];
    this.fileAttach = this.selectedFile;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(this.selectedFile);

    input.value = '';
  }

  removeImage() {
    this.previewUrl = null;
    this.selectedFile = undefined;
    this.fileAttach = null;
  }

  get canGenerate(): boolean {
    const hasPrompt = (this.prompt ?? '').trim().length > 0;
    const hasImage = !!this.selectedFile;

    const enoughCredits = this.credits <= 6;
    return (hasPrompt || hasImage) && enoughCredits;
  }

  get isImageMode() {
    return this.selected.mode === 'Image';
  }
}
