import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../models/usuario/usuario.component';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly _user = signal<Usuario | null>(null);
  private readonly _loading = signal<boolean>(true);

  readonly user = computed(() => this._user());
  readonly isAuthenticated = computed(() => !!this._user());
  readonly loading = computed(() => this._loading());

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Inicializa o estado de autenticação
    this.authService.user$.subscribe(user => {
      this._user.set(user);
      this._loading.set(false);
    });
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }
}
