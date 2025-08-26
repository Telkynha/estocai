"""
Módulo para processamento em lote de solicitações à API

Este módulo adiciona suporte a análises em lote, permitindo processar múltiplas
solicitações simultaneamente e usando o cache quando disponível.
"""
import concurrent.futures
from cache_manager import get_from_cache, save_to_cache
from ia import solution_ai
import random
import time

def process_batch_products(products, max_workers=3, use_cache=True):
    """
    Processa uma lista de produtos em paralelo, usando o cache quando disponível

    Args:
        products (list): Lista de produtos para processar
        max_workers (int): Número máximo de workers para processamento paralelo
        use_cache (bool): Se deve usar o cache ou não

    Returns:
        dict: Resultados para cada produto
    """
    results = {}
    cache_hits = 0
    cache_misses = 0

    # Primeiro verifica quais produtos já estão em cache
    cached_results = {}
    products_to_process = []

    if use_cache:
        for product in products:
            cache_params = {"product": product}
            cached_data = get_from_cache("ia", cache_params)
            
            if cached_data:
                cached_results[product] = cached_data
                cache_hits += 1
            else:
                products_to_process.append(product)
                cache_misses += 1
    else:
        products_to_process = products

    # Processa apenas os produtos que não estão em cache
    if products_to_process:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Cria um mapeamento de futuros para produtos
            future_to_product = {
                executor.submit(solution_ai, product): product
                for product in products_to_process
            }
            
            # Processa os resultados conforme ficam prontos
            for future in concurrent.futures.as_completed(future_to_product):
                product = future_to_product[future]
                try:
                    similar_products = future.result()
                    
                    # Verifica se o retorno é válido
                    if not similar_products:
                        similar_products = [f"{product} Premium", f"{product} Basic"]
                        
                    # Prepara o resultado
                    result_product_final = [product]
                    for similar in similar_products:
                        result_product_final.append(similar)
                        
                    # Salva no cache
                    cache_params = {"product": product}
                    save_to_cache("ia", cache_params, result_product_final, expiry=3600 * 24)  # 24 horas
                    
                    # Adiciona ao resultado final
                    results[product] = result_product_final
                except Exception as e:
                    print(f"Erro ao processar {product}: {e}")
                    # Fallback em caso de erro
                    results[product] = [product, f"{product} Premium", f"{product} Basic"]

    # Combina resultados do cache com os novos
    results.update(cached_results)

    return {
        "results": results, 
        "stats": {
            "cache_hits": cache_hits,
            "cache_misses": cache_misses,
            "total": len(products)
        }
    }

def process_batch_market_analysis(products, prices=None, max_workers=2):
    """
    Processa análise de mercado em lote para múltiplos produtos

    Args:
        products (list): Lista de nomes de produtos
        prices (list): Lista de preços correspondentes aos produtos
        max_workers (int): Número máximo de workers

    Returns:
        dict: Resultados da análise de mercado para cada produto
    """
    if prices is None:
        # Se não forneceu preços, usa preço padrão 100
        prices = [100] * len(products)
    
    if len(prices) < len(products):
        # Completa com preços padrão se faltarem
        prices.extend([100] * (len(products) - len(prices)))
    
    results = {}
    cache_hits = 0
    cache_misses = 0
    
    # Verificar quais produtos já estão em cache
    for i, product in enumerate(products):
        price = prices[i]
        cache_params = {"produto": product, "preco": price}
        cached_data = get_from_cache("market_analysis", cache_params)
        
        if cached_data:
            results[product] = cached_data
            cache_hits += 1
        else:
            # Se não está em cache, faz a análise e salva
            try:
                # Gerar produtos similares
                similar_products = solution_ai(product)
                
                # Verificar se o retorno é válido
                if not similar_products:
                    similar_products = [f"{product} Premium", f"{product} Basic"]
                
                # Criar estrutura de produtos similares
                produtos_similares = []
                
                # Adicionar produto original primeiro
                produtos_similares.append({
                    "nome": product,
                    "preco": price,
                    "tendencia": round(random.uniform(-5, 10), 1),
                    "vendas": [random.randint(75, 120) for _ in range(6)]
                })
                
                # Adicionar produtos similares
                for produto_similar in similar_products:
                    # Variação de preço entre -20% e +20%
                    variacao = random.uniform(-0.2, 0.2)
                    preco_similar = round(price * (1 + variacao), 2)
                    
                    # Tendência entre -10% e +15%
                    tendencia = round(random.uniform(-10, 15), 1)
                    
                    # Dados de vendas para os últimos 6 meses
                    vendas = [random.randint(50, 150) for _ in range(6)]
                    
                    produtos_similares.append({
                        "nome": produto_similar,
                        "preco": preco_similar,
                        "tendencia": tendencia,
                        "vendas": vendas
                    })
                
                # Eventos de mercado relevantes
                eventos_possiveis = [
                    "Black Friday se aproximando - aumento esperado em vendas",
                    "Volta às aulas - oportunidade para promoções",
                    "Novo lançamento do concorrente principal no próximo mês",
                    "Tendência de alta para produtos importados",
                    "Crescimento acelerado do mercado online",
                    "Dia das mães se aproximando - oportunidade para promoções",
                    "Natal se aproximando - alta demanda para presentes",
                    "Aumento de impostos para produtos importados anunciado"
                ]
                
                # Selecionar 2-3 eventos aleatórios
                num_eventos = random.randint(2, 3)
                eventos = random.sample(eventos_possiveis, num_eventos)
                
                # Montar resposta
                resposta = {
                    "produtos_similares": produtos_similares,
                    "tendencia_original": round(random.uniform(-5, 10), 1),
                    "vendas_original": [random.randint(75, 120) for _ in range(6)],
                    "eventos": eventos
                }
                
                # Salvar no cache
                save_to_cache("market_analysis", cache_params, resposta, expiry=3600)  # Cache por 1 hora
                
                # Adicionar ao resultado
                results[product] = resposta
                cache_misses += 1
                
            except Exception as e:
                print(f"Erro ao processar análise de mercado para {product}: {e}")
                # Usar dados de fallback
                resposta_fallback = {
                    "produtos_similares": [
                        {
                            "nome": product,
                            "preco": price,
                            "tendencia": 5.0,
                            "vendas": [80, 85, 90, 88, 92, 95]
                        },
                        {
                            "nome": f"{product} Premium",
                            "preco": round(price * 1.2, 2),
                            "tendencia": 8.5,
                            "vendas": [70, 75, 85, 90, 95, 100]
                        },
                        {
                            "nome": f"{product} Basic",
                            "preco": round(price * 0.8, 2),
                            "tendencia": 3.2,
                            "vendas": [60, 65, 68, 70, 75, 78]
                        }
                    ],
                    "eventos": ["Aumento de demanda previsto para os próximos meses", "Tendência de crescimento no mercado online"]
                }
                
                results[product] = resposta_fallback
                cache_misses += 1
    
    return {
        "results": results,
        "stats": {
            "cache_hits": cache_hits,
            "cache_misses": cache_misses,
            "total": len(products)
        }
    }
