import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogService } from '../../../services/dialog.service';
import { Produto } from '../../../models/produto/produto.component';
import { IaService } from '../../../services/ia.service';

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
              <p>Selecione um produto do seu estoque para descobrir produtos similares e comparar tendências de mercado.</p>
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
              <mat-icon>trending_up</mat-icon>
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
  private requestId: string | null = null;

  // Use inject instead of constructor for standalone components
  private iaService = inject(IaService);
  private dialogService = inject(DialogService);

  ngOnInit(): void {
    // Inscrever-se no observable de status da API para monitorar quando a análise termina
    this.iaService.apiStatus$.subscribe(status => {
      if (status.type === 'market' && 
         (status.status === 'success' || status.status === 'error')) {
        this.isAnalyzing = false;
      }
    });
  }

  analisarMercado(): void {
    if (!this.selectedProduct) return;
    
    this.isAnalyzing = true;
    
    // Gerar um ID único para esta requisição baseado no nome e preço do produto
    this.requestId = `market_${this.selectedProduct.id}_${Date.now()}`;
    
    // Abrir diálogo com análise de mercado
    this.dialogService.openMarketAnalysisDialog(this.selectedProduct)
      .catch(error => {
        console.error('Erro ao analisar mercado:', error);
      })
      .finally(() => {
        this.isAnalyzing = false;
      });
  }
}
