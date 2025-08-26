import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { NgChartsModule } from 'ng2-charts';

// Substitui dependência anterior de backend por serviço front-end
import { MarketIntelService, FrontMarketAnalysisResult } from '../../../services/market-intel.service';
import { Produto } from '../../../models/produto/produto.component';

export interface MarketAnalysisDialogData {
  produto: Produto;
}

// Interface simplificada baseada no novo serviço front-end
interface MarketDataFront {
  competitors: FrontMarketAnalysisResult['competitors'];
  priceComparison: FrontMarketAnalysisResult['priceComparison'];
  popularity: FrontMarketAnalysisResult['popularity'];
  events: FrontMarketAnalysisResult['events'];
  insights: FrontMarketAnalysisResult['insights'];
  search: FrontMarketAnalysisResult['search'];
  original: FrontMarketAnalysisResult['original'];
}

@Component({
  selector: 'app-market-analysis-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    NgChartsModule
  ],
  template: `
    <h2 mat-dialog-title>Análise de Mercado</h2>
    <div class="dialog-subtitle">
      <mat-icon>analytics</mat-icon>
      <span>{{ data.produto.nome }}</span>
    </div>
    
    <mat-dialog-content>
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Analisando mercado e buscando produtos similares...</p>
      </div>

      <div *ngIf="!isLoading && error" class="error-container">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="loadMarketData()">Tentar Novamente</button>
      </div>

      <div *ngIf="!isLoading && !error" class="analysis-content">
        <div class="similar-products-section">
          <h3>Produtos Similares Encontrados</h3>
          <div class="similar-products-grid">
            <div *ngFor="let product of marketData?.competitors" class="similar-product-card">
              <div class="product-name">{{ product.title }}</div>
              <div class="product-price">R$ {{ product.price.toFixed(2) }}</div>
              <div class="product-trend" *ngIf="product.monthlySalesEstimate">
                <mat-icon>show_chart</mat-icon>
                {{ product.monthlySalesEstimate }} vendas/mês (estim.)
              </div>
              <div class="product-search-volume" *ngIf="marketData?.search">
                <mat-icon>search</mat-icon>
                <span>Interesse: {{ marketData?.search?.currentScore }} / 100</span>
              </div>
            </div>
          </div>
        </div>

        <mat-tab-group>
          <mat-tab label="Comparação de Preços">
            <div class="chart-container">
              <canvas baseChart
                [data]="priceChartData"
                [options]="priceChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
          </mat-tab>
          
          <mat-tab label="Análise de Vendas">
            <div class="chart-container">
              <canvas baseChart
                [data]="salesChartData"
                [options]="salesChartOptions"
                [type]="'line'">
              </canvas>
            </div>
          </mat-tab>

          <mat-tab label="Tendências de Busca" *ngIf="marketData?.search?.trend?.length">
            <div class="chart-container">
              <canvas baseChart
                [data]="searchTrendData"
                [options]="searchTrendOptions"
                [type]="'line'">
              </canvas>
            </div>
            <div class="trend-info">
              <div class="trend-stat">
                <span class="label">Sazonalidade:</span>
                <span class="value">{{ marketData?.search?.seasonality | titlecase }}</span>
              </div>
              <div class="related-queries" *ngIf="marketData?.search?.relatedQueries?.length">
                <h4>Consultas Relacionadas:</h4>
                <div class="queries-chips">
                  <mat-chip *ngFor="let query of marketData?.search?.relatedQueries">
                    {{ query }}
                  </mat-chip>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>

    <div *ngIf="marketData && marketData.events && marketData.events.length > 0" class="events-section">
          <h3>Eventos Relevantes para o Mercado</h3>
          <ul class="events-list">
      <li *ngFor="let ev of marketData.events">{{ ev.name }} - {{ ev.date | date:'dd/MM' }}</li>
          </ul>
        </div>

        <div class="market-insights">
          <h3>Insights de Mercado</h3>
          <div class="insight-card">
            <mat-icon>lightbulb</mat-icon>
            <div class="insight-content">
              <div class="insight-title">Posicionamento de Preço</div>
              <p>
                {{ getPriceInsight() }}
              </p>
            </div>
          </div>
          <div class="insight-card">
            <mat-icon>show_chart</mat-icon>
            <div class="insight-content">
              <div class="insight-title">Tendência de Vendas</div>
              <p>
                {{ getSalesInsight() }}
              </p>
            </div>
          </div>
          <div class="insight-card" *ngIf="hasSearchVolumeData()">
            <mat-icon>search</mat-icon>
            <div class="insight-content">
              <div class="insight-title">Volume de Buscas</div>
              <p>
                {{ getSearchVolumeInsight() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-subtitle {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      color: var(--mat-sys-primary);
      gap: 8px;
      
      span {
        font-size: 16px;
      }
    }
    
    mat-dialog-content {
      min-width: 500px;
      max-height: 80vh;
    }
    
    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 0;
      text-align: center;
      
      p {
        margin: 16px 0;
        color: var(--mat-sys-on-surface-variant);
      }
    }
    
    .error-container {
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }
    }
    
    .analysis-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .similar-products-section {
      h3 {
        margin-top: 0;
        margin-bottom: 16px;
      }
    }
    
    .similar-products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .similar-product-card {
      background-color: var(--mat-sys-surface-container);
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      .product-name {
        font-weight: 500;
        margin-bottom: 8px;
      }
      
      .product-price {
        font-size: 18px;
        margin-bottom: 8px;
      }
      
      .product-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        
        &.positive {
          color: #4CAF50;
        }
        
        &.negative {
          color: #F44336;
        }
      }
      
      .product-search-volume {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        margin-top: 8px;
        color: var(--mat-sys-on-surface-variant);
        
        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
    }
    
    .chart-container {
      height: 300px;
      margin: 16px 0;
    }
    
    .events-section {
      background-color: var(--mat-sys-surface-container-low);
      padding: 16px;
      border-radius: 8px;
      
      h3 {
        margin-top: 0;
        margin-bottom: 12px;
      }
      
      .events-list {
        list-style-type: none;
        padding-left: 0;
        margin: 0;
        
        li {
          padding: 8px 0;
          border-bottom: 1px solid var(--mat-sys-surface-container-highest);
          
          &:last-child {
            border-bottom: none;
          }
        }
      }
    }
    
    .market-insights {
      h3 {
        margin-top: 0;
        margin-bottom: 16px;
      }
      
      .insight-card {
        display: flex;
        gap: 16px;
        padding: 16px;
        background-color: var(--mat-sys-surface-container-low);
        border-radius: 8px;
        margin-bottom: 16px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        mat-icon {
          color: var(--mat-sys-secondary);
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
        
        .insight-content {
          flex: 1;
          
          .insight-title {
            font-weight: 500;
            margin-bottom: 8px;
          }
          
          p {
            margin: 0;
            color: var(--mat-sys-on-surface-variant);
          }
        }
      }
    }

    .trend-info {
      margin-top: 16px;
      padding: 16px;
      background-color: var(--mat-sys-surface-container-low);
      border-radius: 8px;

      .trend-stat {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16px;
        
        .label {
          font-weight: 500;
          color: var(--mat-sys-on-surface-variant);
        }
        
        .value {
          font-weight: 600;
          color: var(--mat-sys-primary);
        }
      }

      .related-queries {
        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--mat-sys-on-surface-variant);
        }

        .queries-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          mat-chip {
            font-size: 12px;
            background-color: var(--mat-sys-secondary-container);
            color: var(--mat-sys-on-secondary-container);
          }
        }
      }
    }
  `]
})
export class MarketAnalysisDialogComponent implements OnInit {
  isLoading: boolean = true;
  error: string | null = null;
  marketData: MarketDataFront | null = null;
  
  // Dados para os gráficos
  priceChartData: any;
  priceChartOptions: any;
  salesChartData: any;
  salesChartOptions: any;
  searchTrendData: any;
  searchTrendOptions: any;

  // Use inject for services
  private marketIntel = inject(MarketIntelService);
  
  constructor(
    public dialogRef: MatDialogRef<MarketAnalysisDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MarketAnalysisDialogData
  ) {}

  ngOnInit(): void {
    this.loadMarketData();
  }

  loadMarketData(): void {
    this.isLoading = true;
    this.error = null;
    
    const produto = this.data.produto;
    const preco = produto.precoVenda || 0;
    
    // Usar o serviço de IA para obter dados reais de mercado
    this.marketIntel.analyzeProduct(produto.nome, preco).subscribe({
      next: (res) => {
        this.marketData = {
          competitors: res.competitors,
          priceComparison: res.priceComparison,
          popularity: res.popularity,
          events: res.events,
          insights: res.insights,
          search: res.search,
          original: res.original
        };
        this.setupCharts();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro na análise de mercado:', err);
        this.error = 'Não foi possível realizar a análise de mercado no momento. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  // processMarketData não é mais necessário (dados já vêm prontos)
  
  setupCharts(): void {
    if (!this.marketData) return;
    
    // Gráfico de Preços (bar horizontal)
    this.priceChartData = {
      labels: this.marketData.priceComparison.labels,
      datasets: [{
        data: this.marketData.priceComparison.prices,
        backgroundColor: this.marketData.priceComparison.labels.map(l => 
          l === 'Seu Produto' ? '#4285F4' : '#9E9E9E'
        )
      }]
    };
    this.priceChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { 
        legend: { display: false },
        title: { display: true, text: 'Comparação de Preços (R$)' }
      },
      scales: { 
        x: { title: { display: true, text: 'Preço (R$)' } } 
      }
    };
    
    // Gráfico de Popularidade (vendas)
    this.salesChartData = {
      labels: this.marketData.popularity.labels,
      datasets: [{
        label: 'Vendas Totais',
        data: this.marketData.popularity.values,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76,175,80,0.15)',
        tension: 0.3,
        fill: true
      }]
    };
    this.salesChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: true },
        title: { display: true, text: 'Vendas dos Concorrentes' }
      },
      scales: { 
        y: { beginAtZero: true } 
      }
    };

    // Gráfico de Tendências de Busca
    if (this.marketData.search?.trend?.length) {
      this.searchTrendData = {
        labels: this.marketData.search.trend.map(t => {
          const date = new Date(t.date);
          return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        }),
        datasets: [{
          label: 'Interesse de Busca',
          data: this.marketData.search.trend.map(t => t.value),
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255,99,132,0.1)',
          tension: 0.4,
          fill: true
        }]
      };
      this.searchTrendOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: true },
          title: { display: true, text: 'Tendência de Busca (últimos 12 meses)' }
        },
        scales: { 
          y: { 
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Score (0-100)' }
          } 
        }
      };
    }
  }
  
  getAlternativeName(name: string): string {
    // Lista de prefixos/sufixos para gerar nomes alternativos
    const prefixos = ['Super', 'Ultra', 'Mega', 'Pro', 'Max', 'Premium', 'Plus'];
    const sufixos = ['Basic', 'Advanced', 'Master', 'Elite', 'Light', 'Smart'];
    
    if (Math.random() > 0.5) {
      // Adicionar prefixo
      return prefixos[Math.floor(Math.random() * prefixos.length)] + ' ' + name;
    } else {
      // Adicionar sufixo
      return name + ' ' + sufixos[Math.floor(Math.random() * sufixos.length)];
    }
  }
  
  getRandomColor(): string {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Converte o volume de buscas numérico (0-100) para uma descrição textual
   * @param volume Volume de buscas de 0 a 100
   * @returns Texto descritivo do volume de buscas
   */
  getSearchVolumeText(volume: number): string {
    if (volume === undefined || volume === null) return 'N/A';
    
    if (volume >= 80) return 'Volume de buscas muito alto';
    if (volume >= 60) return 'Volume de buscas alto';
    if (volume >= 40) return 'Volume de buscas médio';
    if (volume >= 20) return 'Volume de buscas baixo';
    return 'Volume de buscas muito baixo';
  }
  
  // Função getRelevantEvents foi removida pois agora usamos os eventos da API
  
  getPriceInsight(): string {
  return this.marketData?.insights.price || '';
  }
  
  getSalesInsight(): string {
  return this.marketData?.insights.popularity || '';
  }
  
  /**
   * Verifica se existem dados de volume de buscas disponíveis
   */
  hasSearchVolumeData(): boolean {
    return !!this.marketData?.search && this.marketData.search.currentScore > 0;
  }
  
  /**
   * Gera insights baseados no volume de buscas do produto
   */
  getSearchVolumeInsight(): string {
    return this.marketData?.insights.search || 'Dados de busca não disponíveis.';
  }
}
