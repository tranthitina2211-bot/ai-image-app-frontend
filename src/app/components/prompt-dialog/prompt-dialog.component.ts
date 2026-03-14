import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface PromptDialogData {
  title: string;
  placeholder?: string;
  value?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-prompt-dialog',
  templateUrl: './prompt-dialog.component.html',
  styleUrls: ['./prompt-dialog.component.scss']
})
export class PromptDialogComponent {
  control = new FormControl(this.data.value ?? '', [Validators.required]);

  constructor(
    private dialogRef: MatDialogRef<PromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromptDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    const value = (this.control.value ?? '').trim();
    if (!value) {
      this.control.markAsTouched();
      return;
    }
    this.dialogRef.close(value);
  }
}
