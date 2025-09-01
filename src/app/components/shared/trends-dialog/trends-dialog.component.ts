import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProductTrendsComponent } from '../product-trends/product-trends.component';

export interface TrendsDialogData {
  productName: string;
}

@Component({
  selector: 'app-trends-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, ProductTrendsComponent],
  template: `
    <h2 mat-dialog-title>Análise de Tendências</h2>
    <mat-dialog-content>
      <h3>Produto: {{ data.productName }}</h3>
      <app-product-trends [productName]="data.productName"></app-product-trends>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
      max-width: 800px;
    }
    
    h3 {
      margin-top: 0;
      color: #3f51b5;
    }
  `]
})
export class TrendsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TrendsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TrendsDialogData
  ) {}
}
