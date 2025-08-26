import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, from, forkJoin, throwError, Subject, BehaviorSubject, timer } from 'rxjs';
import { map, catchError, switchMap, tap, retry, timeout, delayWhen, retryWhen, concatMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interface para os dados de tendências
export interface TrendData {
  date: Date;
  [key: string]: any; // Para dados dinâmicos com nomes de produtos
  evento?: string;
}

// Interface para produtos similares
export interface SimilarProductResponse {
  product: string;
}

// Interface para produto no mercado
export interface MarketProduct {
  nome: string;
  preco: number;
  tendencia: number;
  vendas: number[];
}

// Interface para dados de mercado
export interface MarketAnalysisData {
  similarProducts: MarketProduct[];
  events: string[];
}

// Interface para a resposta da API Python (backend)
interface MarketAnalysisBackendResponse {
  produtos_similares?: Array<{
    nome: string;
    preco: number;
    tendencia: number;
    vendas: number[];
  }>;
  tendencia_original?: number;
  vendas_original?: number[];
  eventos?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class IaService {
  // Controle de requisições em andamento para prevenir sobrecarga
  private pendingRequests: Map<string, Observable<any>> = new Map();
  private requestQueue: Subject<{ id: string, task: () => Observable<any>, resolve: any }> = new Subject();
  private processingQueue = false;
  private maxConcurrentRequests = 2; // Número máximo de requisições simultâneas
  private activeRequests = 0;
  
  // Subject para status de operações da IA
  private apiStatusSubject = new BehaviorSubject<{
    status: 'idle' | 'loading' | 'error' | 'success';
    message?: string;
    type?: string;
    cached?: boolean;
    progress?: {current: number, total: number};
  }>({ status: 'idle' });
  public apiStatus$ = this.apiStatusSubject.asObservable();
  
  // Lista de sazonalidades
  private readonly SAZONALIDADES = [
    { mes: 1, dia: 1, evento: "Ano Novo" },
    { mes: 1, dia: 15, evento: "Volta às aulas" },
    { mes: 2, dia: 10, evento: "Carnaval" },
    { mes: 3, dia: 8, evento: "início da Páscoa" },
    { mes: 4, dia: 15, evento: "Páscoa" },
    { mes: 5, dia: 12, evento: "Dia das Mães" },
    { mes: 6, dia: 12, evento: "Dia dos Namorados / festas juninas" },
    { mes: 7, dia: 10, evento: "Férias escolares" },
    { mes: 8, dia: 11, evento: "Dia dos Pais / volta às aulas" },
    { mes: 9, dia: 15, evento: "Dia do Cliente" },
    { mes: 10, dia: 12, evento: "Dia das Crianças" },
    { mes: 11, dia: 29, evento: "Black Friday" },
    { mes: 12, dia: 25, evento: "Natal" },
  ];

  constructor(private http: HttpClient) {
    // Inicializar processador de fila de requisições
    this.initRequestQueueProcessor();
  }
  
  /**
   * Inicializa o processador de fila que gerencia as requisições para evitar sobrecarga
   */
  private initRequestQueueProcessor() {
    this.requestQueue.pipe(
      concatMap(item => {
        // Esperar até ter slot disponível
        return new Observable<void>(observer => {
          const checkSlot = () => {
            if (this.activeRequests < this.maxConcurrentRequests) {
              observer.next();
              observer.complete();
            } else {
              // Tentar novamente após 100ms
              setTimeout(checkSlot, 100);
            }
          };
          checkSlot();
        }).pipe(
          switchMap(() => {
            this.activeRequests++;
            
            return item.task().pipe(
              tap({
                next: result => item.resolve(result),
                error: err => item.resolve(throwError(() => err)),
                complete: () => this.activeRequests--
              })
            );
          })
        );
      })
    ).subscribe();
  }
  
  /**
   * Enfileira uma requisição para execução controlada
   * @param id Identificador único da requisição
   * @param task Função que retorna um Observable com a tarefa a ser executada
   */
  private enqueueRequest<T>(id: string, task: () => Observable<T>): Observable<T> {
    // Se já existe uma requisição idêntica pendente, retorna ela
    if (this.pendingRequests.has(id)) {
      return this.pendingRequests.get(id) as Observable<T>;
    }
    
    const observable = new Observable<T>(observer => {
      const resolve = (result: any) => {
        if (result instanceof Observable) {
          result.subscribe({
            next: (val) => observer.next(val),
            error: (err) => observer.error(err),
            complete: () => {
              this.pendingRequests.delete(id);
              observer.complete();
            }
          });
        } else {
          observer.next(result);
          this.pendingRequests.delete(id);
          observer.complete();
        }
      };
      
      // Adicionar a requisição à fila
      this.requestQueue.next({ id, task, resolve });
    });
    
    // Armazenar a requisição pendente
    this.pendingRequests.set(id, observable);
    
    return observable;
  }
  
  /**
   * Manipula erros HTTP de forma consistente
   * @param error O erro HTTP recebido
   * @param message Mensagem de erro personalizada
   */
  private handleError(error: HttpErrorResponse, message: string): Observable<never> {
    this.apiStatusSubject.next({ 
      status: 'error', 
      message: `${message}: ${error.status === 0 ? 
        'Servidor indisponível' : 
        error.error?.message || error.message || 'Erro desconhecido'}`
    });
    
    let errorMsg = `Erro: ${error.message}`;
    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMsg = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      errorMsg = `Código: ${error.status}, Mensagem: ${error.message}`;
    }
    console.error(errorMsg);
    
    // Retorna um Observable de erro para encadear
    return throwError(() => new Error(errorMsg));
  }

  /**
   * Gera produtos similares usando a API Python
   * @param product Nome do produto para encontrar similares
   * @returns Observable com array de nomes de produtos similares
   */
  generateSimilarProducts(product: string): Observable<string[]> {
    this.apiStatusSubject.next({ status: 'loading', message: 'Buscando produtos similares...', type: 'similar' });
    
    // Criar hash para identificar requisições idênticas
    const requestId = `similar_${product.toLowerCase().trim()}`;
    
    return this.enqueueRequest(requestId, () => {
      const endpoint = `${environment.pythonApi.baseUrl}/ia`;
      
      return this.http.post<{
        resultado: string[];
        from_cache?: boolean;
      }>(endpoint, { texto1: product }).pipe(
        timeout(20000),  // Timeout após 20 segundos
        retryWhen(errors => 
          errors.pipe(
            concatMap((error, count) => {
              // Retry no máximo 2 vezes com delay exponencial
              if (count >= 2) {
                return throwError(() => error);
              }
              console.log(`Tentativa ${count+1} para produto ${product}`);
              this.apiStatusSubject.next({ 
                status: 'loading', 
                message: `Tentando novamente (${count+1}/3)...`,
                type: 'similar' 
              });
              return timer(count * 2000); // Esperar 0s, depois 2s
            })
          )
        ),
        map(response => {
          this.apiStatusSubject.next({ 
            status: 'success', 
            message: 'Produtos similares encontrados',
            cached: response.from_cache,
            type: 'similar' 
          });
          return response.resultado || [];
        }),
        catchError(error => {
          console.error('Erro ao buscar produtos similares:', error);
          // Tenta gerar produtos localmente em caso de falha
          const localProducts = this.generateLocalProducts(product);
          this.apiStatusSubject.next({ 
            status: 'error', 
            message: 'Usando dados locais de fallback',
            type: 'similar' 
          });
          return of(localProducts);
        })
      );
    });
  }
  
  /**
   * Método de backup para gerar produtos similares localmente
   * sem depender de API externa
   * @param product Nome do produto para gerar similares
   * @returns Array de produtos similares
   */
  private generateLocalProducts(product: string): string[] {
    const productLower = product.toLowerCase();
    
    // Produtos genéricos para os casos mais comuns
    if (productLower.includes('notebook') || productLower.includes('laptop')) {
      return ['Notebook Acer', 'Laptop Dell', 'MacBook Pro'];
    } else if (productLower.includes('mouse')) {
      return ['Mouse Logitech', 'Mouse Gamer Razer', 'Mouse sem fio Microsoft'];
    } else if (productLower.includes('teclado')) {
      return ['Teclado Mecânico', 'Teclado sem fio', 'Teclado Gamer RGB'];
    } else if (productLower.includes('monitor')) {
      return ['Monitor LG 24"', 'Monitor Samsung Curvo', 'Monitor Gamer 144Hz'];
    } else if (productLower.includes('headset') || productLower.includes('fone')) {
      return ['Headset Gamer', 'Fones de Ouvido Bluetooth', 'Fone com Cancelamento de Ruído'];
    } else if (productLower.includes('celular') || productLower.includes('smartphone')) {
      return ['Smartphone Samsung', 'iPhone', 'Xiaomi Redmi'];
    } else {
      // Para produtos não reconhecidos, gera produtos genéricos
      return [
        'Produto Premium',
        'Versão Econômica',
        'Modelo Avançado'
      ];
    }
  }

  /**
   * Obtém dados de tendências para uma lista de produtos
   * @param products Lista de nomes de produtos
   * @returns Observable com dados de tendências para cada produto
   */
  getTrendsData(products: string[]): Observable<TrendData[]> {
    if (!products || products.length === 0) {
      return of([]);
    }
    
    this.apiStatusSubject.next({ 
      status: 'loading', 
      message: 'Analisando tendências de mercado...',
      type: 'trends'
    });
    
    const requestId = `trends_${products.sort().join('_').toLowerCase().trim()}`;
    
    return this.enqueueRequest(requestId, () => {
      const endpoint = `${environment.pythonApi.baseUrl}/trends`;
      
      return this.http.post<{
        resultado: any; 
        from_cache?: boolean
      }>(endpoint, { produtos: products }).pipe(
        timeout(30000),  // Timeout após 30 segundos
        retryWhen(errors => 
          errors.pipe(
            concatMap((error, count) => {
              if (count >= 2) {
                return throwError(() => error);
              }
              console.log(`Tentativa ${count+1} para tendências`);
              this.apiStatusSubject.next({ 
                status: 'loading', 
                message: `Tentando novamente (${count+1}/3)...`,
                type: 'trends'
              });
              return timer(count * 3000); // Esperar 0s, depois 3s
            })
          )
        ),
        map(response => {
          if (response && response.resultado) {
            // Converter o objeto em um array de dados com datas
            try {
              const trendsData: TrendData[] = [];
              
              // Se resultado já é um array, usá-lo diretamente
              if (Array.isArray(response.resultado)) {
                return response.resultado;
              }
              
              // Formatar para array se for um objeto
              const datas = Object.keys(response.resultado).filter(key => key !== 'sazonalidade');
              
              datas.forEach(dataStr => {
                try {
                  const data = new Date(dataStr);
                  
                  // Criar objeto base com a data
                  const entry: TrendData = { date: data };
                  
                  // Adicionar valores para cada produto
                  products.forEach(product => {
                    if (response.resultado[dataStr] && response.resultado[dataStr][product] !== undefined) {
                      entry[product] = response.resultado[dataStr][product];
                    }
                  });
                  
                  // Adicionar evento se existir para essa data
                  if (response.resultado.sazonalidade && response.resultado.sazonalidade[dataStr]) {
                    entry.evento = response.resultado.sazonalidade[dataStr];
                  }
                  
                  trendsData.push(entry);
                } catch (e) {
                  console.error('Erro ao processar data:', dataStr, e);
                }
              });
              
              this.apiStatusSubject.next({ 
                status: 'success', 
                message: 'Dados de tendências recebidos',
                cached: response.from_cache,
                type: 'trends'
              });
              
              // Ordenar por data
              return trendsData.sort((a, b) => a.date.getTime() - b.date.getTime());
            } catch (e) {
              console.error('Erro ao processar dados de tendências:', e);
              throw e;
            }
          }
          
          return [];
        }),
        catchError(error => {
          console.error('Erro ao obter dados de tendências:', error);
          this.apiStatusSubject.next({ 
            status: 'error', 
            message: 'Usando dados simulados de tendências',
            type: 'trends'
          });
          
          // Gerar dados simulados em caso de falha
          return of(this.generateMockTrendsData(products));
        })
      );
    });
  }
  
  /**
   * Gera dados simulados de tendências para demonstração
   * @param products Lista de produtos para gerar tendências
   * @returns Array de dados de tendências simulados
   */
  private generateMockTrendsData(products: string[]): TrendData[] {
    const data: TrendData[] = [];
    const today = new Date();
    
    // Gerar dados para os últimos 30 dias
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      const entry: TrendData = { date };
      
      // Gerar valores aleatórios para cada produto
      products.forEach(product => {
        // Valor base entre 20-80
        let baseValue = 30 + Math.floor(Math.random() * 50);
        
        // Adicionar tendência ao longo do tempo (crescente ou decrescente)
        const trend = (product.length % 2 === 0) ? 1 : -0.5;
        baseValue += Math.floor((30 - i) * trend);
        
        // Adicionar variação aleatória
        baseValue += Math.floor(Math.random() * 10) - 5;
        
        // Manter dentro de limites razoáveis
        entry[product] = Math.max(10, Math.min(100, baseValue));
      });
      
      // Adicionar eventos sazonais
      const month = date.getMonth() + 1; // Meses em JS são 0-indexed
      const day = date.getDate();
      
      // Verificar se existe alguma sazonalidade próxima
      for (const sazonalidade of this.SAZONALIDADES) {
        if (sazonalidade.mes === month) {
          // Se estamos a 3 dias ou menos do evento, mencionar
          if (Math.abs(sazonalidade.dia - day) <= 3) {
            entry.evento = sazonalidade.evento;
            break;
          }
        }
      }
      
      data.push(entry);
    }
    
    return data;
  }

  /**
   * Analisa dados de mercado para um produto com seu preço
   * @param produto Nome do produto
   * @param preco Preço atual do produto
   * @returns Observable com dados de análise de mercado
   */
  analyzeMarketData(produto: string, preco: number): Observable<MarketAnalysisData> {
    this.apiStatusSubject.next({ 
      status: 'loading', 
      message: 'Analisando mercado...',
      type: 'market'
    });
    
    // Criar um ID único baseado no nome e preço do produto com tratamento para espaços
    const normalizedProduct = produto.toLowerCase().trim().replace(/\s+/g, '_');
    const requestId = `market_${normalizedProduct}_${preco}`;
    
    return this.enqueueRequest(requestId, () => {
      const endpoint = `${environment.pythonApi.baseUrl}/market_analysis`;
      
      return this.http.post<{
        resultado: MarketAnalysisBackendResponse;
        cached?: boolean;
      }>(endpoint, { 
        produto: produto,
        preco: preco
      }).pipe(
        timeout(15000),
        retryWhen(errors => 
          errors.pipe(
            concatMap((error, count) => {
              if (count >= 1) {
                return throwError(() => error);
              }
              this.apiStatusSubject.next({ 
                status: 'loading', 
                message: `Tentando novamente...`,
                type: 'market'
              });
              return timer(2000);
            })
          )
        ),
        map(response => {
          // Adaptar o formato de resposta da API para o formato esperado pelo frontend
          let data: MarketAnalysisData = {
            similarProducts: [],
            events: []
          };
          
          if (response && response.resultado) {
            // Converter o formato do backend para o formato do frontend
            if (response.resultado.produtos_similares) {
              data.similarProducts = response.resultado.produtos_similares.map(p => ({
                nome: p.nome,
                preco: p.preco,
                tendencia: p.tendencia,
                vendas: p.vendas
              }));
            }
            
            if (response.resultado.eventos) {
              data.events = response.resultado.eventos;
            }
          }
          
          this.apiStatusSubject.next({ 
            status: 'success', 
            message: 'Análise de mercado concluída',
            cached: response.cached,
            type: 'market'
          });
          
          return data;
        }),
        catchError(error => {
          console.error('Erro ao analisar mercado:', error);
          
          // Gerar dados simulados de fallback
          const fallbackData: MarketAnalysisData = {
            similarProducts: this.generateMockMarketProducts(produto, preco),
            events: this.generateMockMarketEvents()
          };
          
          this.apiStatusSubject.next({ 
            status: 'error', 
            message: 'Usando dados simulados de mercado',
            type: 'market'
          });
          
          return of(fallbackData);
        })
      );
    });
  }
  
  /**
   * Gera produtos de mercado simulados para demonstração
   * @param produto Nome do produto base
   * @param preco Preço do produto base
   * @returns Array de produtos de mercado simulados
   */
  private generateMockMarketProducts(produto: string, preco: number): MarketProduct[] {
    const products: MarketProduct[] = [];
    
    // Produto original com preço fornecido
    products.push({
      nome: produto,
      preco: preco,
      tendencia: 0,
      vendas: this.generateRandomVendas(true)
    });
    
    // Produtos alternativos simulados
    const localProducts = this.generateLocalProducts(produto);
    
    localProducts.forEach((prod, index) => {
      // Variar preço em relação ao original
      const variance = (Math.random() * 0.4) - 0.2; // -20% a +20%
      const prodPreco = preco * (1 + variance);
      
      products.push({
        nome: prod,
        preco: Math.round(prodPreco * 100) / 100, // Arredondar para 2 casas decimais
        tendencia: Math.floor(Math.random() * 6) - 3, // -3 a +3
        vendas: this.generateRandomVendas()
      });
    });
    
    return products;
  }
  
  /**
   * Gera dados aleatórios de vendas para demonstração
   * @param isOriginal Se é o produto original (para garantir dados consistentes)
   * @returns Array de valores de vendas
   */
  private generateRandomVendas(isOriginal: boolean = false): number[] {
    const vendas = [];
    
    // Últimos 6 meses
    for (let i = 0; i < 6; i++) {
      if (isOriginal) {
        // Dados mais consistentes para o produto original
        vendas.push(Math.floor(80 + Math.random() * 40)); // 80-120
      } else {
        vendas.push(Math.floor(30 + Math.random() * 100)); // 30-130
      }
    }
    
    return vendas;
  }
  
  /**
   * Gera eventos de mercado simulados para demonstração
   * @returns Array de eventos de mercado
   */
  private generateMockMarketEvents(): string[] {
    const events = [
      "Período de promoções se aproximando",
      "Novas tecnologias afetam produtos similares",
      "Mudança de estação pode afetar as vendas"
    ];
    
    // Adicionar eventos sazonais relevantes
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    
    // Encontrar próximos eventos nas sazonalidades
    const proximasEventos = this.SAZONALIDADES
      .filter(s => {
        // Eventos nos próximos 2 meses
        return (s.mes >= mes && s.mes <= mes + 2) || (mes > 10 && s.mes < 3);
      })
      .map(s => `Preparar para ${s.evento}`);
    
    return [...events, ...proximasEventos].slice(0, 4);
  }
  
  /**
   * Processa uma lista de produtos em lote para obter produtos similares
   * @param produtos Lista de produtos para processar
   * @returns Observable com resultados do processamento em lote
   */
  processBatchSimilarProducts(produtos: string[]): Observable<any> {
    if (!produtos || produtos.length === 0) {
      return of({ results: {}, stats: { total: 0, cache_hits: 0, cache_misses: 0 } });
    }
    
    this.apiStatusSubject.next({ 
      status: 'loading', 
      message: 'Processando produtos em lote...',
      type: 'batch' 
    });
    
    const endpoint = `${environment.pythonApi.baseUrl}/batch/similar_products`;
    
    return this.http.post<any>(endpoint, { produtos }).pipe(
      tap(response => {
        this.apiStatusSubject.next({ 
          status: 'success', 
          message: `Processamento em lote concluído (${response.stats.total} produtos)`,
          progress: { current: response.stats.total, total: response.stats.total },
          type: 'batch' 
        });
      }),
      catchError(error => {
        console.error('Erro ao processar lote de produtos:', error);
        this.apiStatusSubject.next({ 
          status: 'error', 
          message: 'Falha ao processar lote',
          type: 'batch'
        });
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Limpa o cache do servidor
   * @returns Observable com resultado da limpeza
   */
  clearCache(): Observable<any> {
    const endpoint = `${environment.pythonApi.baseUrl}/clear_cache`;
    
    return this.http.post<any>(endpoint, {}).pipe(
      tap(_ => {
        console.log('Cache limpo com sucesso');
      }),
      catchError(error => {
        console.error('Erro ao limpar cache:', error);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Obtém estatísticas do cache
   * @returns Observable com estatísticas
   */
  getCacheStats(): Observable<any> {
    const endpoint = `${environment.pythonApi.baseUrl}/cache_stats`;
    
    return this.http.get<any>(endpoint).pipe(
      catchError(error => {
        console.error('Erro ao obter estatísticas do cache:', error);
        return throwError(() => error);
      })
    );
  }
}
