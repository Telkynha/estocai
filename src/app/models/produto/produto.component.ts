export interface Produto {
    id?: string;
    codigo: string;
    nome: string;
    descricao: string;
    categoria: string;
    precoVenda: number;
    precoCusto: number;
    estoqueAtual: number;
    estoqueMinimo: number;
    fornecedor?: string;
    observacoes?: string;
    dataCriacao: Date;
    dataAtualizacao: Date;
    ativo: boolean;
}