import { Component, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatNavList } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthStateService } from '../../../services/auth-state.service';
import { Usuario } from '../../../models/usuario/usuario.component';
import { Router } from '@angular/router';
import { DialogService } from '../../../services/dialog.service';
import { AuthService } from '../../../services/auth.service';
import { Firestore, collection, query, where, getDocs, doc, deleteDoc } from '@angular/fire/firestore';

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
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ConfigComponent>,
    private router: Router,
    private dialogService: DialogService,
    private firestore: Firestore
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
  
  async confirmarExclusaoConta(): Promise<void> {
    const confirmado = await this.dialogService.openConfirmDialog({
      title: 'Excluir Conta',
      message: 'Esta ação excluirá permanentemente sua conta e todos os dados associados (produtos, vendas, compras, etc). Esta ação não pode ser desfeita. Deseja continuar?',
      confirmText: 'Excluir Conta',
      cancelText: 'Cancelar',
      type: 'error'
    });
    
    if (confirmado) {
      try {
        this.snackBar.open('Excluindo conta e dados associados...', '', {
          duration: undefined
        });
        
        await this.excluirDadosUsuario();
        
        this.snackBar.dismiss();
        this.snackBar.open('Conta excluída com sucesso!', 'Fechar', {
          duration: 3000
        });
        
        this.dialogRef.close();
        this.router.navigate(['/']);
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
        this.snackBar.dismiss();
        this.snackBar.open('Erro ao excluir conta. Tente novamente.', 'Fechar', {
          duration: 5000
        });
      }
    }
  }
  
  private async excluirDadosUsuario(): Promise<void> {
    if (!this.currentUser?.id) return;
    
    const userId = this.currentUser.id;
    
    try {
      // Excluir produtos do usuário
      await this.excluirColecao('produtos', userId);
      
      // Excluir vendas do usuário
      await this.excluirColecao('vendas', userId);
      
      // Excluir compras do usuário
      await this.excluirColecao('compras', userId);
      
      // Excluir o usuário do Firestore
      await deleteDoc(doc(this.firestore, `usuarios/${userId}`));
      
      // Excluir a conta de autenticação
      await this.authService.deleteAccount();
    } catch (error: any) {
      if (error.message?.includes('faça login novamente')) {
        // Caso precise de reautenticação, logamos o usuário novamente e tentamos de novo
        this.snackBar.open('Por segurança, faça login novamente antes de excluir sua conta', 'OK', {
          duration: 5000
        });
        
        // Fazemos logout e redirecionamos para a tela de login
        await this.authState.logout();
        this.dialogRef.close();
        this.router.navigate(['/']);
        
        throw new Error('Reautenticação necessária');
      }
      throw error;
    }
  }
  
  private async excluirColecao(colecao: string, userId: string): Promise<void> {
    // Buscar documentos da coleção que pertencem ao usuário
    const colecaoRef = collection(this.firestore, colecao);
    const q = query(colecaoRef, where('usuarioId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    // Excluir cada documento encontrado
    const batch = Promise.all(
      querySnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(this.firestore, `${colecao}/${docSnapshot.id}`))
      )
    );
    
    await batch;
  }
}