from flask import Flask, request, jsonify
from flask_cors import CORS  # permite o navegador acessar a API
from ia import solution_ai
from trends import data_trends
import random
import datetime

app = Flask(__name__)
CORS(app)  # habilita CORS para todas as rotas

# Função local para simular a resposta da IA sem depender da API Gemini
def local_solution_ai(product):
    """
    Gera produtos similares localmente sem usar a API Gemini
    """
    if not product:
        return ["Produto Similar A", "Produto Similar B"]
    
    product_lower = product.lower()
    
    # Lista de marcas comuns para sugerir alternativas
    marcas_comuns = [
        "Samsung", "Apple", "Dell", "HP", "Lenovo", "Acer", "LG", "Sony", "Asus", 
        "Philips", "BIC", "Faber-Castell", "Tilibra", "Pilot", "3M", "Stabilo",
        "Pentel", "Sharpie", "Staedtler", "Uni-ball", "Zebra", "Tramontina",
        "Mondial", "Electrolux", "Brastemp", "Arno", "Consul", "Multilaser",
        "JBL", "Logitech", "Razer", "HyperX", "SteelSeries", "Corsair", "AOC"
    ]
    
    # Extrair a marca do produto original, se presente
    produto_marca = None
    for marca in marcas_comuns:
        if marca.lower() in product_lower:
            produto_marca = marca
            break
    
    # Identificar a categoria do produto com base em palavras-chave
    categorias = {
        'escritorio': ['caneta', 'lápis', 'borracha', 'caderno', 'fichário', 'pasta', 'grampeador', 
                      'clipe', 'marca texto', 'post-it', 'sticky notes', 'papel', 'impressora', 'toner'],
        'tecnologia': ['notebook', 'laptop', 'computador', 'monitor', 'mouse', 'teclado', 'headset', 
                      'fone', 'celular', 'smartphone', 'tablet', 'adaptador', 'carregador', 'webcam'],
        'eletrodomestico': ['geladeira', 'fogão', 'microondas', 'liquidificador', 'batedeira', 
                           'cafeteira', 'aspirador', 'ferro', 'ventilador', 'ar condicionado'],
        'ferramentas': ['chave', 'martelo', 'furadeira', 'alicate', 'serra', 'parafuso', 'prego',
                       'trena', 'nível', 'lixa', 'pinca', 'solda', 'broca']
    }
    
    # Detectar a categoria do produto
    categoria_produto = 'geral'
    for categoria, palavras_chave in categorias.items():
        for palavra in palavras_chave:
            if palavra in product_lower:
                categoria_produto = categoria
                break
        if categoria_produto != 'geral':
            break
    
    # Extrair palavras-chave do nome do produto
    palavras = product_lower.split()
    
    # Gerar produtos similares
    produtos_similares = []
    
    # Tenta gerar produtos similares baseados em categoria e características
    if categoria_produto == 'escritorio':
        if 'caneta' in product_lower:
            tipo_caneta = None
            if 'gel' in product_lower:
                tipo_caneta = 'Gel'
            elif 'esferográfica' in product_lower:
                tipo_caneta = 'Esferográfica'
            elif 'fineliner' in product_lower or 'ponta fina' in product_lower:
                tipo_caneta = 'Fineliner'
            else:
                tipo_caneta = 'Esferográfica'
                
            # Gerar marcas diferentes da original
            marcas_caneta = ["Pilot", "BIC", "Pentel", "Faber-Castell", "Uni-ball", "Zebra", "Staedtler", "Sharpie"]
            if produto_marca:
                marcas_caneta = [m for m in marcas_caneta if m != produto_marca]
                
            produtos_similares = [
                f"Caneta {tipo_caneta} {marcas_caneta[0]} Premium",
                f"Caneta {tipo_caneta} {marcas_caneta[1]} Standard"
            ]
        elif 'caderno' in product_lower:
            marcas_caderno = ["Tilibra", "Foroni", "Jandaia", "Spiral", "Faber-Castell", "Credeal", "Oxford"]
            if produto_marca:
                marcas_caderno = [m for m in marcas_caderno if m != produto_marca]
                
            produtos_similares = [
                f"Caderno Universitário {marcas_caderno[0]} 10 Matérias",
                f"Caderno Espiral {marcas_caderno[1]} Capa Dura"
            ]
        elif 'marca texto' in product_lower or 'marcador' in product_lower:
            marcas_marca_texto = ["Stabilo", "Pilot", "BIC", "Faber-Castell", "CIS"]
            if produto_marca:
                marcas_marca_texto = [m for m in marcas_marca_texto if m != produto_marca]
                
            produtos_similares = [
                f"Marca Texto {marcas_marca_texto[0]} Neon",
                f"Marca Texto {marcas_marca_texto[1]} Pastel"
            ]
    elif categoria_produto == 'tecnologia':
        if any(item in product_lower for item in ['notebook', 'laptop']):
            marcas_notebook = ["Dell", "Lenovo", "Samsung", "Acer", "HP", "Asus", "Apple"]
            if produto_marca:
                marcas_notebook = [m for m in marcas_notebook if m != produto_marca]
                
            produtos_similares = [
                f"Notebook {marcas_notebook[0]} Core i5 8GB 256GB SSD",
                f"Notebook {marcas_notebook[1]} Ryzen 5 16GB 512GB SSD"
            ]
        elif 'mouse' in product_lower:
            marcas_mouse = ["Logitech", "Razer", "Redragon", "HyperX", "Corsair", "SteelSeries"]
            if produto_marca:
                marcas_mouse = [m for m in marcas_mouse if m != produto_marca]
                
            produtos_similares = [
                f"Mouse {marcas_mouse[0]} Wireless Ergonômico",
                f"Mouse Gamer {marcas_mouse[1]} RGB"
            ]
    
    # Se ainda não conseguiu gerar produtos similares, use uma abordagem mais genérica
    if not produtos_similares:
        # Escolher marcas diferentes da marca original
        marcas_disponiveis = [m for m in marcas_comuns if produto_marca is None or m != produto_marca]
        
        # Escolher duas marcas aleatórias
        import random
        random.shuffle(marcas_disponiveis)
        marca1 = marcas_disponiveis[0]
        marca2 = marcas_disponiveis[1]
        
        # Criar produtos genéricos com as marcas selecionadas
        produto_base = ' '.join([p for p in palavras if p.lower() not in [m.lower() for m in marcas_comuns]])
        if not produto_base.strip():
            produto_base = "Produto similar"
            
        produtos_similares = [
            f"{produto_base} {marca1}",
            f"{produto_base} {marca2}"
        ]
    
    return produtos_similares

@app.route("/api/ia", methods=["POST"])
def ia():
    dados = request.get_json()  # recebe JSON do frontend
    
    # Produto do cliente
    product = dados.get("texto1")
    
    try:
        # Tentar usar a IA real
        generated_products = solution_ai(product)
    except Exception as e:
        # Em caso de erro, usar a solução local
        print(f"Erro ao usar a IA: {e}")
        generated_products = local_solution_ai(product)

    # Instanciar Produtos Finais
    result_product_final = []

    # Adicionar primeiro produto
    result_product_final.append(product)

    # Adicionar restante
    for result_product in generated_products:
        result_product_final.append(result_product)


    return jsonify({"resultado": result_product_final})

@app.route("/api/market_analysis", methods=["POST"])
def market_analysis():
    dados = request.get_json()  # recebe JSON do frontend
    print(f"Dados recebidos: {dados}")
    
    # Produto do cliente e preço - agora recebidos diretamente como valores
    produto = dados.get("produto", "")
    preco = dados.get("preco", 0)
    
    # Verificar se o preço é válido
    if isinstance(preco, str):
        try:
            preco = float(preco.replace(',', '.'))
        except ValueError:
            preco = 0
            
    print(f"Analisando produto: {produto}, preço: {preco}")
    
    try:
        # Tentar usar a IA real
        generated_products = solution_ai(produto)
    except Exception as e:
        # Em caso de erro, usar a solução local
        print(f"Erro ao usar a IA para market_analysis: {e}")
        generated_products = local_solution_ai(produto)
    
    # Gerar dados para produtos similares
    produtos_similares = []
    
    # Adicionar produtos gerados pela IA com dados de mercado simulados
    product_lower = produto.lower()
    
    # Gerar dados mais específicos baseados no tipo de produto
    if 'marca texto' in product_lower or 'marcador' in product_lower:
        # Para marca texto, preços específicos
        for idx, product_name in enumerate(generated_products):
            # Variação de preço para marca texto (entre -25% e +15%)
            if 'stabilo' in product_name.lower():
                # Marca texto Stabilo tende a ser mais cara
                base_price = preco * 1.15
                price_variation = random.uniform(-0.10, 0.20)
            else:
                base_price = preco * 0.9
                price_variation = random.uniform(-0.25, 0.10)
            
            product_price = base_price * (1 + price_variation)
            
            # Tendência positiva em época de volta às aulas
            current_month = datetime.datetime.now().month
            if current_month in [1, 2, 8]:  # Janeiro, Fevereiro, Agosto
                tendencia = random.uniform(5, 18)  # Tendência mais positiva
            else:
                tendencia = random.uniform(-5, 10)
            
            # Dados de vendas específicos para marca texto
            base_sales = [50, 55, 40, 60, 70, 75]
            vendas_variation = [random.uniform(0.8, 1.2) for _ in range(6)]
            vendas = [int(base * var) for base, var in zip(base_sales, vendas_variation)]
            
            volume_busca = int(random.uniform(60, 90))
            
            produtos_similares.append({
                "nome": product_name,
                "preco": product_price,
                "tendencia": tendencia,
                "vendas": vendas,
                "volumeBusca": volume_busca
            })
    elif 'sticky notes' in product_lower or 'post-it' in product_lower or 'autoadesivo' in product_lower:
        # Para sticky notes/post-its
        for idx, product_name in enumerate(generated_products):
            if '3m' in product_name.lower():
                base_price = preco * 1.2
                price_variation = random.uniform(-0.10, 0.15)
            else:
                base_price = preco * 0.85
                price_variation = random.uniform(-0.20, 0.10)
            
            product_price = base_price * (1 + price_variation)
            
            current_month = datetime.datetime.now().month
            if current_month in [1, 2, 8]:
                tendencia = random.uniform(3, 15)
            else:
                tendencia = random.uniform(-8, 5)
            
            base_sales = [45, 40, 35, 50, 60, 55]
            vendas_variation = [random.uniform(0.8, 1.2) for _ in range(6)]
            vendas = [int(base * var) for base, var in zip(base_sales, vendas_variation)]
            
            volume_busca = int(random.uniform(55, 85))
            
            produtos_similares.append({
                "nome": product_name,
                "preco": product_price,
                "tendencia": tendencia,
                "vendas": vendas,
                "volumeBusca": volume_busca
            })
    elif 'caneta' in product_lower:
        # Para canetas, preços menos variáveis e padrões mais específicos
        for idx, product_name in enumerate(generated_products):
            # Variação de preço mais controlada para canetas (entre -20% e +20%)
            if 'gel' in product_name.lower():
                # Canetas gel tendem a ser mais caras
                base_price = preco * 1.1
                price_variation = random.uniform(-0.15, 0.25)
            elif 'fineliner' in product_name.lower():
                # Fineliner preços similares
                base_price = preco * 0.95
                price_variation = random.uniform(-0.10, 0.20)
            else:
                base_price = preco
                price_variation = random.uniform(-0.20, 0.15)
                
            product_price = base_price * (1 + price_variation)
            
            # Tendências mais específicas para material escolar
            # Em agosto (volta às aulas) tendência é positiva
            current_month = datetime.datetime.now().month
            if current_month in [1, 2, 8]:  # Janeiro, Fevereiro, Agosto
                tendencia = random.uniform(2, 15)  # Tendência positiva (volta às aulas)
            elif current_month in [6, 7]:  # Junho, Julho
                tendencia = random.uniform(-10, 5)  # Tendência variável (férias)
            else:
                tendencia = random.uniform(-8, 8)  # Tendência normal
            
            # Dados de vendas mais específicos para material escolar
            base_sales = [40, 35, 30, 45, 55, 65]  # Modelo base de vendas
            vendas_variation = [random.uniform(0.7, 1.3) for _ in range(6)]  # Variação para cada mês
            vendas = [int(base * var) for base, var in zip(base_sales, vendas_variation)]
            
            # Volume de busca mais específico (material escolar tem busca média-alta)
            volume_busca = int(random.uniform(50, 85))
            
            produtos_similares.append({
                "nome": product_name,
                "preco": product_price,
                "tendencia": tendencia,
                "vendas": vendas,
                "volumeBusca": volume_busca
            })
    else:
        # Para outros produtos, usar o algoritmo geral
        for idx, product_name in enumerate(generated_products):
            # Variação de preço aleatória em relação ao preço original
            price_variation = random.uniform(-0.3, 0.3)  # -30% a +30%
            product_price = preco * (1 + price_variation)
            
            # Tendência de mercado (positiva ou negativa)
            tendencia = random.uniform(-15, 15)
            
            # Dados de vendas simulados para os últimos 6 meses
            vendas = [int(random.uniform(10, 100)) for _ in range(6)]
            
            # Volume de busca (popularidade) de 0 a 100
            volume_busca = int(random.uniform(20, 95))
            
            produtos_similares.append({
                "nome": product_name,
                "preco": product_price,
                "tendencia": tendencia,
                "vendas": vendas,
                "volumeBusca": volume_busca
            })
    
    # Eventos de sazonalidade relevantes para o mercado
    # Personalizar eventos baseados no tipo de produto
    eventos_sazonalidade = [
        "Aumento de vendas previsto para Black Friday (Novembro)",
        "Pico de demanda em Dezembro (Natal)",
    ]
    
    # Adicionar eventos específicos para material escolar
    if 'caneta' in product_lower or 'lápis' in product_lower or 'caderno' in product_lower:
        eventos_sazonalidade.extend([
            "Picos de vendas esperados para Volta às Aulas (Janeiro/Fevereiro)",
            "Aumento na demanda durante retorno escolar (Agosto)"
        ])
    else:
        eventos_sazonalidade.append("Promoções esperadas em Julho (Férias)")
    
    # Gerar dados para o produto original
    tendencia_original = random.uniform(2, 10) if random.random() > 0.3 else random.uniform(-8, 2)
    
    # Criar padrão de vendas para o produto original (mais consistente)
    base_sales_original = [50, 45, 40, 55, 70, 65]  # Modelo base de vendas
    vendas_variation_original = [random.uniform(0.85, 1.15) for _ in range(6)]  # Variação menor para o produto original
    vendas_original = [int(base * var) for base, var in zip(base_sales_original, vendas_variation_original)]
    
    # Criar produto original para incluir na resposta
    produto_original = {
        "nome": produto,
        "preco": preco,
        "tendencia": tendencia_original,
        "vendas": vendas_original,
        "volumeBusca": int(random.uniform(60, 90))  # Produto original geralmente tem mais buscas
    }
    
    # Adicionar o produto original no início da lista de produtos similares para que apareça corretamente na comparação
    todos_produtos = [produto_original] + produtos_similares
    
    # O frontend espera o produto original como parte da lista de produtos similares
    # Então vamos incluir o produto original na lista de produtos similares
    produtos_similares_com_original = [produto_original] + produtos_similares
    
    # Montar resposta
    resposta = {
        "produtos_similares": produtos_similares_com_original,
        "produto_original": produto_original,
        "todos_produtos": todos_produtos,
        "tendencia_original": tendencia_original,
        "vendas_original": vendas_original,
        "eventos": eventos_sazonalidade
    }

    return jsonify({"resultado": resposta})

if __name__ == "__main__":
    app.run(debug=True)
