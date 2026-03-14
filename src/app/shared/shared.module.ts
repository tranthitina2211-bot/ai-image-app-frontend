import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MenuItems } from './menu-items/menu-items';
import {
  AccordionAnchorDirective,
  AccordionLinkDirective,
  AccordionDirective
} from './accordion';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { HasRoleDirective } from './directives/has-role.directive';
import { TruncatePipe } from './pipes/truncate.pipe';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { TextFieldModule } from '@angular/cdk/text-field';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Shared components
import { PromptBarComponent } from './components/prompt-bar/prompt-bar.component';
import { PromptDialogComponent } from '@components/prompt-dialog/prompt-dialog.component';
import { CollectionPickerDialogComponent } from '@components/collection-picker-dialog/collection-picker-dialog.component';

import { BoardItemComponent } from '@components/board-item/board-item.component';
import { GridContainerComponent } from '@components/grid-container/grid-container.component';
import { DayFolderCardComponent } from '@components/day-folder-card/day-folder-card.component';
import { MediaCardComponent } from '@components/app-media-card/media-card.component';

// Overlay container
import { OverlayComponent } from '@overlays/overlay/overlay.component';

// Overlay internal components
import { StackComponent } from '@overlays/overlay/components/stack/stack.component';
import { ActionBarComponent } from '@overlays/overlay/components/actions/action-bar.component';
import { ItemDetailSheetComponent } from '@components/item-detail-sheet/item-detail-sheet.component';
import { PresetCardComponent } from '@components/preset-card/preset-card.component';

@NgModule({
  declarations: [
    AccordionAnchorDirective,
    AccordionLinkDirective,
    AccordionDirective,
    ConfirmDialogComponent,
    HasRoleDirective,
    TruncatePipe,

    PromptBarComponent,
    PromptDialogComponent,
    CollectionPickerDialogComponent,

    MediaCardComponent,
    DayFolderCardComponent,
    GridContainerComponent,
    BoardItemComponent,
    OverlayComponent,
    StackComponent,
    ActionBarComponent,
    ItemDetailSheetComponent,
    PresetCardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
    MatBadgeModule,
    MatSlideToggleModule,

    TextFieldModule,
    ScrollingModule,
    DragDropModule
  ],
  exports: [
    AccordionAnchorDirective,
    AccordionLinkDirective,
    AccordionDirective,
    HasRoleDirective,
    TruncatePipe,

    PromptBarComponent,

    MediaCardComponent,
    DayFolderCardComponent,
    BoardItemComponent,
    GridContainerComponent,
    OverlayComponent,

    ScrollingModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
    MatBadgeModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FormsModule,
    PresetCardComponent
  ],
  providers: [MenuItems]
})
export class SharedModule { }
