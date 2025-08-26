from flask import Flask, request, jsonify
from flask_cors import CORS  # permite o navegador acessar a API
from ia import solution_ai
from trends import data_trends

app = Flask(__name__)
CORS(app)  # habilita CORS para todas as rotas

@app.route("/api/ia", methods=["POST"])
def ia():
    dados = request.get_json()  # recebe JSON do frontend
    
    # Produto do cliente
    product = dados.get("texto1")
    
    # Gerar produtos parecidos
    generated_products = solution_ai(product)

    # Instanciar Produtos Finais
    result_product_final = []

    # Adicionar primeiro produto
    result_product_final.append(product)

    # Adicionar restante
    for result_product in generated_products:
        result_product_final.append(result_product)


    return jsonify({"resultado": result_product_final})

if __name__ == "__main__":
    app.run(debug=True)
