import { Component, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatNavList } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthStateService } from '../../../services/auth-state.service';
import { Usuario } from '../../../models/usuario/usuario.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  currentUser: Usuario | null = null;
  activeSection: string = 'minha-conta';
  
  constructor(
    private authState: AuthStateService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ConfigComponent>,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.currentUser = this.authState.user();
  }
  
  changeSection(section: string): void {
    if (section !== 'minha-conta') {
      this.showInProgressMessage();
      return;
    }
    this.activeSection = section;
  }
  
  async logout(): Promise<void> {
    try {
      await this.authState.logout();
      this.dialogRef.close();
      this.router.navigate(['/']);
    } catch (error) {
      this.snackBar.open('Erro ao sair. Tente novamente.', 'Fechar', {
        duration: 3000
      });
    }
  }
  
  showInProgressMessage(): void {
    this.snackBar.open('Em desenvolvimento... Disponível em breve!', 'Fechar', {
      duration: 3000
    });
  }
}