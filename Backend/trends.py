import pandas as pd
import matplotlib.pyplot as plt
from pytrends.request import TrendReq

def data_trends(result_product_final):
    try:
        # Inicia conexão
        pytrends = TrendReq(hl='pt-BR', tz=360)

        # Buscar
        pytrends.build_payload(kw_list=result_product_final[:5], timeframe='today 12-m', geo='BR')  # Limite de 5 produtos
        interest_time = pytrends.interest_over_time()

        # Teste 1
        print("Interesse de Pesquisa ao Longo do Tempo:")
        print(interest_time)

        print("OK 1")
        
        if interest_time.empty:
            print("Nenhum dado de tendências encontrado para os produtos. Usando dados simulados.")
            return generate_mock_trends_data(result_product_final)
    except Exception as e:
        print(f"Erro ao obter dados de tendências: {e}")
        print("Usando dados simulados como fallback")
        return generate_mock_trends_data(result_product_final)

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
    
def generate_mock_trends_data(products):
    """
    Gera dados simulados de tendências para os produtos
    """
    # Lista de sazonalidades para usar nos dados simulados
    sazonalidades = [
        {"mes": 1, "dia": 1,  "evento": "Ano Novo"},
        {"mes": 1, "dia": 15, "evento": "Volta às aulas"},
        {"mes": 2, "dia": 10, "evento": "Carnaval"},
        {"mes": 3, "dia": 8,  "evento": "início da Páscoa"},
        {"mes": 4, "dia": 15, "evento": "Páscoa"},
        {"mes": 5, "dia": 12, "evento": "Dia das Mães"},
        {"mes": 6, "dia": 12, "evento": "Dia dos Namorados / festas juninas"},
        {"mes": 7, "dia": 10, "evento": "Férias escolares"},
        {"mes": 8, "dia": 11, "evento": "Dia dos Pais / volta às aulas"},
        {"mes": 9, "dia": 15, "evento": "Dia do Cliente"},
        {"mes": 10,"dia": 12, "evento": "Dia das Crianças"},
        {"mes": 11,"dia": 29, "evento": "Black Friday"},
        {"mes": 12,"dia": 25, "evento": "Natal"},
    ]
    
    # Criar DataFrame com datas para os últimos 12 meses
    import datetime
    
    today = datetime.datetime.now()
    date_range = pd.date_range(end=today, periods=52, freq='W')  # 52 semanas (aproximadamente 12 meses)
    
    # Criar dataframe base
    df = pd.DataFrame(date_range, columns=['date'])
    
    # Adicionar mês e dia para poder juntar com eventos sazonais
    df['mes'] = df['date'].dt.month
    df['dia'] = df['date'].dt.day
    
    # Criar dados aleatórios para cada produto
    for product in products:
        # Valores base entre 20 e 80
        df[product] = pd.Series(data=list(range(len(df))), index=df.index).map(
            lambda x: int(20 + 60 * (0.5 + 0.5 * pd.np.sin(x / 10)))
        )
    
    # Criar dataframe de eventos
    df_sazonal = pd.DataFrame(sazonalidades)
    
    # Juntar com eventos sazonais
    merged_df = pd.merge(df, df_sazonal, on=['mes', 'dia'], how='left')
    
    # Para cada evento, aumentar valores dos produtos
    for idx, row in merged_df.iterrows():
        if pd.notna(row['evento']):
            for product in products:
                # Aumentar em 20-50%
                current_value = merged_df.loc[idx, product]
                merged_df.loc[idx, product] = min(100, int(current_value * (1.2 + 0.3 * pd.np.random.random())))
    
    # Remover colunas auxiliares
    result_df = merged_df.drop(columns=['mes', 'dia'])
    
    print("Dados simulados gerados para:", products)
    
    return result_df
    return interest_time_final

    # Grafico
    #interest_time_final.plot()
    #plt.show()


