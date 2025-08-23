import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ProdutoService } from '../../services/produto.service';
import { MovimentacaoService } from '../../services/movimentacao.service';
import { Produto } from '../../models/produto/produto.component';
import { Venda } from '../../models/venda/venda.component';
import { Compra } from '../../models/compra/compra.component';
import { Categoria } from '../../models/categoria/categoria.component';

// Interfaces para tipagem dos cards
interface DashboardCard {
  title: string;
  value: string;
  icon: string;
  trend: string;
}

interface ComparisonCard {
  type: 'comparison';
  title: string;
  icon: string;
  current: {
    label: string;
    value: string;
    percentage: number;
  };
  previous: {
    label: string;
    value: string;
    percentage: number;
  };
}

interface ActivityItem {
  time: string;
  description: string;
  status: 'success' | 'warning' | 'info';
}

interface TimelineCard {
  type: 'timeline';
  title: string;
  icon: string;
  activities: ActivityItem[];
}

interface CategoryItem {
  name: string;
  percentage: number;
  color: string;
}

interface DistributionCard {
  type: 'distribution';
  title: string;
  icon: string;
  total: string;
  categories: CategoryItem[];
}

type AdvancedCard = ComparisonCard | TimelineCard | DistributionCard;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressBarModule, MatDividerModule, CommonModule]
})
export class HomeComponent implements OnInit {
  // Principais cards do dashboard
  cards: DashboardCard[] = [
    {
      title: 'Total em Estoque',
      value: '0',
      icon: 'inventory_2',
      trend: '0%'
    },
    {
      title: 'Movimentações Hoje',
      value: '0',
      icon: 'swap_horiz',
      trend: '0%'
    },
    {
      title: 'Produtos Críticos',
      value: '0',
      icon: 'warning',
      trend: '0%'
    },
    {
      title: 'Valor Total',
      value: 'R$ 0,00',
      icon: 'payments',
      trend: '0%'
    }
  ];
  
  // Produtos e movimentações
  produtos: Produto[] = [];
  movimentacoes: (Venda | Compra)[] = [];
  
  // Estado de carregamento
  isLoading = true;

  constructor(
    private produtoService: ProdutoService,
    private movimentacaoService: MovimentacaoService
  ) {}
  
  async ngOnInit() {
    try {
      this.isLoading = true;
      await this.carregarDados();
      this.atualizarCards();
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  // Método auxiliar para tipar os cards no template
  getCardAs<T extends AdvancedCard>(card: AdvancedCard, type: 'comparison' | 'timeline' | 'distribution'): T | null {
    if (card.type === type) {
      return card as unknown as T;
    }
    return null;
  }
  
  // Métodos específicos para cada tipo de card
  getComparisonCard(card: AdvancedCard): ComparisonCard | null {
    if (card.type === 'comparison') {
      return card as ComparisonCard;
    }
    return null;
  }
  
  getTimelineCard(card: AdvancedCard): TimelineCard | null {
    if (card.type === 'timeline') {
      return card as TimelineCard;
    }
    return null;
  }
  
  getDistributionCard(card: AdvancedCard): DistributionCard | null {
    if (card.type === 'distribution') {
      return card as DistributionCard;
    }
    return null;
  }
  
  async carregarDados() {
    // Carrega produtos e movimentações em paralelo
    [this.produtos, this.movimentacoes] = await Promise.all([
      this.produtoService.getProdutosByUsuario(),
      this.movimentacaoService.getMovimentacoesByUsuario()
    ]);
  }
  
  atualizarCards() {
    this.atualizarCardsBasicos();
    this.atualizarComparativoMensal();
    this.atualizarUltimasAtividades();
    this.atualizarDistribuicaoCategoria();
  }
  
  atualizarCardsBasicos() {
    // Card 1: Total de itens em estoque
    const totalItensEstoque = this.produtos.reduce((total, produto) => total + produto.estoqueAtual, 0);
    this.cards[0].value = totalItensEstoque.toString();
    
    // Card 2: Movimentações hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const movimentacoesHoje = this.movimentacoes.filter(
      mov => mov.data.getTime() >= hoje.getTime()
    );
    
    this.cards[1].value = movimentacoesHoje.length.toString();
    
    // Calcular tendência comparando com ontem
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    const movimentacoesOntem = this.movimentacoes.filter(
      mov => mov.data.getTime() >= ontem.getTime() && mov.data.getTime() < hoje.getTime()
    );
    
    const tendenciaMovimentacoes = movimentacoesOntem.length > 0 
      ? ((movimentacoesHoje.length - movimentacoesOntem.length) / movimentacoesOntem.length * 100).toFixed(0)
      : '0';
    
    this.cards[1].trend = tendenciaMovimentacoes + '%';
    
    // Card 3: Produtos com estoque crítico
    const produtosCriticos = this.produtos.filter(
      p => p.estoqueAtual <= p.estoqueMinimo && p.estoqueAtual > 0
    );
    
    const produtosZerados = this.produtos.filter(p => p.estoqueAtual === 0);
    
    const totalCriticos = produtosCriticos.length + produtosZerados.length;
    this.cards[2].value = totalCriticos.toString();
    
    // Card 4: Valor total do estoque
    const valorTotalEstoque = this.produtos.reduce(
      (total, produto) => total + (produto.precoVenda * produto.estoqueAtual), 0
    );
    
    this.cards[3].value = 'R$ ' + valorTotalEstoque.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Calcular tendência do valor (comparando com o custo total)
    const valorCustoTotal = this.produtos.reduce(
      (total, produto) => total + (produto.precoCusto * produto.estoqueAtual), 0
    );
    
    const margemMedia = valorCustoTotal > 0 
      ? ((valorTotalEstoque - valorCustoTotal) / valorCustoTotal * 100).toFixed(0) 
      : '0';
    
    this.cards[3].trend = margemMedia + '%';
  }
  
  atualizarComparativoMensal() {
    // Obtém o mês atual e o mês anterior
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth();
    const anoAtual = dataAtual.getFullYear();
    
    // Primeiro dia do mês atual
    const primeiroDiaMesAtual = new Date(anoAtual, mesAtual, 1);
    
    // Primeiro dia do mês anterior
    const primeiroDiaMesAnterior = new Date(anoAtual, mesAtual - 1, 1);
    
    // Último dia do mês anterior
    const ultimoDiaMesAnterior = new Date(anoAtual, mesAtual, 0);
    
    // Filtra vendas por período
    const vendasMesAtual = this.movimentacoes.filter(mov => 
      'plataforma' in mov && // Garante que é uma venda
      mov.data >= primeiroDiaMesAtual
    ) as Venda[];
    
    const vendasMesAnterior = this.movimentacoes.filter(mov => 
      'plataforma' in mov && // Garante que é uma venda
      mov.data >= primeiroDiaMesAnterior && 
      mov.data <= ultimoDiaMesAnterior
    ) as Venda[];
    
    // Calcula total de vendas
    const totalVendasMesAtual = vendasMesAtual.reduce(
      (total, venda) => total + venda.valorTotal, 0
    );
    
    const totalVendasMesAnterior = vendasMesAnterior.reduce(
      (total, venda) => total + venda.valorTotal, 0
    );
    
    // Valor máximo entre os dois meses para calcular percentuais
    const valorMaximo = Math.max(totalVendasMesAtual, totalVendasMesAnterior);
    
    // Atualiza o card de comparativo mensal
    const comparativoCard = this.newCards[0] as ComparisonCard;
    
    comparativoCard.current.value = 'R$ ' + totalVendasMesAtual.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    comparativoCard.previous.value = 'R$ ' + totalVendasMesAnterior.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Calcula percentuais para as barras de progresso
    comparativoCard.current.percentage = valorMaximo > 0 
      ? Math.round((totalVendasMesAtual / valorMaximo) * 100) 
      : 0;
    
    comparativoCard.previous.percentage = valorMaximo > 0 
      ? Math.round((totalVendasMesAnterior / valorMaximo) * 100) 
      : 0;
  }
  
  atualizarUltimasAtividades() {
    // Ordena movimentações por data (mais recentes primeiro)
    const movimentacoesRecentes = [...this.movimentacoes]
      .sort((a, b) => b.data.getTime() - a.data.getTime())
      .slice(0, 5); // Limita a 5 atividades mais recentes
    
    // Mapeia as movimentações para o formato de atividades do card
    const atividades = movimentacoesRecentes.map(mov => {
      // Formata a hora
      const hora = mov.data.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Determina se é venda ou compra e cria a descrição
      const isVenda = 'plataforma' in mov;
      const descricao = isVenda 
        ? `Venda de ${mov.itens.length} item(s)` 
        : `Compra de ${mov.itens.length} item(s)`;
      
      // Define o status com base no status da movimentação
      let status: 'success' | 'warning' | 'info' = 'info';
      
      switch (mov.status) {
        case 0: // PENDENTE
          status = 'warning';
          break;
        case 1: // CONCLUÍDA
          status = 'success';
          break;
        case 2: // CANCELADA
          status = 'info';
          break;
      }
      
      return {
        time: hora,
        description: descricao,
        status: status
      };
    });
    
    // Atualiza o card de atividades
    const timelineCard = this.newCards[1] as TimelineCard;
    timelineCard.activities = atividades;
  }
  
  atualizarDistribuicaoCategoria() {
    // Agrupa produtos por categoria e calcula o valor total de cada
    const categoriaMap = new Map<number, { total: number, nome: string }>();
    
    // Lista de cores para as categorias
    const cores = [
      '#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0',
      '#3F51B5', '#E91E63', '#607D8B', '#009688', '#673AB7'
    ];
    
    // Valor total do estoque
    let valorTotal = 0;
    
    // Processa todos os produtos
    this.produtos.forEach(produto => {
      const valorProduto = produto.precoVenda * produto.estoqueAtual;
      valorTotal += valorProduto;
      
      // Agrupa por cada categoria do produto
      produto.categoria.forEach(catId => {
        if (!categoriaMap.has(catId)) {
          // Importa nome da categoria do enum
          const nomesCategoria = Object.keys(Categoria)
            .filter(key => isNaN(Number(key)));
          
          categoriaMap.set(catId, {
            total: 0,
            nome: nomesCategoria[catId] || `Categoria ${catId}`
          });
        }
        
        // Adiciona o valor do produto na categoria
        categoriaMap.get(catId)!.total += valorProduto / produto.categoria.length;
      });
    });
    
    // Ordena categorias por valor total (maior para menor)
    const categoriasOrdenadas = Array.from(categoriaMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5); // Limita às 5 principais categorias
    
    // Calcula percentuais e formata para o card
    const categorias = categoriasOrdenadas.map((cat, index) => {
      const percentual = valorTotal > 0 
        ? Math.round((cat[1].total / valorTotal) * 100) 
        : 0;
      
      return {
        name: cat[1].nome.replace(/_/g, ' '),
        percentage: percentual,
        color: cores[index % cores.length]
      };
    });
    
    // Atualiza o card de distribuição por categoria
    const distribuicaoCard = this.newCards[2] as DistributionCard;
    distribuicaoCard.categories = categorias;
    distribuicaoCard.total = 'R$ ' + valorTotal.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Cards com estatísticas mais detalhadas
  newCards: AdvancedCard[] = [
    {
      type: 'comparison',
      title: 'Comparativo Mensal',
      icon: 'compare_arrows',
      current: {
        label: 'Este Mês',
        value: 'R$ 0,00',
        percentage: 0
      },
      previous: {
        label: 'Mês Anterior',
        value: 'R$ 0,00',
        percentage: 0
      }
    },
    {
      type: 'timeline',
      title: 'Últimas Atividades',
      icon: 'schedule',
      activities: []
    },
    {
      type: 'distribution',
      title: 'Distribuição por Categoria',
      icon: 'pie_chart',
      total: 'R$ 0,00',
      categories: []
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