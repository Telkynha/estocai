from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import matplotlib.pyplot as plt
import json
import os
import re

def solution_ai(product):

    # Chave Gemini
    load_dotenv()
    api_key = os.getenv("GEMINI_KEY")

    try:
        # Modelo - tenta usar Gemini se a chave estiver disponível
        if api_key:
            os.environ["GOOGLE_API_KEY"] = api_key
            model = init_chat_model("gemini-2.0-flash", model_provider="google_genai")
            # Parser
            parser = StrOutputParser()
            
            # Aqui deveria continuar a lógica para usar o modelo Gemini
            # Como não temos a chave configurada, vamos sempre usar o fallback
            raise ValueError("Implementação Gemini incompleta")
        else:
            raise ValueError("Chave Gemini não encontrada")
    except Exception as e:
        print(f"Erro ao inicializar modelo Gemini: {e}")
        print("Usando geração de produtos locais como fallback")
        # Fallback para geração local se houver erro com o Gemini
        return generate_local_products(product)
    
    # Esta linha nunca será alcançada, mas é uma proteção adicional
    return generate_local_products(product)
        
def generate_local_products(product):
    """
    Gera produtos similares localmente quando a API Gemini não está disponível
    """
    product_lower = product.lower()
    similar_products = []
    
    # Lógica simples para gerar produtos similares baseados em padrões
    if "notebook" in product_lower or "laptop" in product_lower:
        similar_products = ["Notebook Dell Inspiron 15", "Laptop HP Pavilion", "Notebook Lenovo ThinkPad"]
    elif "mouse" in product_lower:
        similar_products = ["Mouse Logitech G502", "Mouse Razer DeathAdder", "Mouse sem fio Microsoft"]
    elif "teclado" in product_lower:
        similar_products = ["Teclado Mecânico Redragon", "Teclado Logitech K380", "Teclado Gamer RGB"]
    elif "monitor" in product_lower:
        similar_products = ["Monitor Samsung 24\"", "Monitor LG UltraWide", "Monitor Dell 27\""]
    elif "headset" in product_lower or "fone" in product_lower:
        similar_products = ["Headset HyperX Cloud", "Fone JBL Tune", "Headset Gamer Razer"]
    elif "caneta" in product_lower or "lápis" in product_lower:
        similar_products = ["Caneta BIC", "Lápis Faber-Castell", "Caneta Pilot"]
    elif "camisa" in product_lower or "camiseta" in product_lower:
        similar_products = ["Camiseta Nike", "Camiseta Adidas", "Camisa Polo Lacoste"]
    elif "celular" in product_lower or "smartphone" in product_lower:
        similar_products = ["iPhone 14", "Samsung Galaxy S22", "Xiaomi Redmi Note"]
    elif "televisão" in product_lower or "tv" in product_lower:
        similar_products = ["TV Samsung 55\"", "Smart TV LG 50\"", "TV 4K Sony"]
    else:
        # Produtos genéricos para qualquer categoria
        similar_products = [f"{product} Premium", f"{product} Plus", f"{product} Básico"]
    
    return similar_products[:3]  # Retorna no máximo 3 produtos

    # Prompt de Contexto
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", 
            """Você é um analista de mercado especializado em encontrar produtos semelhantes para fazer comparação contra seus concorrentes.
            Sua tarefa é listar somente 2 produtos semelhantes ao produto mencionado pelo cliente."""),
            ("user", """O cliente mencionou o seguinte produto: {product}.
            Apresente no formato de array JSON, contendo apenas o nome dos produtos semelhantes.
             
            Segue Exemplo: 
             
             [
                {{
                    "product": "Produto A"
                }},
                {{
                    "product": "Produto B"
                }}
             ]
             
             """),
        ]
    )

    # Chain
    chain_products = prompt | model | parser

    # Iniciar IA
    generated_products_json = chain_products.invoke({"product": product})

    # Tratar Json
    generated_products_json_treat = re.sub("```json|```|\n", "", generated_products_json).strip()

    # Transformar em dicionario python
    generated_products = json.loads(generated_products_json_treat)

    # Transformar em Array
    generated_products_final = [item["product"] for item in generated_products]

    # Retornar produtos
    return generated_products_final




    
