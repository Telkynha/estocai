import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

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
    CommonModule
  ],
  templateUrl: './movimentacoes.component.html',
  styleUrl: './movimentacoes.component.scss'
})
export class MovimentacoesComponent {
  vendasColumns: string[] = ['codigo', 'produto', 'quantidade', 'valor', 'frete', 'cliente', 'dataVenda', 'dataEntrega', 'status'];
  gastosColumns: string[] = ['codigo', 'descricao', 'categoria', 'valor', 'data', 'fornecedor', 'status'];
  
  vendasData: VendaItem[] = [
    {
      codigo: 'V001',
      produto: 'Notebook XYZ',
      quantidade: 1,
      valor: 3500,
      frete: 50,
      cliente: 'João Silva',
      dataVenda: '2025-06-10',
      dataEntrega: '2025-06-15',
      status: 'Em Processamento'
    }

  ];

  gastosData: GastoItem[] = [
    {
      codigo: 'G001',
      descricao: 'Caixas para Embalagem',
      categoria: 'Material de Embalagem',
      valor: 150,
      data: '2025-06-10',
      fornecedor: 'Embalagens Ltd',
      status: 'Pago'
    }

  ];
}