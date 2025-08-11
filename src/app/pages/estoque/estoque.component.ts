import { Component, ViewChild } from '@angular/core';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule, MatCheckbox } from '@angular/material/checkbox';

interface EstoqueItem {
  codigo: string;
  nome: string;
  categoria: string;
  quantidade: number;
  preco: number;
  precoCompra: number;
  fornecedor: string;
  status: string;
  ultimaAtualizacao: Date;
}

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [
    MatTableModule,
    MatCardModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    FormsModule,
    MatMenuModule,
    MatChipsModule,
    MatCheckbox
],
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss']
})
export class EstoqueComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<EstoqueItem>;

  displayedColumns: string[] = [
    'selecao',
    'codigo', 
    'nome', 
    'categoria', 
    'quantidade', 
    'preco',
    'precoCompra',
    'fornecedor', 
    'status',
    'ultimaAtualizacao',
    'acoes'
  ];
  
  dataSource: MatTableDataSource<EstoqueItem>;
  categorias: string[] = ['Todos', 'Eletrônicos', 'Vestuário', 'Alimentos'];
  statusFiltros: string[] = ['Todos', 'Disponível', 'Baixo Estoque', 'Crítico'];
  itensSelecionados: EstoqueItem[] = [];

  constructor() {
    const dados = this.getDadosIniciais();
    this.dataSource = new MatTableDataSource(dados);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filtrarPorCategoria(categoria: string) {
    if (categoria === 'Todos') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = categoria;
    }
  }

  filtrarPorStatus(status: string) {
    if (status === 'Todos') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = status;
    }
  }

  onSelecaoChange(item: EstoqueItem) {
    const index = this.itensSelecionados.indexOf(item);
    if (index === -1) {
      this.itensSelecionados.push(item);
    } else {
      this.itensSelecionados.splice(index, 1);
    }
  }

  editarItem(item: EstoqueItem) {
    console.log('Editar:', item);
    // Implementar lógica de edição
  }

  excluirItem(item: EstoqueItem) {
    console.log('Excluir:', item);
    // Implementar lógica de exclusão
  }

  exportarSelecionados() {
    console.log('Exportar itens:', this.itensSelecionados);
    // Implementar lógica de exportação
  }

  private getDadosIniciais(): EstoqueItem[] {
    return [
      {
        codigo: 'P001',
        nome: 'Notebook XYZ',
        categoria: 'Eletrônicos',
        quantidade: 12,
        preco: 3500,
        precoCompra: 3000,
        fornecedor: 'Tech Distribuidora',
        status: 'Disponível',
        ultimaAtualizacao: new Date()
      },
      // ... adicionar mais itens de exemplo
    ];
  }
}