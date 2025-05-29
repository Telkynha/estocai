import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';


@Component({
  selector: 'app-estatisticas',
  standalone: true,
  imports: [MatCardModule, NgChartsModule, CommonModule],
  templateUrl: './estatisticas.component.html',
  styleUrls: ['./estatisticas.component.scss']
})
export class EstatisticasComponent {
  isBrowser = false;
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Pizza Chart
  pieChartData = {
    labels: ['Eletrônicos', 'Vestuário', 'Alimentos'],
    datasets: [{
      data: [40, 30, 30],
      backgroundColor: ['var(--mat-sys-primary)', 'var(--mat-sys-secondary)', '#FFC107'],
    }]
  };

  // Bar Chart
  barChartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr'],
    datasets: [
      {
        label: 'Entradas',
        data: [120, 150, 180, 90],
        backgroundColor: 'var(--mat-sys-primary)'
      },
      {
        label: 'Saídas',
        data: [80, 100, 140, 70],
        backgroundColor: 'var(--mat-sys-secondary)'
      }
    ]
  };

  // Comparativo simples
  comparativo = {
    atual: 1200,
    anterior: 950
  };
}