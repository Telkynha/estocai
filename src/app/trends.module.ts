import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ProductTrendsComponent } from './components/shared/product-trends/product-trends.component';
import { TrendsDialogComponent } from './components/shared/trends-dialog/trends-dialog.component';
import { IaService } from './services/ia.service';
import { NgChartsModule } from 'ng2-charts';

/**
 * Módulo para funcionalidades de análise de tendências e IA
 * Esse módulo encapsula todos os componentes e serviços relacionados
 * às funcionalidades de análise de dados e tendências
 */
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    NgChartsModule,
    // Since these are standalone components, we need to import them
    ProductTrendsComponent,
    TrendsDialogComponent
  ],
  exports: [
    ProductTrendsComponent,
    TrendsDialogComponent
  ],
  providers: [
    IaService
  ]
})
export class TrendsModule { }
