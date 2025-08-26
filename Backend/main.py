from ia import solution_ai
from trends import data_trends
import matplotlib.pyplot as plt

# Pontos a melhorar: 
# Quando a IA gera produtos por similaridades, por exemplo, gera: "Mouse Razer 258G".
# E após isso, joga no trends, o resultado desse produto é x, porém se eu jogar no trends Razer 258G
# O resultado vai ser y.

# Produto do cliente
product = input("Digite o nome do produto: ")

# Gerar produtos parecidos
generated_products = solution_ai(product)

# Instanciar Produtos Finais
result_product_final = []
result_product_final_trends = []

# Adicionar primeiro produto
result_product_final.append(product)

# Adicionar restante
for result_product in generated_products:
    result_product_final.append(result_product)

# Procurar no Trends
result_product_final_trends = data_trends(result_product_final)

# Grafico
#result_product_final_trends.plot()
#plt.show()

