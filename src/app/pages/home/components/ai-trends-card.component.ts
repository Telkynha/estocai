import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Produto } from '../../../models/produto/produto.component';
import { MarketAnalysisDialogComponent } from '../../../components/shared/market-analysis-dialog/market-analysis-dialog.component';

@Component({
  selector: 'app-ai-trends-card',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="ai-trends-card">
      <mat-card-content>
        <div class="ai-trends-content">
          <div class="ai-trends-description">
            <mat-icon>insights</mat-icon>
            <div class="ai-trends-text">
              <h3>Análise de Mercado com IA</h3>
              <p>Selecione um produto do seu estoque para descobrir produtos similares, comparar preços e analisar tendências de mercado usando inteligência artificial.</p>
            </div>
          </div>

          <div class="ai-trends-selection">
            <mat-form-field appearance="outline" class="product-select">
              <mat-label>Selecione um produto</mat-label>
              <mat-select [(ngModel)]="selectedProduct">
                <mat-option *ngFor="let produto of produtos" [value]="produto">
                  {{ produto.nome }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            
            <button mat-raised-button color="primary" 
                   [disabled]="!selectedProduct || isAnalyzing" 
                   (click)="analisarMercado()">
              <mat-icon>analytics</mat-icon>
              Analisar Mercado
              <mat-spinner *ngIf="isAnalyzing" diameter="20" class="button-spinner"></mat-spinner>
            </button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['./ai-trends.scss']
})
export class AiTrendsCardComponent implements OnInit {
  @Input() produtos: Produto[] = [];
  
  selectedProduct: Produto | null = null;
  isAnalyzing: boolean = false;

  private dialog = inject(MatDialog);

  ngOnInit(): void {
    // Componente pronto para uso
  }

  analisarMercado(): void {
    if (!this.selectedProduct) {
      return;
    }

    this.isAnalyzing = true;

    // Abrir dialog de análise de mercado
    const dialogRef = this.dialog.open(MarketAnalysisDialogComponent, {
      width: '90vw',
      maxWidth: '1000px',
      height: 'auto',
      maxHeight: '90vh',
      data: {
        produto: this.selectedProduct
      }
    });

    // Quando o dialog fechar, parar o loading
    dialogRef.afterClosed().subscribe(() => {
      this.isAnalyzing = false;
    });
  }
}
