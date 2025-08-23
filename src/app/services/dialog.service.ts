import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AcessoComponent } from '../components/forms/acesso/acesso.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/shared/confirm-dialog/confirm-dialog.component';
import { MovimentacaoDialogComponent, MovimentacaoDialogData } from '../components/forms/movimentacao-dialog/movimentacao-dialog.component';
import { Venda } from '../models/venda/venda.component';
import { Compra } from '../models/compra/compra.component';
import { Produto } from '../models/produto/produto.component';

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
}
