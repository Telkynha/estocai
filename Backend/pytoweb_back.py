from flask import Flask, request, jsonify
from flask_cors import CORS  # permite o navegador acessar a API
from ia import solution_ai
from trends import data_trends
from cache_manager import get_from_cache, save_to_cache, clear_expired_cache
from batch_processing import process_batch_products, process_batch_market_analysis
import time
import threading

app = Flask(__name__)
CORS(app)  # habilita CORS para todas as rotas

# Limpa o cache expirado a cada 6 horas
def clear_cache_periodically():
    while True:
        time.sleep(6 * 3600)  # 6 horas
        clear_expired_cache()

# Inicia a thread de limpeza do cache
cache_thread = threading.Thread(target=clear_cache_periodically, daemon=True)
cache_thread.start()

@app.route("/api/ia", methods=["POST"])
def ia():
    try:
        dados = request.get_json()  # recebe JSON do frontend
        
        # Produto do cliente
        product = dados.get("texto1")
        
        if not product:
            return jsonify({"erro": "Produto não especificado", "resultado": []}), 400
        
        # Parâmetros para o cache
        cache_params = {"product": product}
        
        # Verificar se já existe no cache
        cached_data = get_from_cache("ia", cache_params)
        if cached_data:
            print(f"Usando dados em cache para IA de {product}")
            return jsonify({"resultado": cached_data, "cached": True})
        
        # Gerar produtos parecidos
        generated_products = solution_ai(product)
        
        # Verificar se é None ou vazio
        if not generated_products:
            generated_products = [f"{product} Premium", f"{product} Basic"]
        
        # Remover o produto original da lista de produtos similares para evitar duplicação
        generated_products = [p for p in generated_products if p.lower() != product.lower()]
        
        # Instanciar Produtos Finais - primeiro o produto original, depois os similares
        result_product_final = [product] + generated_products
            
        # Salvar no cache antes de retornar
        save_to_cache("ia", cache_params, result_product_final, expiry=3600 * 24)  # Cache por 24 horas
        
        return jsonify({"resultado": result_product_final, "cached": False})
    except Exception as e:
        print(f"Erro em /api/ia: {e}")
        # Fallback em caso de erro
        return jsonify({"resultado": [product, f"{product} Premium", f"{product} Basic"]})

@app.route("/api/trends", methods=["POST"])
def trends():
    try:
        dados = request.get_json()  # recebe JSON do frontend
        
        # Lista de produtos para analisar tendências
        products = dados.get("produtos", [])
        
        if not products:
            return jsonify({"error": "Nenhum produto enviado", "resultado": "{}"}), 400
        
        # Verificar limite de produtos para evitar sobrecarga
        if len(products) > 5:
            products = products[:5]  # Limitar a 5 produtos
        
        # Parâmetros para o cache
        cache_params = {"produtos": sorted(products)}  # Ordenar para consistência
        
        # Verificar se já existe no cache
        cached_data = get_from_cache("trends", cache_params)
        if cached_data:
            print(f"Usando dados em cache para trends de {products}")
            return jsonify({"resultado": cached_data, "cached": True})
            
        # Buscar dados de tendências
        try:
            trends_data = data_trends(products)
            
            # Verificar se trends_data é None
            if trends_data is None:
                # Se for None, gerar dados simulados
                import pandas as pd
                import numpy as np
                import datetime
                
                # Criar dados simulados
                today = datetime.datetime.now()
                dates = pd.date_range(end=today, periods=52, freq='W')
                df = pd.DataFrame(dates, columns=['date'])
                
                for prod in products:
                    df[prod] = np.random.randint(20, 80, size=len(df))
                
                # Adicionar evento
                df['evento'] = None
                df.loc[len(df)-1, 'evento'] = "Tendência recente"
                
                trends_data = df
            
            # Converter DataFrame para formato JSON
            trends_json = trends_data.to_json(orient='table', date_format='iso')
            
            # Salvar no cache antes de retornar
            save_to_cache("trends", cache_params, trends_json, expiry=3600 * 12)  # Cache por 12 horas
            
            return jsonify({"resultado": trends_json, "cached": False})
            
        except Exception as inner_e:
            print(f"Erro interno em /api/trends: {inner_e}")
            # Criar resposta de fallback
            import pandas as pd
            import numpy as np
            import datetime
            
            today = datetime.datetime.now()
            dates = pd.date_range(end=today, periods=52, freq='W')
            df = pd.DataFrame(dates, columns=['date'])
            
            for prod in products:
                df[prod] = np.random.randint(20, 80, size=len(df))
            
            # Adicionar evento
            df['evento'] = None
            df.loc[len(df)-1, 'evento'] = "Tendência recente"
            
            trends_json = df.to_json(orient='table', date_format='iso')
            
            return jsonify({"resultado": trends_json})
    except Exception as e:
        print(f"Erro ao processar tendências: {e}")
        return jsonify({"error": str(e)}), 500
            
    except Exception as outer_e:
        print(f"Erro externo em /api/trends: {outer_e}")
        # Em caso de erro total, criar uma resposta de emergência
        return jsonify({"resultado": "{\"schema\":{\"fields\":[{\"name\":\"date\",\"type\":\"datetime\"},{\"name\":\"produto\",\"type\":\"integer\"}],\"primaryKey\":[\"date\"],\"pandas_version\":\"1.4.0\"},\"data\":[{\"date\":\"2025-08-25T00:00:00.000Z\",\"produto\":50}]}"})

@app.route("/api/market_analysis", methods=["POST"])
def market_analysis():
    try:
        dados = request.get_json()
        
        produto = dados.get("produto")
        preco = dados.get("preco", 0)
        
        if not produto:
            return jsonify({"error": "Produto não especificado"}), 400
        
        # Parâmetros para o cache
        cache_params = {"produto": produto, "preco": preco}
        
        # Verificar se já existe no cache
        cached_data = get_from_cache("market_analysis", cache_params)
        if cached_data:
            print(f"Usando dados em cache para market_analysis de {produto}")
            return jsonify({"resultado": cached_data, "cached": True})
        
        # Gerar produtos similares
        from ia import solution_ai
        similar_products = solution_ai(produto)
        
        # Verificar se o retorno é válido
        if not similar_products:
            similar_products = [f"{produto} Premium", f"{produto} Basic"]
        
        # Simular dados de mercado
        import random
        
        # Criar estrutura de produtos similares
        produtos_similares = []
        
        # Adicionar produto original primeiro com tendência inicial
        tendencia_original = round(random.uniform(-5, 10), 1)
        vendas_original = [random.randint(75, 120) for _ in range(6)]
        
        produtos_similares.append({
            "nome": produto,
            "preco": preco,
            "tendencia": tendencia_original,
            "vendas": vendas_original.copy()
        })
        
        # Adicionar produtos similares - filtrando para não duplicar o original
        filtered_similars = [p for p in similar_products if p.lower() != produto.lower()]
        for produto_similar in filtered_similars:
            # Variação de preço entre -20% e +20%
            variacao = random.uniform(-0.2, 0.2)
            preco_similar = round(preco * (1 + variacao), 2)
            
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
        
        # Montar resposta - usando os mesmos valores já gerados para o produto original
        resposta = {
            "produtos_similares": produtos_similares,
            "tendencia_original": tendencia_original,
            "vendas_original": vendas_original,
            "eventos": eventos
        }
        
        # Salvar no cache antes de retornar
        save_to_cache("market_analysis", cache_params, resposta, expiry=3600)  # Cache por 1 hora
        
        return jsonify({"resultado": resposta, "cached": False})
        
    except Exception as e:
        print(f"Erro em /api/market_analysis: {e}")
        # Fallback em caso de erro
        import random
        
        # Usar valores padrão em caso de erro
        produto_nome = dados.get("produto", "Produto") if 'dados' in locals() else "Produto"
        produto_preco = dados.get("preco", 100) if 'dados' in locals() else 100
        
        # Gerar dados de fallback
        produtos_fallback = [
            {
                "nome": produto_nome,
                "preco": produto_preco,
                "tendencia": 5.0,
                "vendas": [80, 85, 90, 88, 92, 95]
            },
            {
                "nome": f"{produto_nome} Premium",
                "preco": round(produto_preco * 1.2, 2),
                "tendencia": 8.5,
                "vendas": [70, 75, 85, 90, 95, 100]
            },
            {
                "nome": f"{produto_nome} Basic",
                "preco": round(produto_preco * 0.8, 2),
                "tendencia": 3.2,
                "vendas": [60, 65, 68, 70, 75, 78]
            }
        ]
        
        resposta_fallback = {
            "produtos_similares": produtos_fallback,
            "eventos": ["Aumento de demanda previsto para os próximos meses", "Tendência de crescimento no mercado online"]
        }
        
        return jsonify({"resultado": resposta_fallback})

@app.route("/api/cache_stats", methods=["GET"])
def cache_stats():
    """
    Retorna estatísticas do cache para monitoramento
    """
    try:
        from cache_manager import get_cache_stats
        stats = get_cache_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/clear_cache", methods=["POST"])
def clear_cache():
    """
    Limpa o cache expirado manualmente
    """
    try:
        from cache_manager import clear_expired_cache
        removed = clear_expired_cache()
        return jsonify({
            "success": True,
            "removed": removed,
            "message": f"Cache limpo: {removed} arquivos removidos"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/batch/similar_products", methods=["POST"])
def batch_similar_products():
    """
    Processa múltiplos produtos em lote para encontrar similares,
    usando processamento paralelo e cache
    """
    try:
        dados = request.get_json()
        
        produtos = dados.get("produtos", [])
        use_cache = dados.get("use_cache", True)
        max_workers = dados.get("max_workers", 3)
        
        if not produtos:
            return jsonify({"error": "Lista de produtos vazia"}), 400
            
        # Limitar número de produtos para evitar sobrecarga
        if len(produtos) > 10:
            return jsonify({"error": "Máximo de 10 produtos por lote"}), 400
            
        # Processar em lote
        result = process_batch_products(produtos, max_workers, use_cache)
        
        return jsonify(result)
    except Exception as e:
        print(f"Erro ao processar lote de produtos: {e}")
        return jsonify({"error": str(e)}), 500
        
@app.route("/api/batch/market_analysis", methods=["POST"])
def batch_market_analysis():
    """
    Processa análise de mercado para múltiplos produtos em lote
    """
    try:
        dados = request.get_json()
        
        produtos = dados.get("produtos", [])
        precos = dados.get("precos")
        max_workers = dados.get("max_workers", 2)
        
        if not produtos:
            return jsonify({"error": "Lista de produtos vazia"}), 400
            
        # Limitar número de produtos para evitar sobrecarga
        if len(produtos) > 5:
            return jsonify({"error": "Máximo de 5 produtos por lote"}), 400
            
        # Processar em lote
        result = process_batch_market_analysis(produtos, precos, max_workers)
        
        return jsonify(result)
    except Exception as e:
        print(f"Erro ao processar lote de análises de mercado: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
