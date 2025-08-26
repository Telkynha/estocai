import pandas as pd
import matplotlib.pyplot as plt
from pytrends.request import TrendReq

def data_trends(result_product_final):

    # Inicia conexão
    pytrends = TrendReq(hl='pt-BR', tz=360)

    # Buscar
    pytrends.build_payload(kw_list=result_product_final, timeframe='today 12-m', geo='BR')
    interest_time = pytrends.interest_over_time()

    # Teste 1
    print("Interesse de Pesquisa ao Longo do Tempo:")
    print(interest_time)

    print("OK 1")

    # Transformar em interest time em dataframe
    interest_time_df = pd.DataFrame(interest_time)
    interest_time_df = interest_time_df.reset_index()

    print("OK 2")

    # Transformar data em date time
    interest_time_df['date'] = pd.to_datetime(interest_time_df['date'], errors='coerce')

    # Extrair dia e mes
    interest_time_df["dia"] = interest_time_df["date"].dt.day
    interest_time_df["mes"] = interest_time_df["date"].dt.month

    print("OK 3")

    # Teste 2
    print("Interesse de Pesquisa ao Longo do Tempo:")
    print(interest_time_df)
    
    # Mapa de sazonalidade
    sazonalidades = [
        {"mes": 1, "dia": 1, "evento": "Ano Novo"},
        {"mes": 1, "dia": 15, "evento": "Volta às aulas"},
        {"mes": 2, "dia": 10, "evento": "Carnaval"},
        {"mes": 3, "dia": 8,  "evento": "início da Páscoa"},
        {"mes": 4, "dia": 15, "evento": "Páscoa "},
        {"mes": 5, "dia": 12, "evento": "Dia das Mães"},
        {"mes": 6, "dia": 12, "evento": "Dia dos Namorados / festas juninas"},
        {"mes": 7, "dia": 10, "evento": "Férias escolares"},
        {"mes": 8, "dia": 11, "evento": "Dia dos Pais / volta às aulas"},
        {"mes": 9, "dia": 15, "evento": "Dia do Cliente"},
        {"mes": 10,"dia": 12, "evento": "Dia das Crianças"},
        {"mes": 11,"dia": 29, "evento": "Black Friday"},
        {"mes": 12,"dia": 25, "evento": "Natal"},
    ]

    # Transformando sazonalidades em dataframe
    df_sazonal = pd.DataFrame(sazonalidades)

    # Juntar tabelas
    interest_time_final = interest_time_df.merge(df_sazonal, on=["mes", "dia"], how="left")

    # Excluir colunas de mes e dia
    interest_time_final = interest_time_final.drop(columns=['mes', 'dia',"isPartial"])

    print(interest_time_final)

    # Data como index
    interest_time_final = interest_time_final.set_index("date")

    # Return
    return interest_time_final

    # Grafico
    #interest_time_final.plot()
    #plt.show()


