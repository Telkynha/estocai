import { Component, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDivider } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-acesso',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatDivider
  ],
  templateUrl: './acesso.component.html',
  styleUrl: './acesso.component.scss'
})
export class AcessoComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  hidePassword = true;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    @Optional() private dialogRef: MatDialogRef<AcessoComponent>
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onLogin() {
    if (this.loginForm.valid) {
      this.loading = true;
      try {
        const { email, password } = this.loginForm.value;
        const credential = await this.authService.login(email, password);
        if (credential.user) {
          if (this.dialogRef) {
            this.dialogRef.close(true);
          }
          this.router.navigate(['/']);
          this.showMessage('Login realizado com sucesso!');
        }
      } catch (error: any) {
        this.showMessage(error.message);
      } finally {
        this.loading = false;
      }
    }
  }

  async onRegister() {
    if (this.registerForm.valid) {
      this.loading = true;
      try {
        const { name, email, password } = this.registerForm.value;
        const credential = await this.authService.register({
          nome: name,
          email: email,
          senha: password
        });
        if (credential.user) {
          if (this.dialogRef) {
            this.dialogRef.close(true);
          }
          this.router.navigate(['/']);
          this.showMessage('Cadastro realizado com sucesso!');
        }
      } catch (error: any) {
        this.showMessage(error.message);
      } finally {
        this.loading = false;
      }
    }
  }

  async loginWithGoogle() {
    try {
      this.loading = true;
      const credential = await this.authService.loginWithGoogle();
      if (credential.user) {
        this.showMessage('Login realizado com sucesso!');
        this.dialogRef?.close(true);
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      this.showMessage(error.message);
    } finally {
      this.loading = false;
    }
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}