import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgChartsModule } from 'ng2-charts';

import { IaService, MarketProduct, MarketAnalysisData } from '../../../services/ia.service';
import { Produto } from '../../../models/produto/produto.component';

export interface MarketAnalysisDialogData {
  produto: Produto;
}

interface MarketData {
  similarProducts: MarketProduct[];
  priceComparison: any;
  salesComparison: any;
  eventos: string[];
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
            <div *ngFor="let product of marketData?.similarProducts" class="similar-product-card">
              <div class="product-name">{{ product.nome }}</div>
              <div class="product-price">R$ {{ product.preco.toFixed(2) }}</div>
              <div class="product-trend" [ngClass]="{'positive': product.tendencia > 0, 'negative': product.tendencia < 0}">
                <mat-icon>{{ product.tendencia > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                {{ product.tendencia.toFixed(1) }}%
              </div>
              <div class="product-search-volume" *ngIf="product.volumeBusca !== undefined">
                <mat-icon>search</mat-icon>
                <span>{{ getSearchVolumeText(product.volumeBusca) }}</span>
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
          
          <mat-tab label="Comparação de Vendas">
            <div class="chart-container">
              <canvas baseChart
                [data]="salesChartData"
                [options]="salesChartOptions"
                [type]="'line'">
              </canvas>
            </div>
          </mat-tab>
        </mat-tab-group>

        <div *ngIf="marketData && marketData.eventos && marketData.eventos.length > 0" class="events-section">
          <h3>Eventos Relevantes para o Mercado</h3>
          <ul class="events-list">
            <li *ngFor="let evento of marketData.eventos">{{ evento }}</li>
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
  `]
})
export class MarketAnalysisDialogComponent implements OnInit {
  isLoading: boolean = true;
  error: string | null = null;
  marketData: MarketData | null = null;
  
  // Dados para os gráficos
  priceChartData: any;
  priceChartOptions: any;
  salesChartData: any;
  salesChartOptions: any;

  // Use inject for services
  private iaService = inject(IaService);
  
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
    this.iaService.analyzeMarketData(produto.nome, preco).subscribe({
      next: (data: MarketAnalysisData) => {
        // Converter os dados do serviço para o formato usado pelo componente
        this.marketData = this.processMarketData(data);
        this.setupCharts();
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Erro ao carregar dados de mercado:', err);
        this.error = 'Não foi possível analisar o mercado. Tente novamente mais tarde.';
        this.isLoading = false;
      }
    });
  }

  processMarketData(apiData: any): MarketData {
    const produto = this.data.produto;
    const similarProducts = apiData.similarProducts;
    
    // Ordenar produtos por preço para melhor visualização
    similarProducts.sort((a: MarketProduct, b: MarketProduct) => a.preco - b.preco);
    
    // Dados para gráfico de preços
    const priceComparison = {
      labels: similarProducts.map((p: any) => p.nome),
      datasets: [
        {
          data: similarProducts.map((p: any) => p.preco),
          backgroundColor: similarProducts.map((p: any) => 
            p.nome === produto.nome ? '#4285F4' : '#9E9E9E'
          )
        }
      ]
    };
    
    // Dados para gráfico de vendas (últimos 6 meses)
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const salesDatasets = similarProducts.map((p: any) => {
      // Usar os dados de vendas da API ou gerar se não existirem
      const vendas = p.vendas || [0, 0, 0, 0, 0, 0];
      
      return {
        label: p.nome,
        data: vendas,
        borderColor: p.nome === produto.nome ? '#4285F4' : this.getRandomColor(),
        backgroundColor: 'transparent',
        tension: 0.3
      };
    });
    
    const salesComparison = {
      labels: months,
      datasets: salesDatasets
    };
    
    return {
      similarProducts: similarProducts,
      priceComparison,
      salesComparison,
      eventos: apiData.events
    };
  }
  
  setupCharts(): void {
    if (!this.marketData) return;
    
    // Configurar gráfico de preços
    this.priceChartData = {
      labels: this.marketData.priceComparison.labels,
      datasets: this.marketData.priceComparison.datasets
    };
    
    this.priceChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context: any) => `R$ ${context.raw.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Preço (R$)'
          }
        }
      }
    };
    
    // Configurar gráfico de vendas
    this.salesChartData = {
      labels: this.marketData.salesComparison.labels,
      datasets: this.marketData.salesComparison.datasets
    };
    
    this.salesChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => `${context.dataset.label}: ${context.raw} unidades`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Unidades Vendidas'
          }
        }
      }
    };
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
    if (!this.marketData) return '';
    
    const produto = this.data.produto;
    const produtoPreco = produto.precoVenda || 0;
    
    // Calcular preço médio dos produtos similares, excluindo o produto atual
    const similarProducts = this.marketData.similarProducts.filter(p => p.nome !== produto.nome);
    const precoMedio = similarProducts.reduce((acc, p) => acc + p.preco, 0) / similarProducts.length;
    
    const precoMaisBaixo = Math.min(...similarProducts.map(p => p.preco));
    const precoMaisAlto = Math.max(...similarProducts.map(p => p.preco));
    
    if (produtoPreco < precoMedio) {
      const percentualMenor = Math.round(((precoMedio - produtoPreco) / precoMedio) * 100);
      return `Seu produto está ${percentualMenor}% mais barato que a média do mercado. Considere aumentar o preço mantendo a competitividade, ou destaque o valor atrativo nas suas comunicações.`;
    } else if (produtoPreco > precoMedio) {
      const percentualMaior = Math.round(((produtoPreco - precoMedio) / precoMedio) * 100);
      return `Seu produto está ${percentualMaior}% mais caro que a média do mercado. Certifique-se de destacar os diferenciais que justificam este valor ou considere ajustar para aumentar a competitividade.`;
    } else {
      return `Seu produto está com preço alinhado à média do mercado. Bom posicionamento, mas considere destacar diferenciais para justificar a preferência dos clientes.`;
    }
  }
  
  getSalesInsight(): string {
    if (!this.marketData) return '';
    
    const produto = this.data.produto;
    const produtoAtual = this.marketData.similarProducts.find(p => p.nome === produto.nome);
    
    if (!produtoAtual) return '';
    
    const tendenciaAtual = produtoAtual.tendencia;
    
    // Calcular tendência média do mercado
    const tendenciaMedia = this.marketData.similarProducts.reduce((acc, p) => acc + p.tendencia, 0) / this.marketData.similarProducts.length;
    
    if (tendenciaAtual > 0) {
      if (tendenciaAtual > tendenciaMedia) {
        return `Seu produto está em alta, com tendência de crescimento de ${tendenciaAtual.toFixed(1)}%, superior à média do mercado de ${tendenciaMedia.toFixed(1)}%. Considere aumentar seu estoque para atender à demanda crescente.`;
      } else {
        return `Seu produto tem tendência de crescimento de ${tendenciaAtual.toFixed(1)}%, mas está abaixo da média do mercado de ${tendenciaMedia.toFixed(1)}%. Analise estratégias de marketing e diferenciação para acelerar as vendas.`;
      }
    } else if (tendenciaAtual < 0) {
      return `Atenção: seu produto apresenta tendência de queda de ${Math.abs(tendenciaAtual).toFixed(1)}%. Considere promoções, renovação visual ou bundle com outros produtos para reverter esta tendência.`;
    } else {
      return `Seu produto está com vendas estáveis. Para aumentar o desempenho, considere estratégias de marketing digital ou promoções sazonais.`;
    }
  }
  
  /**
   * Verifica se existem dados de volume de buscas disponíveis
   */
  hasSearchVolumeData(): boolean {
    if (!this.marketData || !this.marketData.similarProducts) return false;
    
    const produto = this.data.produto;
    const produtoAtual = this.marketData.similarProducts.find(p => p.nome === produto.nome);
    
    return !!produtoAtual && produtoAtual.volumeBusca !== undefined;
  }
  
  /**
   * Gera insights baseados no volume de buscas do produto
   */
  getSearchVolumeInsight(): string {
    if (!this.marketData) return '';
    
    const produto = this.data.produto;
    const produtoAtual = this.marketData.similarProducts.find(p => p.nome === produto.nome);
    
    if (!produtoAtual || produtoAtual.volumeBusca === undefined) return '';
    
    const volumeAtual = produtoAtual.volumeBusca;
    
    // Calcular volume médio de buscas do mercado
    const volumesValidos = this.marketData.similarProducts
      .filter(p => p.volumeBusca !== undefined)
      .map(p => p.volumeBusca as number);
      
    if (volumesValidos.length === 0) return '';
    
    const volumeMedio = volumesValidos.reduce((acc, v) => acc + v, 0) / volumesValidos.length;
    
    if (volumeAtual > 80) {
      return `Seu produto tem um volume de buscas muito alto (${volumeAtual}/100), indicando grande interesse do mercado. Aproveite esse momento para destacar seu produto e considerar aumento de preço ou lançar versões premium.`;
    } else if (volumeAtual > 60) {
      return `Seu produto tem um volume de buscas alto (${volumeAtual}/100). Isso indica um bom interesse do mercado. Considere investir em anúncios para capturar essas buscas e aumentar conversões.`;
    } else if (volumeAtual > volumeMedio) {
      return `Seu produto tem um volume de buscas (${volumeAtual}/100) acima da média do mercado (${volumeMedio.toFixed(0)}/100). Isso é um bom sinal de interesse, aproveite para melhorar sua presença digital.`;
    } else if (volumeAtual > 30) {
      return `O volume de buscas pelo seu produto (${volumeAtual}/100) está na média do mercado. Para aumentar o interesse, considere criar conteúdo educativo ou reviews do produto.`;
    } else {
      return `O volume de buscas pelo seu produto é baixo (${volumeAtual}/100). Para aumentar a visibilidade, considere estratégias de marketing de conteúdo e SEO para torná-lo mais descobrível.`;
    }
  }
}
