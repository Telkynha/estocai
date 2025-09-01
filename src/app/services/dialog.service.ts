import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AcessoComponent } from '../components/forms/acesso/acesso.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/shared/confirm-dialog/confirm-dialog.component';
import { MovimentacaoDialogComponent, MovimentacaoDialogData } from '../components/forms/movimentacao-dialog/movimentacao-dialog.component';
import { TrendsDialogComponent, TrendsDialogData } from '../components/shared/trends-dialog/trends-dialog.component';
import { Venda } from '../models/venda/venda.component';
import { Compra } from '../models/compra/compra.component';
import { Produto } from '../models/produto/produto.component';
import { MarketAnalysisDialogComponent, MarketAnalysisDialogData } from '../components/shared/market-analysis-dialog/market-analysis-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openLoginDialog() {
    return this.dialog.open(AcessoComponent, {
      width: '400px',
      disableClose: true,
      panelClass: 'login-dialog'
    });
  }

  async openConfirmDialog(data: ConfirmDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: data,
      disableClose: data.type === 'info' ? false : true
    });

    const result = await dialogRef.afterClosed().toPromise();
    return result === true;
  }
  
  async openMovimentacaoDialog(
    tipo: 'venda' | 'compra', 
    produtos: Produto[], 
    movimentacao?: Venda | Compra
  ): Promise<Venda | Compra | undefined> {
    const dialogRef = this.dialog.open(MovimentacaoDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: {
        tipo,
        produtos,
        movimentacao
      } as MovimentacaoDialogData,
      disableClose: true
    });

    return dialogRef.afterClosed().toPromise();
  }

  /**
   * Abre um diálogo mostrando a análise de tendências para um produto
   * @param productName Nome do produto para analisar
   * @returns Promise que resolve quando o diálogo é fechado
   */
  openTrendsDialog(productName: string): Promise<void> {
    const dialogRef = this.dialog.open(TrendsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { productName } as TrendsDialogData,
    });

    return dialogRef.afterClosed().toPromise();
  }

  /**
   * Abre um diálogo mostrando a análise de mercado comparativa para um produto
   * @param produto O produto para analisar no mercado
   * @returns Promise que resolve quando o diálogo é fechado
   */
  openMarketAnalysisDialog(produto: Produto): Promise<void> {
    const dialogRef = this.dialog.open(MarketAnalysisDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { 
        produto: produto
      } as MarketAnalysisDialogData,
    });

    return dialogRef.afterClosed().toPromise();
  }
}
