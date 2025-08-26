import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MarketAnalysisResponse {
  original_product: {
    name: string;
    price: string;
  };
  similar_products: Array<{
    name: string;
    price: string;
  }>;
  trends_data: {
    dates: string[];
    values: {
      [key: string]: number[];
    };
  };
  market_insights: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarketAnalysisService {
  constructor(private http: HttpClient) {}

  analyzeProduct(productName: string, productPrice: number): Observable<MarketAnalysisResponse> {
    const endpoint = `${environment.pythonApi.baseUrl}/market_analysis`;
    
    return this.http.post<MarketAnalysisResponse>(endpoint, {
      product_name: productName,
      product_price: productPrice
    }).pipe(
      catchError(error => {
        console.error('Erro na análise de mercado:', error);
        return of({
          original_product: {
            name: productName,
            price: `R$ ${productPrice.toFixed(2)}`
          },
          similar_products: [],
          trends_data: {
            dates: [],
            values: {}
          },
          market_insights: 'Não foi possível realizar a análise de mercado no momento.'
        });
      })
    );
  }
}
