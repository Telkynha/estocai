import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressBarModule, MatDividerModule]
})
export class HomeComponent {
  cards = [
    {
      title: 'Total em Estoque',
      value: '1.234',
      icon: 'inventory_2',
      trend: '+5%'
    },
    {
      title: 'Movimentações Hoje',
      value: '47',
      icon: 'swap_horiz',
      trend: '+12%'
    },
    {
      title: 'Produtos Críticos',
      value: '8',
      icon: 'warning',
      trend: '-2%'
    },
    {
      title: 'Valor Total',
      value: 'R$ 45.678',
      icon: 'payments',
      trend: '+8%'
    }
  ];

  newCards = [
    {
      type: 'comparison',
      title: 'Comparativo Mensal',
      icon: 'compare_arrows',
      current: {
        label: 'Este Mês',
        value: 'R$ 67.800',
        percentage: 85
      },
      previous: {
        label: 'Mês Anterior',
        value: 'R$ 54.200',
        percentage: 68
      }
    },
    {
      type: 'timeline',
      title: 'Últimas Atividades',
      icon: 'schedule',
      activities: [
        {
          time: '14:30',
          description: 'Recebimento de mercadoria',
          status: 'success'
        },
        {
          time: '13:15',
          description: 'Saída para expedição',
          status: 'warning'
        },
        {
          time: '11:45',
          description: 'Inventário realizado',
          status: 'info'
        }
      ]
    },
    {
      type: 'distribution',
      title: 'Distribuição por Categoria',
      icon: 'pie_chart',
      total: 'R$ 158.900',
      categories: [
        { name: 'Eletrônicos', percentage: 45, color: '#4CAF50' },
        { name: 'Móveis', percentage: 30, color: '#2196F3' },
        { name: 'Vestuário', percentage: 25, color: '#FFC107' }
      ]
    }
  ];

  largeCards = [
    {
      title: 'Produtos Mais Movimentados',
      icon: 'trending_up',
      items: [
        { name: 'Produto A', value: '234 un.', percentage: 25 },
        { name: 'Produto B', value: '187 un.', percentage: 20 },
        { name: 'Produto C', value: '156 un.', percentage: 17 }
      ]
    },
    {
      title: 'Categorias em Destaque',
      icon: 'category',
      items: [
        { name: 'Eletrônicos', value: 'R$ 25.400', percentage: 35 },
        { name: 'Vestuário', value: 'R$ 18.300', percentage: 28 },
        { name: 'Alimentos', value: 'R$ 12.500', percentage: 22 }
      ]
    },
    {
    title: 'Movimentações Recentes',
    icon: 'history',
    items: [
      { name: 'Entrada - Produto X', value: '500 un.', percentage: 100 },
      { name: 'Saída - Produto Y', value: '150 un.', percentage: 30 },
      { name: 'Entrada - Produto Z', value: '300 un.', percentage: 60 }
    ]
  },
  {
    title: 'Produtos em Baixa',
    icon: 'error_outline',
    items: [
      { name: 'Smartphone XYZ', value: '2 un.', percentage: 10 },
      { name: 'Notebook ABC', value: '3 un.', percentage: 15 },
      { name: 'Monitor LED', value: '4 un.', percentage: 20 }
    ]
  },
  {
    title: 'Desempenho por Fornecedor',
    icon: 'business',
    items: [
      { name: 'Fornecedor Alpha', value: '98%', percentage: 98 },
      { name: 'Fornecedor Beta', value: '85%', percentage: 85 },
      { name: 'Fornecedor Gamma', value: '76%', percentage: 76 }
    ]
  },
  {
    title: 'Vendas por Período',
    icon: 'date_range',
    items: [
      { name: 'Última Semana', value: 'R$ 45.800', percentage: 90 },
      { name: 'Semana Anterior', value: 'R$ 38.200', percentage: 75 },
      { name: 'Há 3 Semanas', value: 'R$ 42.100', percentage: 83 }
    ]
  }
  ];
}