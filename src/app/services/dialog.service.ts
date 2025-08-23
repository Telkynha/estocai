import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AcessoComponent } from '../components/forms/acesso/acesso.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/shared/confirm-dialog/confirm-dialog.component';

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
      data: data
    });

    return dialogRef.afterClosed().toPromise();
  }
}
