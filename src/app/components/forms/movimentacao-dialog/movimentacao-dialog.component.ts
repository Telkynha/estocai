import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';

import { Venda, plataforma, formaPagamento } from '../../../models/venda/venda.component';
import { Compra } from '../../../models/compra/compra.component';
import { Produto, Item, status } from '../../../models/produto/produto.component';

export interface MovimentacaoDialogData {
  tipo: 'venda' | 'compra';
  movimentacao?: Venda | Compra;
  produtos: Produto[];
}

@Component({
  selector: 'app-movimentacao-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatChipsModule
  ],
  templateUrl: './movimentacao-dialog.component.html',
  styleUrls: ['./movimentacao-dialog.component.scss']
})
export class MovimentacaoDialogComponent implements OnInit {
  form: FormGroup;
  tipoMovimentacao: 'venda' | 'compra';
  isEdicao: boolean;
  
  // Opções para os selects
  plataformaOptions = Object.entries(plataforma)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({ valor: value, label: key.replace(/_/g, ' ') }));
  
  formaPagamentoOptions = Object.entries(formaPagamento)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({ valor: value, label: key.replace(/_/g, ' ') }));
  
  statusOptions = [
    { valor: status.PENDENTE, label: 'Pendente' },
    { valor: status.CONCLUIDA, label: 'Concluída' },
    { valor: status.CANCELADA, label: 'Cancelada' }
  ];
  
  produtos: Produto[] = [];
  filteredProdutos: Produto[] = [];
  produtoSelecionado: Produto | null = null;
  quantidadeTemp = 1;
  
  get valorTotal(): number {
    return this.itensArray.controls.reduce((total, item) => {
      return total + item.get('subtotal')?.value || 0;
    }, 0);
  }
  
  get itensArray(): FormArray {
    return this.form.get('itens') as FormArray;
  }
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MovimentacaoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovimentacaoDialogData
  ) {
    this.tipoMovimentacao = data.tipo;
    this.isEdicao = !!data.movimentacao;
    this.produtos = data.produtos;
    this.filteredProdutos = [...this.produtos];
    
    this.form = this.criarFormulario();
  }
  
  ngOnInit(): void {
    if (this.isEdicao && this.data.movimentacao) {
      this.preencherFormulario(this.data.movimentacao);
    }
    
    // Atualiza o valor total quando os itens mudam
    this.form.get('itens')?.valueChanges.subscribe(() => {
      this.atualizarValorTotal();
    });
  }
  
  private criarFormulario(): FormGroup {
    if (this.tipoMovimentacao === 'venda') {
      return this.fb.group({
        itens: this.fb.array([]),
        status: [status.PENDENTE, Validators.required],
        observacoes: [''],
        data: [new Date(), Validators.required],
        valorTotal: [0, Validators.min(0)],
        plataforma: [plataforma.LOJA_FISICA, Validators.required],
        formaPagamento: [formaPagamento.DINHEIRO, Validators.required],
        nomeCliente: [''],
        contatoCliente: ['']
      });
    } else {
      return this.fb.group({
        itens: this.fb.array([]),
        status: [status.PENDENTE, Validators.required],
        observacoes: [''],
        data: [new Date(), Validators.required],
        valorTotal: [0, Validators.min(0)],
        fornecedor: ['', Validators.required],
        numeroNota: ['']
      });
    }
  }
  
  private preencherFormulario(movimentacao: Venda | Compra): void {
    // Preencher campos comuns
    this.form.patchValue({
      status: movimentacao.status,
      observacoes: movimentacao.observacoes || '',
      data: movimentacao.data,
      valorTotal: movimentacao.valorTotal
    });
    
    // Limpa e recria os itens
    while (this.itensArray.length) {
      this.itensArray.removeAt(0);
    }
    
    // Adiciona os itens existentes
    for (const item of movimentacao.itens) {
      const produto = this.produtos.find(p => p.id === item.produtoId);
      
      if (produto) {
        this.adicionarItem({
          produtoId: item.produtoId,
          produto: produto,
          quantidade: item.quantidade,
          custoNoMomento: item.custoNoMomento,
          subtotal: item.subtotal
        });
      }
    }
    
    // Preenche campos específicos
    if (this.tipoMovimentacao === 'venda') {
      const venda = movimentacao as Venda;
      this.form.patchValue({
        plataforma: venda.plataforma,
        formaPagamento: venda.formaPagamento,
        nomeCliente: venda.nomeCliente || '',
        contatoCliente: venda.contatoCliente || ''
      });
    } else {
      const compra = movimentacao as Compra;
      this.form.patchValue({
        fornecedor: compra.fornecedor,
        numeroNota: compra.numeroNota || ''
      });
    }
  }
  
  adicionarItem(itemData?: any): void {
    const produto = itemData?.produto || this.produtoSelecionado;
    if (!produto) return;
    
    const quantidade = itemData?.quantidade || this.quantidadeTemp;
    if (quantidade <= 0) return;
    
    console.log('Adicionando item:', produto.nome, 'quantidade:', quantidade);
    
    // Verifica se o produto já está na lista
    const itemExistente = this.itensArray.controls.findIndex(
      control => control.get('produtoId')?.value === produto.id
    );
    
    if (itemExistente !== -1) {
      // Atualiza a quantidade se o produto já estiver na lista
      const control = this.itensArray.at(itemExistente);
      const quantidadeAtual = control.get('quantidade')?.value || 0;
      control.patchValue({
        quantidade: quantidadeAtual + quantidade
      });
      this.calcularSubtotal(itemExistente);
    } else {
      // Adiciona novo item
      const custoNoMomento = this.tipoMovimentacao === 'venda' 
        ? produto.precoVenda 
        : produto.precoCusto;
        
      const novoItem = this.fb.group({
        produtoId: [produto.id, Validators.required],
        produto: [produto], // Para exibição
        quantidade: [quantidade, [Validators.required, Validators.min(1)]],
        custoNoMomento: [custoNoMomento, [Validators.required, Validators.min(0)]],
        subtotal: [custoNoMomento * quantidade]
      });
      
      this.itensArray.push(novoItem);
    }
    
    // Limpa os campos temporários
    this.produtoSelecionado = null;
    this.quantidadeTemp = 1;
    this.atualizarValorTotal();
  }
  
  removerItem(index: number): void {
    this.itensArray.removeAt(index);
    this.atualizarValorTotal();
  }
  
  calcularSubtotal(index: number): void {
    const item = this.itensArray.at(index);
    const quantidade = item.get('quantidade')?.value || 0;
    const custo = item.get('custoNoMomento')?.value || 0;
    item.patchValue({
      subtotal: quantidade * custo
    });
    this.atualizarValorTotal();
  }
  
  updateQuantidade(event: Event, index: number): void {
    const value = (event.target as HTMLInputElement).value;
    const quantidade = parseInt(value) || 0;
    if (quantidade <= 0) return;
    
    const item = this.itensArray.at(index);
    item.get('quantidade')?.setValue(quantidade);
    this.calcularSubtotal(index);
  }
  
  updateCusto(event: Event, index: number): void {
    const value = (event.target as HTMLInputElement).value;
    const custo = parseFloat(value) || 0;
    if (custo < 0) return;
    
    const item = this.itensArray.at(index);
    item.get('custoNoMomento')?.setValue(custo);
    this.calcularSubtotal(index);
  }
  
  atualizarValorTotal(): void {
    const total = this.valorTotal;
    this.form.patchValue({ valorTotal: total });
  }
  
  filtrarProdutos(event: any): void {
    const termo = event.target.value.toLowerCase();
    this.filteredProdutos = this.produtos.filter(produto => 
      produto.nome.toLowerCase().includes(termo) || 
      produto.codigo.toLowerCase().includes(termo)
    );
  }
  
  selecionarProduto(produto: Produto): void {
    this.produtoSelecionado = produto;
  }
  
  enviar(): void {
    if (this.form.invalid || this.itensArray.length === 0) {
      return;
    }
    
    // Remove o campo produto que é apenas para exibição
    const itens: Item[] = this.itensArray.controls.map(control => {
      const values = control.value;
      return {
        produtoId: values.produtoId,
        quantidade: values.quantidade,
        custoNoMomento: values.custoNoMomento,
        subtotal: values.subtotal
      };
    });
    
    const dadosComuns = {
      itens,
      valorTotal: this.form.get('valorTotal')?.value,
      status: this.form.get('status')?.value,
      observacoes: this.form.get('observacoes')?.value || undefined,
      data: this.form.get('data')?.value
    };
    
    let resultado;
    if (this.tipoMovimentacao === 'venda') {
      resultado = {
        ...dadosComuns,
        plataforma: this.form.get('plataforma')?.value,
        formaPagamento: this.form.get('formaPagamento')?.value,
        nomeCliente: this.form.get('nomeCliente')?.value || undefined,
        contatoCliente: this.form.get('contatoCliente')?.value || undefined,
      } as Venda;
    } else {
      resultado = {
        ...dadosComuns,
        fornecedor: this.form.get('fornecedor')?.value,
        numeroNota: this.form.get('numeroNota')?.value || undefined,
      } as Compra;
    }
    
    // Se for edição, mantém o ID original
    if (this.isEdicao && this.data.movimentacao?.id) {
      resultado.id = this.data.movimentacao.id;
    }
    
    this.dialogRef.close(resultado);
  }
  
  cancelar(): void {
    this.dialogRef.close();
  }
}
