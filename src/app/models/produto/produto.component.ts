import { Categoria } from "../categoria/categoria.component";

export enum StatusEstoque {
    NORMAL = 'normal',
    BAIXO = 'baixo',
    ZERADO = 'zerado'
}

export interface Produto {
    id?: string;
    codigo: string;
    nome: string;
    descricao: string;
    categoria: Array<Categoria>;
    precoVenda: number;
    precoCusto: number;
    estoqueAtual: number;
    estoqueMinimo: number;
    fornecedor?: string;
    observacoes?: string;
    dataCriacao: Date;
    dataAtualizacao: Date;
    ativo: boolean;
    usuarioId: string;
}

export interface Item {
    produtoId: string;
    quantidade: number;
    custoNoMomento: number;
    subtotal: number;
}

export enum status {
    PENDENTE = 0,
    CONCLUIDA = 1,
    CANCELADA = 2  
}