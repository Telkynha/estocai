import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AcessoComponent } from '../components/forms/acesso/acesso.component';

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
}
