import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfigComponent } from './components/forms/config/config.component';
import { AcessoComponent } from './components/forms/acesso/acesso.component';
import { AuthStateService } from './services/auth-state.service';
import { DialogService } from './services/dialog.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgIf
]
})
export class AppComponent implements OnInit {
  isExpanded = true;
  isDarkTheme = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
    private router: Router,
    public authState: AuthStateService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      this.isDarkTheme = savedTheme === 'dark';
      this.applyTheme();
    }

    // Verificar autenticação ao iniciar
    if (!this.authState.isAuthenticated() && !this.router.url.includes('acesso')) {
      this.openAcesso();
    }
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
      this.applyTheme();
    }
  }

  private applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const body = document.querySelector('body');
      if (body) {
        body.classList.remove('light-theme', 'dark-theme');
        body.classList.add(this.isDarkTheme ? 'dark-theme' : 'light-theme');
      }
    }
  }

  openConfig() {
    if (this.authState.isAuthenticated()) {
      this.dialog.open(ConfigComponent, {
        width: '800px',
        maxWidth: '95vw',
        minHeight: '400px',
        maxHeight: '80vh',
        panelClass: 'config-dialog-container'
      });
    } else {
      this.openAcesso();
    }
  }

  openAcesso() {
    this.dialogService.openLoginDialog().afterClosed().subscribe(result => {
      if (result) {
        // Usuário fez login com sucesso
        this.router.navigate(['/']);
      }
    });
  }

  async logout() {
    try {
      await this.authState.logout();
      this.openAcesso();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}