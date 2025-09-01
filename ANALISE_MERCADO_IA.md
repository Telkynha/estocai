# 🤖 Análise de Mercado com IA - Funcionalidade EstocaI

## 📋 Visão Geral
Esta funcionalidade implementa uma análise de mercado **100% front-end** usando APIs gratuitas para ajudar comerciantes a entenderem melhor o posicionamento de seus produtos no mercado brasileiro.

## ✨ Funcionalidades Principais

### 1. **Busca de Produtos Similares/Concorrentes**
- 🔍 Busca automática no Mercado Livre Brasil
- 📊 Encontra até 2 produtos similares baseado no nome do produto
- 💰 Compara preços automaticamente
- 📈 Mostra dados de vendas quando disponíveis

### 2. **Análise de Preços**
- 📊 Gráfico comparativo de preços
- 🎯 Insights sobre posicionamento de preço
- 💡 Sugestões de ajustes de preço baseadas na concorrência

### 3. **Análise de Interesse de Busca**
- 🔍 Score de interesse (0-100) baseado em dados do mercado
- 📈 Gráfico de tendências dos últimos 12 meses (simulado)
- 🏷️ Consultas relacionadas ao produto
- 📅 Análise de sazonalidade

### 4. **Eventos de Mercado**
- 🎉 Feriados nacionais relevantes para varejo
- 🛍️ Eventos como Black Friday, Natal, Dia das Mães
- 📅 Timeline dos próximos 60 dias

### 5. **Insights Inteligentes**
- 🧠 Análise automática de posicionamento
- 💡 Recomendações de estratégia
- 📊 Interpretação dos dados de mercado

## 🛠️ Como Usar

### No Estoque
1. Vá para a página **Estoque**
2. Clique no menu de ações (⋮) de qualquer produto
3. Selecione **"Análise de Mercado"**
4. Aguarde o carregamento da análise

### Na Dashboard
1. Na página **Home**, vá até a seção "Análise de Mercado com IA"
2. Clique em **"Demonstrar Análise"**
3. Será aberta uma análise com um produto de exemplo

## 🌐 APIs Utilizadas (Todas Gratuitas)

### 📱 Mercado Livre API
- **Endpoint**: `https://api.mercadolibre.com/sites/MLB/search`
- **Uso**: Busca de produtos, preços e dados de vendas
- **Limitações**: Rate limit da API pública

### 🇧🇷 Brasil API
- **Endpoint**: `https://brasilapi.com.br/api/feriados/v1/`
- **Uso**: Feriados nacionais e eventos relevantes
- **Limitações**: Apenas feriados oficiais

### 🔍 Análise de Interesse
- **Método**: Algoritmo proprietário baseado em dados do ML
- **Uso**: Calcula score de interesse e tendências
- **Limitações**: Estimativas baseadas em vendas históricas

## 📊 Estrutura dos Dados

### Produto Concorrente
```typescript
interface CompetitorProduct {
  id: string;
  title: string;
  price: number;
  soldQuantity?: number;
  monthlySalesEstimate?: number;
  searchVolume?: number; // 0-100
  marketShare?: number; // percentual
}
```

### Interesse de Busca
```typescript
interface SearchInterest {
  currentScore: number; // 0-100
  trend: TrendPoint[]; // últimos 12 meses
  relatedQueries: string[];
  seasonality: 'alta' | 'baixa' | 'estável';
}
```

### Evento de Mercado
```typescript
interface MarketEvent {
  date: string;
  name: string;
  type: 'holiday' | 'seasonal' | 'economic';
  impact: 'high' | 'medium' | 'low';
  marketingRelevance: boolean;
}
```

## 🎨 Interface do Usuário

### Abas Disponíveis
1. **📊 Comparação de Preços** - Gráfico de barras horizontal
2. **📈 Análise de Vendas** - Gráfico de linha com vendas dos concorrentes
3. **🔍 Tendências de Busca** - Gráfico temporal + consultas relacionadas

### Cards de Insights
- **💰 Posicionamento de Preço** - Se está caro, barato ou na média
- **📈 Tendência de Vendas** - Análise do mercado e sazonalidade
- **🔍 Volume de Buscas** - Interesse do consumidor pelo produto

## ⚙️ Configuração Técnica

### Serviços Utilizados
- `MarketIntelService` - Orquestra todas as análises
- `MarketAnalysisDialogComponent` - Interface do usuário
- APIs externas - Dados em tempo real

### Tratamento de Erros
- ✅ Fallback quando APIs estão indisponíveis
- ✅ Dados simulados para demonstração
- ✅ Mensagens de erro amigáveis
- ✅ Retry automático em algumas situações

### Performance
- 🚀 Requests paralelos quando possível
- ⏱️ Timeout de 10 segundos por requisição
- 📦 Cache local para reduzir chamadas
- 🔄 Loading states informativos

## 🔧 Customização

### Adicionando Novos Insights
1. Edite `MarketIntelService.buildInsights()`
2. Adicione nova lógica de análise
3. Atualize o template para mostrar novos dados

### Adicionando Novas APIs
1. Implemente novo método no `MarketIntelService`
2. Adicione tratamento de CORS se necessário
3. Integre nos fluxos existentes

### Personalizando Análises
- Ajuste fatores sazonais em `getSeasonalFactor()`
- Modifique algoritmos de score em `calculateInterestScore()`
- Customize eventos relevantes em `isRetailRelevant()`

## 🚀 Próximos Passos Sugeridos

1. **🔒 Autenticação de APIs** - Para aumentar rate limits
2. **📱 APIs Adicionais** - Amazon, Shopee, Magazine Luiza
3. **🤖 IA Real** - Integração com GPT ou Claude para insights mais precisos
4. **📊 Histórico** - Salvar análises para comparação temporal
5. **📧 Alertas** - Notificações quando preços de concorrentes mudam
6. **📈 Previsões** - ML para prever tendências futuras

## 🐛 Troubleshooting

### "Não foi possível obter dados de mercado"
- Verifique conexão com internet
- API do Mercado Livre pode estar temporariamente indisponível
- Tente novamente em alguns minutos

### "Sem produtos similares encontrados"
- Nome do produto pode ser muito específico
- Tente termos mais genéricos
- Produto pode não existir no Mercado Livre

### Dados inconsistentes
- APIs externas podem ter variações
- Alguns produtos não têm dados de vendas
- Estimativas são baseadas em algoritmos próprios

## 📞 Suporte
Para dúvidas ou melhorias, consulte a documentação do código ou entre em contato com a equipe de desenvolvimento.

---
**🎯 Objetivo**: Democratizar a inteligência de mercado para pequenos e médios comerciantes usando tecnologia 100% gratuita e acessível.
