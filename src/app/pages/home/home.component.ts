import { Component } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [MatCardModule, MatIconModule]
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
}