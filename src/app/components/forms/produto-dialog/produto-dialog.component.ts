import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Produto } from '../../../models/produto/produto.component';
import { Categoria } from '../../../models/categoria/categoria.component';

@Component({
  selector: 'app-produto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Novo' }} Produto</h2>
    <mat-dialog-content>
      <form [formGroup]="produtoForm" class="produto-form">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput formControlName="codigo" placeholder="Ex: PROD001">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="nome" placeholder="Nome do produto">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <textarea matInput formControlName="descricao" placeholder="Descrição do produto"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Categoria</mat-label>
          <mat-select formControlName="categoria" multiple>
            <mat-option *ngFor="let cat of categorias" [value]="cat">
              {{Categoria[cat]}}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Preço de Venda</mat-label>
          <input matInput type="number" formControlName="precoVenda">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Preço de Custo</mat-label>
          <input matInput type="number" formControlName="precoCusto">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estoque Atual</mat-label>
          <input matInput type="number" formControlName="estoqueAtual">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estoque Mínimo</mat-label>
          <input matInput type="number" formControlName="estoqueMinimo">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fornecedor</mat-label>
          <input matInput formControlName="fornecedor">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observações</mat-label>
          <textarea matInput formControlName="observacoes"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="produtoForm.invalid">
        {{ data ? 'Atualizar' : 'Criar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .produto-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
      max-height: 60vh;
      overflow-y: auto;
    }
  `]
})
export class ProdutoDialogComponent {
  produtoForm: FormGroup;
  categorias = Object.values(Categoria).filter(value => typeof value === 'number');
  Categoria = Categoria; // Para usar no template

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProdutoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: Produto
  ) {
    this.produtoForm = this.fb.group({
      codigo: ['', Validators.required],
      nome: ['', Validators.required],
      descricao: [''],
      categoria: [[], Validators.required],
      precoVenda: [0, [Validators.required, Validators.min(0)]],
      precoCusto: [0, [Validators.required, Validators.min(0)]],
      estoqueAtual: [0, [Validators.required, Validators.min(0)]],
      estoqueMinimo: [0, [Validators.required, Validators.min(0)]],
      fornecedor: [''],
      observacoes: [''],
      ativo: [true]
    });

    if (data) {
      this.produtoForm.patchValue(data);
    }
  }

  onSubmit() {
    if (this.produtoForm.valid) {
      const produto = this.produtoForm.value;
      this.dialogRef.close(produto);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
