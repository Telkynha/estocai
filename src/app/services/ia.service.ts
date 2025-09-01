import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';

// Interface para os dados de tendências (mantida para compatibilidade)
export interface TrendData {
  date: Date;
  [key: string]: any;
  evento?: string;
}

// Interface para produtos similares
export interface SimilarProductResponse {
  product: string;
}

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private readonly apiUrl = 'http://127.0.0.1:5000';
  private apiStatusSubject = new BehaviorSubject<'idle' | 'loading' | 'success' | 'error'>('idle');
  public apiStatus$ = this.apiStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Gera produtos similares usando a API Python
   * @param product Nome do produto para encontrar similares
   * @returns Observable com array de nomes de produtos similares
   */
  generateSimilarProducts(product: string): Observable<string[]> {
    this.apiStatusSubject.next('loading');
    
    return this.http.post<{resultado: string[]}>(`${this.apiUrl}/api/ia`, {
      texto1: product
    }).pipe(
      map(response => response.resultado || []),
      tap(() => this.apiStatusSubject.next('success')),
      catchError(error => {
        console.error('Erro ao gerar produtos similares:', error);
        this.apiStatusSubject.next('error');
        
        // Fallback com produtos simulados
        const fallbackProducts = this.generateFallbackSimilarProducts(product);
        this.apiStatusSubject.next('success');
        
        return of(fallbackProducts);
      }),
      delay(500) // Pequeno delay para melhor UX
    );
  }

  /**
   * Método de backup para gerar produtos similares localmente
   */
  private generateFallbackSimilarProducts(product: string): string[] {
    const categories = ['Premium', 'Econômico', 'Profissional', 'Básico', 'Plus'];
    const variations = ['Similar', 'Alternativo', 'Compatível'];
    
    return [
      `${product} ${categories[Math.floor(Math.random() * categories.length)]}`,
      `${variations[Math.floor(Math.random() * variations.length)]} ${product}`
    ];
  }

  /**
   * Método legado mantido para compatibilidade
   */
  getTrendsData(products: string[]): Observable<TrendData[]> {
    // Redirecionar para o novo serviço de análise de mercado
    console.warn('getTrendsData é um método legado. Use MarketAnalysisService.analyzeProduct()');
    return of([]);
  }

  /**
   * Método legado mantido para compatibilidade  
   */
  analyzeProductTrends(product: string): Observable<TrendData[]> {
    console.warn('analyzeProductTrends é um método legado. Use MarketAnalysisService.analyzeProduct()');
    return of([]);
  }
}
