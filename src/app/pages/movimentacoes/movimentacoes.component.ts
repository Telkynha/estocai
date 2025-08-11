import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckbox } from "@angular/material/checkbox";

interface VendaItem {
  codigo: string;
  produto: string;
  quantidade: number;
  valor: number;
  frete: number;
  cliente: string;
  dataVenda: string;
  dataEntrega: string;
  status: string;
}

interface GastoItem {
  codigo: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  fornecedor: string;
  status: string;
}

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [
    MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatChipsModule,
    FormsModule,
    MatCheckbox
],
  templateUrl: './movimentacoes.component.html',
  styleUrl: './movimentacoes.component.scss'
})
export class MovimentacoesComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'selecao',
    'codigo',
    'data',
    'tipo',
    'descricao',
    'categoria',
    'valor',
    'status',
    'acoes'
  ];

  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);

  statusList: string[] = ['Todos', 'Pago', 'Pendente', 'Atrasado'];
  categorias: string[] = ['Todos', 'Vendas', 'Compras', 'Despesas', 'Outros'];

  constructor() {
    this.dataSource = new MatTableDataSource<any>([]);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filtrarPorStatus(status: string) {
    if (status === 'Todos') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = status;
    }
  }

  filtrarPorCategoria(categoria: string) {
    if (categoria === 'Todos') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = categoria;
    }
  }

  novaMovimentacao() {
    console.log('Nova movimentação');
  }

  editarItem(item: any) {
    console.log('Editar:', item);
  }

  excluirItem(item: any) {
    console.log('Excluir:', item);
  }

  exportarSelecionados() {
    console.log('Exportar itens:', this.selection.selected);
  }

}