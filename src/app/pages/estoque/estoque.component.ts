import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

import { ProdutoDialogComponent } from '../../components/forms/produto-dialog/produto-dialog.component';
import { ConfirmDialogComponent } from '../../components/shared/confirm-dialog/confirm-dialog.component';
import { ProdutoService } from '../../services/produto.service';
import { Produto, StatusEstoque } from '../../models/produto/produto.component';
import { Categoria } from '../../models/categoria/categoria.component';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [
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
    ProdutoDialogComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss']
})
export class EstoqueComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Produto>;

  displayedColumns: string[] = [
    'selecao',
    'codigo', 
    'nome', 
    'descricao',
    'categoria', 
    'estoqueAtual',
    'estoqueMinimo', 
    'precoVenda',
    'precoCusto',
    'fornecedor',
    'dataAtualizacao',
    'acoes'
  ];
  
  dataSource = new MatTableDataSource<Produto>();
  selection = new SelectionModel<Produto>(true, []);
  categorias = Object.values(Categoria).filter(value => typeof value === 'number');
  Categoria = Categoria; // Para usar no template
  statusOptions = [
    { value: StatusEstoque.NORMAL, label: 'Normal' },
    { value: StatusEstoque.BAIXO, label: 'Estoque Baixo' },
    { value: StatusEstoque.ZERADO, label: 'Zerado' }
  ];

  constructor(
    private dialog: MatDialog,
    private produtoService: ProdutoService
  ) {}

  async ngOnInit() {
    await this.carregarProdutos();
    this.configureDataSource();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private configureDataSource() {
    // Configura o filtro para buscar apenas por nome
    this.dataSource.filterPredicate = (data: Produto, filter: string) => {
      return data.nome.toLowerCase().includes(filter.toLowerCase());
    };
  }

  getStatusProduto(produto: Produto): StatusEstoque {
    if (produto.estoqueAtual === 0) {
      return StatusEstoque.ZERADO;
    }
    if (produto.estoqueAtual <= produto.estoqueMinimo) {
      return StatusEstoque.BAIXO;
    }
    return StatusEstoque.NORMAL;
  }

  getStatusLabel(produto: Produto): string {
    const status = this.getStatusProduto(produto);
    const statusOption = this.statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.label : 'Normal';
  }

  async carregarProdutos() {
    try {
      const produtos = await this.produtoService.getProdutosByUsuario();
      this.dataSource.data = produtos;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      // Adicionar tratamento de erro adequado
    }
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filtrarPorCategoria(categoria: Categoria | null) {
    if (categoria === null) {
      this.dataSource.filter = '';
      return;
    }

    this.dataSource.filterPredicate = (data: Produto, filter: string) => {
      return data.categoria.includes(Number(filter));
    };
    this.dataSource.filter = categoria.toString();
  }

  filtrarPorStatus(status: StatusEstoque | null) {
    if (status === null) {
      this.dataSource.filter = '';
      return;
    }

    this.dataSource.filterPredicate = (data: Produto, filter: string) => {
      return this.getStatusProduto(data) === filter;
    };
    this.dataSource.filter = status;
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

  async adicionarProduto() {
    const dialogRef = this.dialog.open(ProdutoDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(async (result?: Omit<Produto, 'id' | 'usuarioId' | 'dataCriacao' | 'dataAtualizacao'>) => {
      if (result) {
        try {
          await this.produtoService.createProduto(result);
          await this.carregarProdutos();
        } catch (error) {
          console.error('Erro ao criar produto:', error);
          // Adicionar tratamento de erro adequado
        }
      }
    });
  }

  async editarItem(item: Produto) {
    const dialogRef = this.dialog.open(ProdutoDialogComponent, {
      width: '600px',
      data: item
    });

    dialogRef.afterClosed().subscribe(async (result?: Produto) => {
      if (result && item.id) {
        try {
          await this.produtoService.updateProduto(item.id, result);
          await this.carregarProdutos();
        } catch (error) {
          console.error('Erro ao atualizar produto:', error);
          // Adicionar tratamento de erro adequado
        }
      }
    });
  }

  async excluirItem(item: Produto) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir Produto',
        message: `Tem certeza que deseja excluir o produto "${item.nome}"? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'warn'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) return;
    if (item.id && confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await this.produtoService.deleteProduto(item.id);
        await this.carregarProdutos();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        // Adicionar tratamento de erro adequado
      }
    }
  }

  exportarSelecionados() {
    const itensSelecionados = this.selection.selected;
    console.log('Exportar itens:', itensSelecionados);
    // Implementar lógica de exportação futura
  }
}
