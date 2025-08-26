import { Component, Input, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { AIService, TrendData } from '../../../services/ai.service';

@Component({
  selector: 'app-product-trends',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <div class="chart-container">
      <div *ngIf="isLoading" class="loading">Carregando dados de tendências...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
      
      <canvas *ngIf="!isLoading && !error" baseChart
        [data]="lineChartData"
        [options]="lineChartOptions"
        [type]="lineChartType">
      </canvas>
      
      <div *ngIf="trendData && trendData.length > 0" class="events-list">
        <h3>Eventos próximos:</h3>
        <ul>
          <li *ngFor="let event of uniqueEvents">{{ event }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 400px;
      margin: 20px 0;
    }
    
    .loading, .error {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
      font-size: 16px;
      color: #666;
    }
    
    .error {
      color: #e53935;
    }
    
    .events-list {
      margin-top: 20px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
    
    .events-list h3 {
      margin-top: 0;
      font-size: 18px;
    }
    
    .events-list ul {
      padding-left: 20px;
      margin: 10px 0 0;
    }
  `]
})
export class ProductTrendsComponent implements OnChanges {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  @Input() productName: string = '';
  
  isLoading: boolean = false;
  error: string | null = null;
  trendData: TrendData[] = [];
  uniqueEvents: string[] = [];
  
  // Configuração do gráfico
  public lineChartData: ChartData<'line'> = {
    datasets: [],
    labels: []
  };
  
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 90,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  };
  
  public lineChartType: ChartType = 'line';
  
  // Use inject instead of constructor injection for standalone components
  private iaService = inject(AIService);
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productName'] && this.productName) {
      this.loadTrendsData();
    }
  }
  
  loadTrendsData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.iaService.analyzeProductTrends(this.productName).subscribe({
      next: (data: TrendData[]) => {
        this.trendData = data;
        this.updateChart();
        this.extractUniqueEvents();
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Erro ao carregar dados de tendências:', err);
        this.error = 'Não foi possível carregar os dados de tendências.';
        this.isLoading = false;
      }
    });
  }
  
  private updateChart(): void {
    if (!this.trendData || this.trendData.length === 0) return;
    
    // Preparar os labels (datas)
    const labels = this.trendData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    // Preparar os datasets
    const datasets = Object.keys(this.trendData[0])
      .filter(key => key !== 'date' && key !== 'evento') // Filtrar apenas as chaves de produtos
      .map((key, index) => {
        // Gerar cores diferentes para cada produto
        const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D00', '#46BDC6'];
        const color = colors[index % colors.length];
        
        return {
          data: this.trendData.map(item => item[key] as number),
          label: key,
          borderColor: color,
          backgroundColor: `${color}33`, // Adicionar transparência
          pointBackgroundColor: color,
          fill: true,
          tension: 0.3
        };
      });
    
    // Atualizar os dados do gráfico
    this.lineChartData = {
      labels,
      datasets
    };
    
    // Atualizar o gráfico
    if (this.chart) {
      this.chart.update();
    }
  }
  
  private extractUniqueEvents(): void {
    const events = this.trendData
      .filter(item => item.evento)
      .map(item => item.evento as string);
      
    // Filtrar eventos únicos
    this.uniqueEvents = [...new Set(events)];
  }
}
