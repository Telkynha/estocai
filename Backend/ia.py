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
    os.getenv("GEMINI_KEY")

    # Modelo
    model = init_chat_model("gemini-2.0-flash", model_provider="google_genai")

    # Parser
    parser = StrOutputParser()

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




    
