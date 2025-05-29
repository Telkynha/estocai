import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

interface EstoqueItem {
  codigo: string;
  nome: string;
  categoria: string;
  quantidade: number;
  preco: number;
  fornecedor: string;
  status: string;
}

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [MatTableModule, MatCardModule, CommonModule],
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss']
})
export class EstoqueComponent {
  displayedColumns: string[] = ['codigo', 'nome', 'categoria', 'quantidade', 'preco', 'fornecedor', 'status'];
  dataSource: EstoqueItem[] = [
    {
      codigo: 'P001',
      nome: 'Notebook XYZ',
      categoria: 'Eletrônicos',
      quantidade: 12,
      preco: 3500,
      fornecedor: 'Tech Distribuidora',
      status: 'Disponível'
    },
    {
      codigo: 'P002',
      nome: 'Camiseta Polo',
      categoria: 'Vestuário',
      quantidade: 45,
      preco: 79.9,
      fornecedor: 'Moda Brasil',
      status: 'Disponível'
    },
    {
      codigo: 'P003',
      nome: 'Arroz 5kg',
      categoria: 'Alimentos',
      quantidade: 30,
      preco: 22.5,
      fornecedor: 'Alimentos S/A',
      status: 'Baixo Estoque'
    },
    {
      codigo: 'P004',
      nome: 'Smartphone ABC',
      categoria: 'Eletrônicos',
      quantidade: 5,
      preco: 2100,
      fornecedor: 'Tech Distribuidora',
      status: 'Crítico'
    }
  ];
}