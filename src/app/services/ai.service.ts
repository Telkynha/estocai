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

@Injectable({
  providedIn: 'root'
})
export class AIService {
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
                error: err => item.resolve(Promise.reject(err)),
                finalize: () => {
                  this.activeRequests--;
                  this.pendingRequests.delete(item.id);
                }
              })
            );
          })
        );
      })
    ).subscribe();
  }
  
  /**
   * Enfileira uma requisição para execução controlada
   */
  private enqueueRequest<T>(requestId: string, requestFn: () => Observable<T>): Observable<T> {
    // Verificar se já existe uma requisição igual em andamento
    if (this.pendingRequests.has(requestId)) {
      return this.pendingRequests.get(requestId) as Observable<T>;
    }
    
    // Criar nova requisição enfileirada
    const result = new Observable<T>(observer => {
      const promise = new Promise<T>((resolve, reject) => {
        // Adicionar à fila
        this.requestQueue.next({
          id: requestId,
          task: () => requestFn().pipe(
            tap({
              next: () => this.apiStatusSubject.next({ status: 'success', type: requestId.split('_')[0] }),
              error: err => this.apiStatusSubject.next({ 
                status: 'error', 
                message: `Erro: ${err.message || 'Falha na requisição'}`,
                type: requestId.split('_')[0] 
              })
            })
          ),
          resolve: (value: any) => {
            if (value instanceof Error) {
              reject(value);
            } else {
              resolve(value);
            }
          }
        });
      });
      
      // Converter Promise para Observable
      from(promise).subscribe({
        next: value => {
          observer.next(value);
          observer.complete();
        },
        error: err => observer.error(err)
      });
    });
    
    // Armazenar para reuso em caso de requisições duplicadas
    this.pendingRequests.set(requestId, result);
    
    return result;
  }
  
  /**
   * Manipula erros HTTP de forma consistente
   */
  private handleApiError(error: HttpErrorResponse, fallbackFn: () => Observable<any>, operation: string): Observable<any> {
    console.error(`Erro em operação ${operation}:`, error);
    
    let errorMessage = 'Ocorreu um erro desconhecido';
    
    if (error.error instanceof ErrorEvent) {
      // Erro do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do servidor
      errorMessage = `Código: ${error.status}, Mensagem: ${error.message}`;
      
      // Tratar códigos específicos
      if (error.status === 0) {
        errorMessage = 'Servidor não está respondendo. Verifique sua conexão.';
      } else if (error.status === 429) {
        errorMessage = 'Muitas requisições. Tente novamente em alguns instantes.';
      } else if (error.status === 504) {
        errorMessage = 'Tempo limite esgotado. A requisição demorou muito.';
      }
    }
    
    // Notificar erro via subject
    this.apiStatusSubject.next({ 
      status: 'error', 
      message: errorMessage,
      type: operation
    });
    
    // Retornar fallback
    return fallbackFn();
  }

  /**
   * Gera produtos similares usando a API Python
   */
  generateSimilarProducts(product: string): Observable<string[]> {
    // Implementation code...
    return of(['Produto similar 1', 'Produto similar 2']);
  }

  /**
   * Método de backup para gerar produtos similares localmente
   */
  private generateLocalSimilarProducts(product: string): string[] {
    // Implementation code...
    return [`${product} Premium`, `${product} Básico`];
  }

  /**
   * Obtém dados de tendências para uma lista de produtos
   */
  getTrendsData(products: string[]): Observable<TrendData[]> {
    // Implementation code...
    return of([]);
  }

  /**
   * Gera dados simulados de tendências para demonstração
   */
  private generateMockTrendsData(products: string[]): TrendData[] {
    // Implementation code...
    return [];
  }
  
  /**
   * Método principal que combina as funções de IA e Trends
   */
  analyzeProductTrends(product: string): Observable<TrendData[]> {
    // Implementation code...
    return of([]);
  }

  /**
   * Processa múltiplos produtos em lote para encontrar similares
   */
  batchProcessSimilarProducts(produtos: string[]): Observable<{[key: string]: string[]}> {
    // Implementation code...
    return of({});
  }
  
  /**
   * Processa análise de mercado para múltiplos produtos em lote
   */
  batchProcessMarketAnalysis(produtos: string[], precos?: number[]): Observable<{[key: string]: any}> {
    // Implementation code...
    return of({});
  }
  
  /**
   * Analisa dados de mercado para um produto específico
   */
  analyzeMarketData(produtoNome: string, produtoPreco: number): Observable<MarketAnalysisData> {
    // Implementation code...
    return of({
      similarProducts: [
        {
          nome: produtoNome,
          preco: produtoPreco,
          tendencia: 0,
          vendas: [10, 20, 30, 40, 50, 60]
        }
      ],
      events: ['Evento 1', 'Evento 2']
    });
  }
  
  /**
   * Gera dados de mercado de fallback quando a API não está disponível
   */
  private generateFallbackMarketData(produtoNome: string, produtoPreco: number, similarProducts: string[]): MarketAnalysisData {
    // Implementation code...
    return {
      similarProducts: [],
      events: []
    };
  }
  
  // Métodos auxiliares para geração de dados de mercado
  private generateSimilarPrice(basePrice: number): number { return 0; }
  private generateRandomTrend(): number { return 0; }
  private generateMonthlySales(min: number, max: number): number[] { return []; }
  private getRelevantMarketEvents(): string[] { return []; }
  
  /**
   * Limpa o cache do backend via API
   */
  clearBackendCache(): Observable<any> {
    // Implementation code...
    return of({});
  }
  
  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): Observable<any> {
    // Implementation code...
    return of({});
  }
}
