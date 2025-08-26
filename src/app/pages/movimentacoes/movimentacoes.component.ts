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
    'qtdItens',
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

  tipoList = [
    { value: 'venda', label: 'Venda' },
    { value: 'compra', label: 'Compra' }
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
    this.paginator._changePageSize(10);
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
  
  filtrarPorTipo(tipoValue: string | null) {
    if (tipoValue === null) {
      this.dataSource.filter = '';
      return;
    }

    this.dataSource.filterPredicate = (data: Venda | Compra, filter: string) => {
      // Verifica se é uma venda verificando se tem a propriedade 'plataforma' (exclusiva de venda)
      const isVenda = 'plataforma' in data;
      return (isVenda && filter === 'venda') || (!isVenda && filter === 'compra');
    };
    this.dataSource.filter = tipoValue;
  }

  async novaMovimentacao() {
    try {
      // Carrega a lista de produtos para o diálogo
      const produtos = await this.produtoService.getProdutosByUsuario();
      
      // Abre um diálogo para escolher o tipo de movimentação
      const dialogResult = await this.dialogService.openConfirmDialog({
        title: 'Tipo de Movimentação',
        message: 'Qual tipo de movimentação deseja registrar?',
        confirmText: 'Venda',
        cancelText: 'Compra',
        type: 'info'
      });
      
      // Determina o tipo com base na escolha do diálogo
      const tipo = dialogResult === true ? 'venda' : 'compra';
      console.log('Tipo selecionado:', tipo); // Debugging
      
      // Abre o diálogo de criação da movimentação
      const result = await this.dialogService.openMovimentacaoDialog(tipo, produtos);
      
      if (result) {
        if (tipo === 'venda') {
          await this.movimentacaoService.createVenda(result as Venda);
          this.snackBar.open('Venda registrada com sucesso!', 'Fechar', { duration: 3000 });
        } else {
          await this.movimentacaoService.createCompra(result as Compra);
          this.snackBar.open('Compra registrada com sucesso!', 'Fechar', { duration: 3000 });
        }
        
        await this.carregarMovimentacoes();
      }
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      this.snackBar.open('Erro ao criar movimentação', 'Fechar', { duration: 3000 });
    }
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
    try {
      const produtos = await this.produtoService.getProdutosByUsuario();
      const tipo = 'plataforma' in movimentacao ? 'venda' : 'compra';
      
      const result = await this.dialogService.openMovimentacaoDialog(
        tipo, 
        produtos, 
        movimentacao
      );
      
      if (result) {
        if (tipo === 'venda') {
          await this.movimentacaoService.updateVenda(movimentacao.id!, result as Venda);
          this.snackBar.open('Venda atualizada com sucesso!', 'Fechar', { duration: 3000 });
        } else {
          await this.movimentacaoService.updateCompra(movimentacao.id!, result as Compra);
          this.snackBar.open('Compra atualizada com sucesso!', 'Fechar', { duration: 3000 });
        }
        
        await this.carregarMovimentacoes();
      }
    } catch (error) {
      console.error('Erro ao editar movimentação:', error);
      this.snackBar.open('Erro ao editar movimentação', 'Fechar', { duration: 3000 });
    }
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
  
  calcularTotalItens(movimentacao: Venda | Compra): number {
    if (!movimentacao.itens || movimentacao.itens.length === 0) {
      return 0;
    }
    
    // Soma a quantidade de cada item
    return movimentacao.itens.reduce((total, item) => total + item.quantidade, 0);
  }

  exportarSelecionados() {
    if (this.selection.selected.length === 0) {
      this.snackBar.open('Selecione pelo menos uma movimentação para exportar', 'Fechar', { duration: 3000 });
      return;
    }
    
    try {
      // Monta os dados para exportação no formato CSV
      let csv = 'Tipo,Data,Valor,Status,Detalhes\n';
      
      this.selection.selected.forEach(mov => {
        const tipo = this.getTipoLabel(mov);
        const data = mov.data.toLocaleDateString('pt-BR');
        const valor = mov.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        const status = this.getStatusLabel(mov.status);
        
        // Detalhes específicos de cada tipo
        let detalhes = '';
        if ('plataforma' in mov) {
          const venda = mov as Venda;
          detalhes = `Plataforma: ${venda.plataforma}, Cliente: ${venda.nomeCliente || 'N/A'}`;
        } else {
          const compra = mov as Compra;
          detalhes = `Fornecedor: ${compra.fornecedor}, Nota: ${compra.numeroNota || 'N/A'}`;
        }
        
        csv += `"${tipo}","${data}","${valor}","${status}","${detalhes}"\n`;
      });
      
      // Cria um blob com os dados CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      
      // Cria um link para download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.snackBar.open('Exportação concluída com sucesso!', 'Fechar', { duration: 3000 });
    } catch (error) {
      console.error('Erro ao exportar movimentações:', error);
      this.snackBar.open('Erro ao exportar movimentações', 'Fechar', { duration: 3000 });
    }
  }
}
