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
    product_lower = product.lower()
    
    # Produtos específicos para materiais de escritório e canetas
    if 'caneta' in product_lower:
        if 'gel' in product_lower:
            return [
                'Caneta Gel Zebra Sarasa 0.5mm',
                'Caneta Gel Pilot G-2 0.7mm'
            ]
        elif 'esferográfica' in product_lower:
            return [
                'Caneta Esferográfica BIC Cristal',
                'Caneta Esferográfica Faber-Castell'
            ]
        elif 'fineliner' in product_lower or 'ponta fina' in product_lower:
            return [
                'Caneta Fineliner Sharpie 0.4mm',
                'Caneta Fineliner Uni Pin 0.3mm'
            ]
        elif 'pentel' in product_lower:
            return [
                'Caneta Gel Zebra Sarasa 0.5mm',
                'Caneta Gel Uni-ball Signo 0.5mm'
            ]
        else:
            return [
                'Caneta Gel Pentel EnerGel 0.7mm',
                'Caneta BIC Cristal Fina Azul'
            ]
    elif 'lápis' in product_lower:
        return [
            'Lápis Faber-Castell 9000 HB',
            'Lápis Staedtler Mars Lumograph 2B'
        ]
    elif 'caderno' in product_lower:
        return [
            'Caderno Tilibra Universitário 10 Matérias',
            'Caderno Espiral Jandaia Stiff 96 Folhas'
        ]
    elif 'borracha' in product_lower:
        return [
            'Borracha Faber-Castell Super Soft',
            'Borracha Staedtler Mars Plastic'
        ]
    elif 'notebook' in product_lower or 'laptop' in product_lower:
        return ['Notebook Acer Aspire', 'Laptop Dell Inspiron']
    elif 'mouse' in product_lower:
        return ['Mouse Logitech G Pro', 'Mouse Gamer Razer DeathAdder']
    elif 'teclado' in product_lower:
        return ['Teclado Mecânico Redragon', 'Teclado sem fio Logitech']
    elif 'monitor' in product_lower:
        return ['Monitor LG 24"', 'Monitor Samsung Curvo 32"']
    elif 'headset' in product_lower or 'fone' in product_lower:
        return ['Headset Gamer HyperX Cloud', 'Fones de Ouvido Bluetooth JBL']
    elif 'celular' in product_lower or 'smartphone' in product_lower:
        return ['Samsung Galaxy S25', 'iPhone 18 Pro']
    elif 'impressora' in product_lower:
        return ['Impressora HP LaserJet', 'Impressora Epson EcoTank']
    else:
        # Para produtos não identificados, tentar fazer uma análise parcial
        if 'staedtler' in product_lower:
            return [
                'Caneta Rotring Tikky 0.5mm',
                'Caneta Uni-ball Signo 0.7mm'
            ]
        elif 'marca texto' in product_lower or 'marcador' in product_lower:
            return [
                'Marca Texto Stabilo Boss Pastel',
                'Marca Texto Faber-Castell SuperSoft'
            ]
        elif 'sticky notes' in product_lower or 'post-it' in product_lower or 'autoadesivo' in product_lower:
            return [
                'Post-it 3M Tradicional 76x76mm',
                'Bloco Adesivo BRW Neon'
            ]
        else:
            # Para produtos não reconhecidos, gera produtos similares plausíveis
            return [
                'Produto similar da marca Faber-Castell',
                'Produto equivalente da marca Pilot'
            ]

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
    
    # Adicionar o produto original no início da lista de produtos similares
    todos_produtos = [produto_original] + produtos_similares
    
    # Montar resposta
    resposta = {
        "produtos_similares": produtos_similares,
        "produto_original": produto_original,
        "todos_produtos": todos_produtos,
        "tendencia_original": tendencia_original,
        "vendas_original": vendas_original,
        "eventos": eventos_sazonalidade
    }

    return jsonify({"resultado": resposta})

if __name__ == "__main__":
    app.run(debug=True)
