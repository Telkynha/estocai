import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MovimentacaoService } from '../../services/movimentacao.service';
import { ProdutoService } from '../../services/produto.service';
import { DialogService } from '../../services/dialog.service';
import { Item, status } from '../../models/produto/produto.component';
import { Compra } from '../../models/compra/compra.component';
import { Venda, formaPagamento, plataforma } from '../../models/venda/venda.component';
import { StatusClassPipe } from '../../pipes/status-class.pipe';

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [
    StatusClassPipe,
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatMenuModule,
    MatCheckboxModule,
    MatChipsModule,
    FormsModule
  ],
  templateUrl: './movimentacoes.component.html',
  styleUrls: ['./movimentacoes.component.scss']
})
export class MovimentacoesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'selecao',
    'data',
    'tipo',
    'valor',
    'status',
    'acoes'
  ];

  dataSource = new MatTableDataSource<Venda | Compra>();
  selection = new SelectionModel<Venda | Compra>(true, []);

  statusList = [
    { value: status.PENDENTE, label: 'Pendente' },
    { value: status.CONCLUIDA, label: 'Concluída' },
    { value: status.CANCELADA, label: 'Cancelada' }
  ];

  constructor(
    private movimentacaoService: MovimentacaoService,
    private produtoService: ProdutoService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.carregarMovimentacoes();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async carregarMovimentacoes() {
    try {
      const movimentacoes = await this.movimentacaoService.getMovimentacoesByUsuario();
      this.dataSource.data = movimentacoes;
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      this.snackBar.open('Erro ao carregar movimentações', 'Fechar', { duration: 3000 });
    }
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filtrarPorStatus(statusValue: status | null) {
    if (statusValue === null) {
      this.dataSource.filter = '';
      return;
    }

    this.dataSource.filterPredicate = (data: Venda | Compra, filter: string) => {
      return data.status === parseInt(filter);
    };
    this.dataSource.filter = statusValue.toString();
  }

  async novaMovimentacao() {
    // TODO: Implementar dialog de nova movimentação
    this.snackBar.open('Funcionalidade em desenvolvimento', 'Fechar', { duration: 3000 });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  async editarMovimentacao(movimentacao: Venda | Compra) {
    // TODO: Implementar dialog de edição
    this.snackBar.open('Funcionalidade em desenvolvimento', 'Fechar', { duration: 3000 });
  }

  async excluirMovimentacao(movimentacao: Venda | Compra) {
    const isVenda = 'plataforma' in movimentacao;
    const tipo = isVenda ? 'venda' : 'compra';

    const confirmacao = await this.dialogService.openConfirmDialog({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir esta ${tipo}?`,
      type: 'warn'
    });

    if (confirmacao) {
      try {
        if (isVenda) {
          await this.movimentacaoService.deleteVenda(movimentacao.id!);
        } else {
          await this.movimentacaoService.deleteCompra(movimentacao.id!);
        }
        
        this.snackBar.open('Movimentação excluída com sucesso!', 'Fechar', {
          duration: 3000
        });
        await this.carregarMovimentacoes();
      } catch (error) {
        console.error('Erro ao excluir movimentação:', error);
        this.snackBar.open('Erro ao excluir movimentação', 'Fechar', {
          duration: 3000
        });
      }
    }
  }

  getStatusLabel(status: status): string {
    return this.statusList.find(s => s.value === status)?.label || 'Desconhecido';
  }

  getTipoLabel(movimentacao: Venda | Compra): string {
    return 'plataforma' in movimentacao ? 'Venda' : 'Compra';
  }

  formatarValor(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  exportarSelecionados() {
    // TODO: Implementar exportação
    this.snackBar.open('Funcionalidade em desenvolvimento', 'Fechar', { duration: 3000 });
  }
}
