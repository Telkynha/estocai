import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AiTrendsCardComponent } from './components/ai-trends-card.component';

import { ProdutoService } from '../../services/produto.service';
import { MovimentacaoService } from '../../services/movimentacao.service';
import { DialogService } from '../../services/dialog.service';
import { Produto, StatusEstoque } from '../../models/produto/produto.component';
import { Venda, plataforma } from '../../models/venda/venda.component';
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
  imports: [
    MatCardModule, 
    MatIconModule, 
    MatProgressBarModule, 
    MatDividerModule, 
    MatButtonModule,
    MatTableModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FormsModule,
    CommonModule,
    AiTrendsCardComponent
  ]
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

  // Propriedades para os novos cards e tabelas
  produtosCriticos: Produto[] = [];
  produtosMaisVendidos: {produto: Produto, qtdVendida: number}[] = [];
  vendasPorPlataforma: {plataforma: string, total: number, percentual: number}[] = [];
  plataformaColors: {[key: string]: string} = {
    'LOJA_FISICA': '#4CAF50',
    'E_COMMERCE': '#2196F3',
    'APLICATIVO': '#FF9800',
    'OUTRO': '#9C27B0'
  };
  
  // Disponibiliza Enums e Math para o template
  Categoria = Categoria;
  Math = Math;
  
  // Dados para gráfico de tendência de vendas
  tendenciaVendas: {data: string, valor: number}[] = [];
  
  // Colunas para tabela de produtos críticos
  displayedColumns: string[] = ['nome', 'estoqueAtual', 'estoqueMinimo', 'status'];
  
  // Propriedades para análise de tendências com IA
  selectedProductForAnalysis: Produto | null = null;
  isAnalyzing: boolean = false;
  
  constructor(
    private produtoService: ProdutoService,
    private movimentacaoService: MovimentacaoService,
    private dialogService: DialogService,
    private router: Router
  ) {}
  
  async ngOnInit() {
    try {
      this.isLoading = true;
      await this.carregarDados();
      this.atualizarCards();
      this.processarProdutosCriticos();
      this.calcularProdutosMaisVendidos();
      this.calcularVendasPorPlataforma();
      this.calcularTendenciaVendas();
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
  
  // Métodos para os novos cards e funcionalidades
  processarProdutosCriticos() {
    // Identifica produtos com estoque crítico (abaixo do mínimo ou zerado)
    this.produtosCriticos = this.produtos
      .filter(p => p.estoqueAtual <= p.estoqueMinimo)
      .sort((a, b) => {
        // Ordenar: primeiro os zerados, depois por % do estoque em relação ao mínimo
        if (a.estoqueAtual === 0 && b.estoqueAtual > 0) return -1;
        if (b.estoqueAtual === 0 && a.estoqueAtual > 0) return 1;
        
        const percA = a.estoqueMinimo > 0 ? a.estoqueAtual / a.estoqueMinimo : 0;
        const percB = b.estoqueMinimo > 0 ? b.estoqueAtual / b.estoqueMinimo : 0;
        return percA - percB;
      })
      .slice(0, 5); // Limita aos 5 mais críticos
  }
  
  getStatusEstoque(produto: Produto): StatusEstoque {
    if (produto.estoqueAtual === 0) return StatusEstoque.ZERADO;
    if (produto.estoqueAtual <= produto.estoqueMinimo) return StatusEstoque.BAIXO;
    return StatusEstoque.NORMAL;
  }
  
  calcularProdutosMaisVendidos() {
    // Mapa para acompanhar quantidade vendida por produto
    const produtosVendidosMap = new Map<string, {produto: Produto | null, qtdVendida: number}>();
    
    // Filtra apenas vendas concluídas
    const vendasConcluidas = this.movimentacoes.filter(
      mov => 'plataforma' in mov && mov.status === 1 // Status CONCLUIDA
    ) as Venda[];
    
    // Processa cada venda
    vendasConcluidas.forEach(venda => {
      venda.itens.forEach(item => {
        const { produtoId, quantidade } = item;
        
        if (!produtosVendidosMap.has(produtoId)) {
          const produto = this.produtos.find(p => p.id === produtoId) || null;
          produtosVendidosMap.set(produtoId, {produto, qtdVendida: 0});
        }
        
        produtosVendidosMap.get(produtoId)!.qtdVendida += quantidade;
      });
    });
    
    // Converte para array, filtra produtos existentes e ordena
    this.produtosMaisVendidos = Array.from(produtosVendidosMap.values())
      .filter(item => item.produto !== null)
      .sort((a, b) => b.qtdVendida - a.qtdVendida)
      .slice(0, 5) // Top 5 mais vendidos
      .map(item => ({
        produto: item.produto!,
        qtdVendida: item.qtdVendida
      }));
  }
  
  calcularVendasPorPlataforma() {
    // Filtra apenas vendas concluídas
    const vendasConcluidas = this.movimentacoes.filter(
      mov => 'plataforma' in mov && mov.status === 1 // Status CONCLUIDA
    ) as Venda[];
    
    // Mapa para acompanhar valor por plataforma
    const plataformaMap = new Map<number, number>();
    
    // Inicializa mapa com todas as plataformas (valor zero)
    Object.values(plataforma)
      .filter(value => typeof value === 'number')
      .forEach(value => plataformaMap.set(value as number, 0));
    
    // Processa cada venda
    vendasConcluidas.forEach(venda => {
      const plat = venda.plataforma;
      plataformaMap.set(plat, (plataformaMap.get(plat) || 0) + venda.valorTotal);
    });
    
    // Calcula valor total de todas as vendas
    const totalVendas = Array.from(plataformaMap.values())
      .reduce((total, valor) => total + valor, 0);
    
    // Converte para o formato final
    this.vendasPorPlataforma = Array.from(plataformaMap.entries())
      .map(([plat, valor]) => {
        // Obtém nome legível da plataforma
        const nomePlataforma = Object.keys(plataforma)
          .filter(key => isNaN(Number(key)))
          .find((_, index) => index === plat) || 'Desconhecido';
        
        return {
          plataforma: nomePlataforma.replace(/_/g, ' '),
          total: valor,
          percentual: totalVendas > 0 ? Math.round((valor / totalVendas) * 100) : 0
        };
      })
      .filter(item => item.total > 0) // Remove plataformas sem vendas
      .sort((a, b) => b.total - a.total);
  }
  
  calcularTendenciaVendas() {
    // Filtra apenas vendas concluídas
    const vendasConcluidas = this.movimentacoes.filter(
      mov => 'plataforma' in mov && mov.status === 1 // Status CONCLUIDA
    ) as Venda[];
    
    // Obtém data atual
    const hoje = new Date();
    
    // Cria array com os últimos 7 dias
    const ultimos7Dias = Array.from({length: 7}, (_, i) => {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - (6 - i)); // 6 dias atrás até hoje
      return {
        data: data,
        dataStr: data.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}),
        valor: 0
      };
    });
    
    // Processa vendas dos últimos 7 dias
    vendasConcluidas.forEach(venda => {
      const dataVenda = new Date(venda.data);
      
      // Verifica se a venda foi nos últimos 7 dias
      ultimos7Dias.forEach(dia => {
        if (
          dataVenda.getDate() === dia.data.getDate() && 
          dataVenda.getMonth() === dia.data.getMonth() &&
          dataVenda.getFullYear() === dia.data.getFullYear()
        ) {
          dia.valor += venda.valorTotal;
        }
      });
    });
    
    // Converte para o formato final
    this.tendenciaVendas = ultimos7Dias.map(dia => ({
      data: dia.dataStr,
      valor: dia.valor
    }));
  }
  
  // Método para navegar para a página de produtos com estoque crítico
  verProdutosCriticos() {
    this.router.navigate(['/estoque'], { 
      queryParams: { filtro: 'criticos' } 
    });
  }
  
  // Método para navegar para a página de movimentações
  verMovimentacoes() {
    this.router.navigate(['/movimentacoes']);
  }
  
  // Método para calcular altura proporcional da barra no gráfico
  calcularAlturaBarra(valor: number): number {
    if (!this.tendenciaVendas.length) return 0;
    
    const maximo = Math.max(...this.tendenciaVendas.map(i => i.valor));
    if (maximo === 0) return 0;
    
    return Math.round((valor / maximo) * 100);
  }

  // Método para calcular tempo para ressuprimento baseado nas vendas recentes
  calcularTempoRessuprimento(produto: Produto): string {
    const vendasDoItem = this.movimentacoes
      .filter(mov => 
        'plataforma' in mov && 
        mov.status === 1 && 
        mov.itens.some(i => i.produtoId === produto.id)
      ) as Venda[];
    
    // Se não houver vendas, não há como calcular
    if (vendasDoItem.length === 0) {
      return 'N/A';
    }
    
    // Calcula média diária de vendas do item
    let qtdTotalVendida = 0;
    vendasDoItem.forEach(venda => {
      venda.itens.forEach(item => {
        if (item.produtoId === produto.id) {
          qtdTotalVendida += item.quantidade;
        }
      });
    });
    
    // Considera vendas dos últimos 30 dias
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    const vendasRecentes = vendasDoItem.filter(v => v.data >= trintaDiasAtras);
    const mediaDiaria = vendasRecentes.length > 0 
      ? qtdTotalVendida / 30 
      : qtdTotalVendida / Math.max(30, 1); // Evita divisão por zero
    
    // Se a média diária for zero, o estoque durará "indefinidamente"
    if (mediaDiaria <= 0) {
      return 'N/A';
    }
    
    // Calcula dias restantes
    const diasRestantes = Math.round(produto.estoqueAtual / mediaDiaria);
    
    if (diasRestantes <= 0) {
      return 'Esgotado';
    } else if (diasRestantes <= 7) {
      return `${diasRestantes} dias (crítico)`;
    } else if (diasRestantes <= 14) {
      return `${diasRestantes} dias (atenção)`;
    } else {
      return `${diasRestantes} dias`;
    }
  }

  // Cards com estatísticas mais detalhadas
  newCards: AdvancedCard[] = [
    {
      type: 'comparison',
      title: 'Comparativo de Vendas',
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
  
  /**
   * Analisa as tendências de um produto usando a IA
   * Abre um diálogo mostrando um gráfico com as tendências
   */
  // Método removido: analisarTendencias
  // Essa funcionalidade foi movida para o componente AiTrendsCardComponent
}