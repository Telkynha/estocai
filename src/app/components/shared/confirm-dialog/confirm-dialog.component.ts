import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warn' | 'error' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [class]="data.type">
        {{getIcon()}}
      </mat-icon>
      {{data.title}}
    </h2>
    <mat-dialog-content>{{data.message}}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{data.cancelText || 'Cancelar'}}
      </button>
      <button mat-raised-button [color]="getColor()" (click)="onConfirm()">
        {{data.confirmText || 'Confirmar'}}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      padding: 16px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 20px;
    }

    mat-icon {
      &.warn { color: var(--mat-sys-tertiary); }
      &.error { color: var(--mat-sys-error); }
      &.info { color: var(--mat-sys-primary); }
    }

    mat-dialog-content {
      margin: 16px 0;
      color: var(--mat-sys-on-surface-variant);
    }

    mat-dialog-actions {
      padding: 8px 0 0;
      margin-bottom: 0;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    private dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}

  getIcon(): string {
    switch (this.data.type) {
      case 'warn': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'help';
    }
  }

  getColor(): string {
    switch (this.data.type) {
      case 'warn': return 'warn';
      case 'error': return 'warn';
      default: return 'primary';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
